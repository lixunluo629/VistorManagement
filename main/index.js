const { app, BrowserWindow, ipcMain } = require('electron');
const { PosPrinter } = require('electron-pos-printer');
const QRCode = require('qrcode');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
let mainWindow;
let mainWin;
let readerProcess = null;
let serialPortInstance = null;
const configPath = path.join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'config.json');

async function createWindow(isLogin = true) {
    await loadConfig();
    // 根据是否为登录窗口设置不同尺寸
    const windowOptions = isLogin ? {
        // 登录窗口：小尺寸，非全屏
        width: 300,          // 窗口宽度
        height: 400,         // 窗口高度
        frame: false,        // 隐藏系统边框和标题栏
        resizable: false,    // 禁止窗口缩放
        movable: true,       // 允许窗口拖动
        show: false
    } : {
        fullscreen: true, // 主窗口全屏
        frame: false,      // 主窗口隐藏边框（可选）
        show: false
    };

    mainWindow = new BrowserWindow({
        ...windowOptions,
        title: "访客准入系统",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 加载应用页面
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).then(r => {
    });

    // 开发环境打开调试工具
    mainWindow.webContents.openDevTools({mode: 'detach'});

    // 窗口关闭事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // 确保页面渲染完成后再显示
    if (isLogin) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.show();
        });
    }
    return mainWindow;
}

// 监听登录成功事件，切换到主窗口
ipcMain.on('switch-to-main-window', () => {
    if (mainWindow) mainWindow.close(); // 关闭登录窗口
    mainWin = createWindow(false); // 创建全屏主窗口
    mainWin.webContents.on('did-finish-load', () => {
        mainWin.webContents.executeJavaScript(`window.location.hash = '#/main';`).then(r => {});
    });
    // 修正：使用新创建的 mainWin 实例调用 show()
    setTimeout(() => {
        mainWin.show(); // 这里改为 mainWin，而非 mainWindow
    }, 1000);
});

// 关闭应用事件处理
ipcMain.on('close-app', () => {
    if (process.platform !== 'darwin') app.quit();
    else mainWindow.hide();
});

// 应用生命周期管理
app.whenReady().then(() => createWindow(true));
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(true);
});

function logToDevTools(type, message) {
    if (mainWin && mainWin.webContents) {
        // 通过 IPC 发送到渲染进程
        mainWin.webContents.send('main-process-log', {
            type: type, // 'log'、'error'、'warn' 等
            message: message
        });
    }
}

// 读取配置文件的函数
async function loadConfig() {
    try {
        // 读取文件内容
        const configContent = await fs.readFile(configPath, 'utf8');
        // 解析 JSON
        appConfig = JSON.parse(configContent);
        console.log('config:', appConfig);

        // 校验必填参数（如服务器IP），缺失则使用默认值
        if (!appConfig.server?.ip) {
            appConfig.server = { ...appConfig.server, ip: '127.0.0.1' }; // 默认本地IP
            console.warn('配置中未指定服务器IP，使用默认值：127.0.0.1');
        }
    } catch (error) {
        // 处理文件不存在或解析错误
        if (error.code === 'ENOENT') {
            console.warn('配置文件不存在，创建默认配置');
            // 创建默认配置文件
            appConfig = { server: { ip: '127.0.0.1', port: 3000 } };
            await fs.writeFile(configPath, JSON.stringify(appConfig, null, 2), 'utf8');
        } else {
            console.error('配置文件解析失败，使用默认配置：', error);
            appConfig = { server: { ip: '127.0.0.1', port: 3000 } };
        }
    }
}

// 生成二维码（返回 base64 图片）
async function generateQrCode(visitorCode) {
    try {
        // 生成适合 56mm 宽度的二维码（尺寸 180x180，足够清晰且不超宽）
        return await QRCode.toDataURL(visitorCode, {
            width: 180, // 宽度（56mm 对应像素约 200 左右，180 留有余地）
            margin: 1, // 减小边距，节省空间
            errorCorrectionLevel: 'M' // 中等纠错级别，平衡清晰度和容错性
        });
    } catch (error) {
        throw new Error(`二维码生成失败：${error.message}`);
    }
}

