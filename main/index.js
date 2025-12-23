const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { PosPrinter } = require('electron-pos-printer');
const Store = require('electron-store').default;
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

function createWindow(isLogin = true) {
    loadConfig().then(r => {});
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
    // 新增：先获取系统可用打印机列表，自动匹配热敏打印机（解决名称不匹配问题）
    let printerName = 'KPOS_58 Printer';
    try {
        const printers = await window.webContents.getPrintersAsync();
        console.log('系统可用打印机：', printers.map(p => p.name));
        window.webContents.send('main-process-log', {message: `系统可用打印机:${printers.map(p => p.name)}`});
        // 自动匹配包含「58」「POS」「热敏」的打印机（兼容不同命名）
        const thermalPrinter = printers.find(p =>
            p.name.includes('58') || p.name.includes('POS') || p.name.includes('热敏')
        );
        if (thermalPrinter) {
            printerName = thermalPrinter.name;
            window.webContents.send('main-process-log', {message:`自动匹配到热敏打印机：${printerName}`});
        }
    } catch (err) {
        console.warn('获取打印机列表失败，使用默认名称：', err);
        window.webContents.send('main-process-log', {message: `获取打印机列表失败，使用默认名称：${err}`});
    }

    // 打印内容配置（适配 56mm 热敏打印机，优化二维码尺寸）
    const printData = [
        {
            type: 'text',
            value: '=== 访客凭证 ===',
            style: {
                fontWeight: 'bold',
                fontSize: '14px',
                textAlign: 'center'
            }
        },
        {
            type: 'qrCode',
            value: visitorCode,
            width: '40mm', // 缩小二维码尺寸，避免超出56mm纸宽
            height: '40mm',
            position: 'center'
        },
        {
            type: 'text',
            value: visitorCode, // 新增：打印访客码文本，方便核对
            style: {
                fontSize: '12px',
                textAlign: 'center',
                marginTop: '5px'
            }
        },
        {
            type: 'text',
            value: '----------------',
            style: {
                fontSize: '12px',
                textAlign: 'center',
                marginTop: '5px'
            }
        }
    ];

    // 打印机配置（优化静默打印参数）
    const options = {
        preview: false,
        width: '56mm', // 强制匹配56mm热敏纸
        margin: '0 2mm',
        printerName: printerName, // 使用匹配后的打印机名称
        silent: true, // 开启静默打印（核心修改）
        timeOutPerLine: 1000, // 进一步延长超时时间，适配低速打印机
        pageSize: { // 新增：自定义纸张尺寸（56mm热敏纸，关键！）
            width: 56 * 96 / 25.4, // 转换为像素（96 DPI，56mm = 2.2047英寸）
            height: 100 * 96 / 25.4 // 高度可自定义
        }
    };

    return new Promise((resolve, reject) => {
        PosPrinter.print(printData, options, window)
            .then(() => {
                console.log('打印成功');
                resolve('打印成功');
            })
            .catch((error) => {
                console.error('打印失败：', error);
                // 兜底：静默打印失败时，切换为非静默模式重试
                options.silent = false;
                PosPrinter.print(printData, options, window)
                    .then(() => resolve('打印成功（手动模式）'))
                    .catch((err) => reject(`打印失败：${err.message}`));
            });
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

// 初始化串口连接（对齐 Python 成功参数）
function initSerialPort(portName, baudRate, win) {
    // 关闭已存在的连接
    if (serialPortInstance) {
        serialPortInstance.close();
    }

    try {
        serialPortInstance = new SerialPort({
            path: portName,
            baudRate: baudRate,
            autoOpen: false,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            timeout: 1000
        });

        // 修正1：先监听原始数据（最底层，确保能捕获任何数据）
        serialPortInstance.on('data', (rawData) => {
            // 强制打印到主进程控制台（无视渲染进程）
            win.webContents.send('send-log', `原始数据(Buffer): ${rawData}`);
            win.webContents.send('send-log', `原始数据(字符串): ${rawData.toString('utf-8')}`);

            // 原始数据手动解析（兜底）
            const rawCode = rawData.toString('utf-8').trim().replace(/\r|\n/g, '');
            if (rawCode) {
                console.log('原始数据解析结果:', rawCode);
                win?.webContents.send('serial-data-received', rawCode);
            }
        });

        // 解析器作为备用（可选）
        const parser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', (data) => {
            const code = data.trim();
            win.webContents.send('send-log', `过滤前:${data}`);
            win.webContents.send('send-log', `过滤后:${code}`);

            if (code) {
                win.webContents.send('serial-data-received', code);
            }
        });

        // 错误事件
        serialPortInstance.on('error', (err) => {
            win.webContents.send('serial-error', `串口错误: ${err.message}`);
        });

        // 关闭事件
        serialPortInstance.on('close', () => {
            console.log('串口已关闭');
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
        console.error('串口初始化失败:', err);
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

// 监听渲染进程的保存Excel请求
ipcMain.handle('saveExcelFile', async (event, excelBase64, defaultFileName) => {
    try {
        // 弹出保存对话框
        const { filePath, canceled } = await dialog.showSaveDialog({
            title: '保存Excel文件',
            defaultPath: defaultFileName,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (canceled || !filePath) {
            return { success: false, message: '用户取消保存' };
        }

        // 关键：验证base64字符串并转换为Buffer
        if (typeof excelBase64 !== 'string') {
            return { success: false, message: '无效的文件数据（非base64字符串）' };
        }

        // 校验base64格式（简单校验，可选）
        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!base64Regex.test(excelBase64)) {
            return { success: false, message: '无效的base64字符串格式' };
        }

        // 将base64转换为Node.js的Buffer
        const nodeBuffer = Buffer.from(excelBase64, 'base64');

        // 异步写入文件
        await fs.writeFile(filePath, nodeBuffer);

        return { success: true, message: '保存成功', filePath: filePath };
    } catch (error) {
        console.error('保存文件失败:', error);
        return { success: false, message: `保存失败：${error.message}` };
    }
});
// 初始化 electron-store
const store = new Store({
    name: 'app-store', // 存储文件名称
    defaults: { // 默认数据（可选）
        user: {
            username: '',
            password: '',
            rememberPwd: false,
            autoLogin: false
        }
    }
});
// 注册 IPC 接口：获取存储数据
ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
});

// 注册 IPC 接口：设置存储数据
ipcMain.handle('store-set', (event, key, value) => {
    // 新增：如果值为 null/undefined/空字符串，使用 delete() 清空
    console.log(`${key}: ${value}`);
    if (value === '' || value === null || value === undefined) {
        store.delete(key);
    } else {
        store.set(key, value);
    }
    return 'success';
});

// 注册 IPC 接口：删除存储数据
ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
    return 'success';
});