async function getPrinters() {
    try {
        // 新 API：getPrintersAsync()（返回 Promise）
        const printers = await mainWin.webContents.getPrintersAsync();
        console.log('可用打印机列表:', printers.map(p => p.name));
        return printers;
    } catch (error) {
        console.error('获取打印机列表失败:', error);
        throw new Error(`获取打印机失败：${error.message}`);
    }
}
// 打印访客凭证（含二维码）
async function printVisitorCode(visitorCode, window) {
    // 2. 打印内容配置（适配 56mm 热敏打印机）
    const printData = [
        {
            type: 'text',
            value: '=== 访客凭证 ===',
            style: {
                fontWeight: 'bold',
                fontSize: '14px', // 字体适中，避免超出宽度
                textAlign: 'center'
            }
        },
        {
            type: 'qrCode',
            value: visitorCode,
            width: '56mm',
            height: '56mm',
            position: 'center'
        },
        {
            type: 'text',
            value: `${visitorCode}`,
            style: {
                fontSize: '12px',
                textAlign: 'center'
            }
        },
        {
            type: 'text',
            value: `打印时间：${new Date().toLocaleString()}`,
            style: {
                fontSize: '10px',
                color: '#666',
                textAlign: 'center'
            }
        },
        {
            type: 'text',
            value: '----------------',
            style: {
                fontSize: '12px',
                textAlign: 'center'
            }
        }
    ];

    // 3. 打印机配置（适配 56mm 热敏纸）
    const options = {
        preview: false,
        width: '56mm', // 强制设置为打印机宽度
        margin: '0 2mm', // 左右边距 2mm，避免内容贴边
        // copies: 1,
        printerName: 'KPOS_58 Printer',
        silent: false, // 静默打印，不弹对话框
        timeOutPerLine: 500 // 延长超时时间，确保二维码打印完成
    };

    return new Promise((resolve, reject) => {
        PosPrinter.print(printData, options, window)
            .then(() => resolve('打印成功'))
            .catch((error) => reject(`打印失败：${error.message}`));
    });
}
// 监听渲染进程的打印请求
ipcMain.handle('print-visitor-code', async (event, visitorCode) => {
    const testWindow = event.sender.getOwnerBrowserWindow(); // 获取主窗口
    try {
        return await printVisitorCode(visitorCode, testWindow);
    } catch (error) {
        throw new Error(error); // 抛出错误，让渲染进程捕获
    }
});

// 启动读卡器监听
ipcMain.handle('start-reader', () => {
    if (readerProcess) {
        return { success: false, message: '读卡器已在运行' };
    }
    // 启动Python脚本（路径根据实际项目调整）
    let scriptPath;
    let pythonPath;
    if (app.isPackaged) {
        // 打包后：路径格式：resources/script/IDCard/idcard_reader.py
        scriptPath = path.join(process.resourcesPath, 'script', 'IDCard', 'idcard_reader.py');
        pythonPath = path.join(process.resourcesPath, 'script', 'python', 'python.exe');
    } else {
        // 开发环境：相对项目根目录的路径
        scriptPath = 'script/IDCard/idcard_reader.py';
        pythonPath = 'script/python/python.exe';
    }
    readerProcess = spawn(pythonPath, [scriptPath]);
    // 实时监听脚本输出，转发给渲染进程
    readerProcess.stdout.on('data', (chunk) => {
        const dataStr = chunk.toString().trim();
        try {
            const cardData = JSON.parse(dataStr);
            // 发送给所有渲染进程（可指定窗口）
            mainWin.webContents.send('card-data', cardData);
        } catch (e) {
            console.error('解析读卡器数据失败:', e);
        }
    });

    // 监听脚本错误
    readerProcess.stderr.on('data', (err) => {
        console.error('读卡器脚本错误:', err.toString());
    });

    // 进程退出时重置
    readerProcess.on('close', () => {
        readerProcess = null;
    });

    return { success: true, message: '读卡器已启动' };
});

// 停止读卡器监听
ipcMain.handle('stop-reader', () => {
    if (readerProcess) {
        readerProcess.kill(); // 终止子进程
        readerProcess = null;
        return { success: true, message: '读卡器已停止' };
    }
    return { success: false, message: '读卡器未运行' };
});

// 初始化串口连接
function initSerialPort(portName, baudRate, win) {
    // 关闭已存在的连接
    if (serialPortInstance) {
        serialPortInstance.close();
    }

    try {
        serialPortInstance = new SerialPort({
            path: portName,
            baudRate: baudRate,
            autoOpen: false
        });

        // 创建解析器
        const parser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\n' }));

        // 监听数据接收
        parser.on('data', (data) => {
            const code = data.trim();
            if (code) {
                win.webContents.send('serial-data-received', code);
            }
        });

        // 监听错误事件
        serialPortInstance.on('error', (err) => {
            win.webContents.send('serial-error', `串口错误: ${err.message}`);
        });

        // 监听关闭事件
        serialPortInstance.on('close', () => {
            win.webContents.send('serial-closed', '串口已关闭');
        });

        // 打开串口
        serialPortInstance.open((err) => {
            if (err) {
                win.webContents.send('serial-error', `无法打开串口: ${err.message}`);
                return;
            }
            win.webContents.send('serial-connected', `已连接到 ${portName} (${baudRate}bps)`);
        });
    } catch (err) {
        win.webContents.send('serial-error', `初始化失败: ${err.message}`);
    }
}

// 关闭串口
function closeSerialPort() {
    if (serialPortInstance && serialPortInstance.isOpen) {
        serialPortInstance.close();
        serialPortInstance = null;
    }
}

// 启动扫描器监听
// 监听渲染进程的串口操作请求
ipcMain.on('init-serial', (event, { portName, baudRate }) => {
    initSerialPort(portName, baudRate, mainWin);
});

ipcMain.on('close-serial', () => {
    closeSerialPort();
});

// 主进程响应渲染进程的配置请求（通过IPC）
ipcMain.handle('get-server-config', () => {
    return appConfig.server; // 返回服务器配置
});