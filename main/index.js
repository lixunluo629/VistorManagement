const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { PosPrinter } = require('electron-pos-printer');
const Store = require('electron-store').default;
const QRCode = require('qrcode');
const { spawn, execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs'); // 同步文件操作
const net = require('net'); // Socket客户端
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// ===================== 日志文件配置 =====================
// 日志存储路径（用户数据目录）
const currentDir = process.cwd();
const logDir = path.join(currentDir, 'logs');
const logFileName = `app-${getDateString()}.log`;
const logFilePath = path.join(logDir, logFileName);
const maxLogSize = 10 * 1024 * 1024; // 单个日志文件最大10MB
const maxLogFiles = 7; // 最多保留7天的日志
// 生成日期字符串 YYYYMMDD
function getDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 生成时间戳 YYYY-MM-DD HH:mm:ss.SSS
function getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

// 确保日志目录存在
function ensureLogDir() {
    if (!fsSync.existsSync(logDir)) {
        fsSync.mkdirSync(logDir, { recursive: true });
    }
}

// ===================== 统一日志函数 =====================
// 单个函数处理所有日志输出
function log(level, msg) {
    const timestamp = getTimestamp();
    const mainProcessMsg = `[Main_Process] ${msg}`;
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${mainProcessMsg}\n`;

    // 1. 输出到控制台
    switch (level) {
        case 'error':
            console.error(mainProcessMsg);
            break;
        case 'warn':
            console.warn(mainProcessMsg);
            break;
        default:
            console.log(mainProcessMsg);
    }

    // 2. 写入日志文件（异步）
    try {
        ensureLogDir();

        // 检查日志文件大小，超过则轮转
        if (fsSync.existsSync(logFilePath)) {
            const stats = fsSync.statSync(logFilePath);
            if (stats.size > maxLogSize) {
                // 重命名当前日志文件
                const date = new Date();
                const timeStamp = `${getDateString()}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
                const rotatedPath = path.join(logDir, `app-${timeStamp}.log`);
                fsSync.renameSync(logFilePath, rotatedPath);

                // 删除旧日志文件，只保留maxLogFiles个
                const logFiles = fsSync.readdirSync(logDir)
                    .filter(file => file.startsWith('app-') && file.endsWith('.log'))
                    .sort()
                    .reverse();

                if (logFiles.length > maxLogFiles) {
                    logFiles.slice(maxLogFiles).forEach(file => {
                        fsSync.unlinkSync(path.join(logDir, file));
                    });
                }
            }
        }

        // 追加写入日志文件
        fsSync.appendFile(logFilePath, logEntry, (err) => {
            if (err) {
                console.error('日志写入失败:', err);
            }
        });
    } catch (err) {
        console.error('日志处理失败:', err);
    }

    // 3. 发送到渲染进程
    mainWin?.webContents.send('python-log', { level, content: msg });
}

// ===================== 全局变量统一管理 =====================
let mainWindow; // 登录窗口
let mainWin; // 主窗口
let readerProcess = null; // Python进程（备用）
let socketClient = null; // Socket客户端（核心）
let isAppQuiting = false; // 应用退出标记
let serialPortInstance = null;
let reconnectTimer = null; // Socket重连定时器
const configPath = path.join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'config.json');
let appConfig = { server: { protocol: 'HTTP', ip: '127.0.0.1', port: 3000 } }; // 默认配置

// ===================== 基础窗口管理 =====================
function createWindow(isLogin = true) {
    loadConfig().catch(err => log('error', `加载配置失败: ${err.message}`));

    const windowOptions = isLogin ? {
        width: 300,
        height: 400,
        frame: false,
        resizable: false,
        movable: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    } : {
        fullscreen: true,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    };

    const win = new BrowserWindow(windowOptions);
    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    // 开发环境打开调试工具
    // win.webContents.openDevTools({ mode: 'detach' });

    // 窗口关闭事件
    win.on('closed', () => {
        if (isLogin) mainWindow = null;
        else {
            mainWin = null;
            // 主窗口关闭时停止读卡器服务
            stopPythonServer();
        }
    });

    // 渲染完成后显示
    win.webContents.on('did-finish-load', () => {
        win.show();
        if (!isLogin) {
            win.webContents.executeJavaScript(`window.location.hash = '#/main';`);
            // 主窗口加载完成后，才启动读卡器服务
            startPythonServer(); // 关键：主窗口阶段启动Python服务
            setTimeout(() => connectSocketClient(), 1000); // 主窗口阶段连接Socket
        }
    });

    if (isLogin) mainWindow = win;
    else mainWin = win;

    return win;
}

// ===================== 开机自启 =====================
function setAutoStart(enable) {
    try {
        app.setLoginItemSettings({
            openAtLogin: enable,
            openAsHidden: false,
            path: process.execPath,
            args: ['--processStart', `"${process.execPath}"`]
        });
        log('log', `开机自启已${enable ? '开启' : '关闭'}`);
    } catch (err) {
        log('error', `设置开机自启失败: ${err.message}`);
    }
}

// ===================== 配置文件管理 =====================
async function loadConfig() {
    try {
        if (fsSync.existsSync(configPath)) {
            const configContent = await fs.readFile(configPath, 'utf8');
            appConfig = JSON.parse(configContent);
        } else {
            // 创建默认配置
            await fs.writeFile(configPath, JSON.stringify(appConfig, null, 2), 'utf8');
        }
        // 补全默认值
        appConfig.server = {
            protocol: 'HTTP',
            ip: '127.0.0.1',
            port: 3000,
            ...appConfig.server
        };
        log('log', `配置加载成功: ${JSON.stringify(appConfig.server)}`);
    } catch (error) {
        log('error', `配置文件解析失败，使用默认配置：${error.message}`);
        appConfig = { server: { protocol: 'HTTP', ip: '127.0.0.1', port: 3000 } };
    }
}

// ===================== 二维码生成 =====================
async function generateQrCode(visitorCode) {
    try {
        return await QRCode.toDataURL(visitorCode, {
            width: 180,
            margin: 1,
            errorCorrectionLevel: 'M'
        });
    } catch (error) {
        log('error', `二维码生成失败：${error.message}`);
        throw new Error(`二维码生成失败：${error.message}`);
    }
}

// ===================== 打印功能 =====================
async function getPrinters(window) {
    try {
        const printers = await window.webContents.getPrintersAsync();
        log('log', `可用打印机列表: ${printers.map(p => p.name).join(', ')}`);
        return printers;
    } catch (error) {
        log('error', `获取打印机列表失败: ${error.message}`);
        throw new Error(`获取打印机失败：${error.message}`);
    }
}

async function printVisitorCode(visitorCode, window) {
    let printerName = 'KPOS_58 Printer';
    try {
        const printers = await getPrinters(window);
        const thermalPrinter = printers.find(p =>
            p.name.includes('58') || p.name.includes('POS') || p.name.includes('热敏')
        );
        if (thermalPrinter) {
            printerName = thermalPrinter.name;
            log('log', `自动匹配到热敏打印机：${printerName}`);
        }
    } catch (err) {
        log('warn', `获取打印机列表失败，使用默认名称：${err.message}`);
    }

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
            width: '40mm',
            height: '40mm',
            position: 'center'
        },
        {
            type: 'text',
            value: visitorCode,
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

    const options = {
        preview: false,
        width: '56mm',
        margin: '0 2mm',
        printerName: printerName,
        silent: true,
        timeOutPerLine: 1000,
        pageSize: {
            width: 56 * 96 / 25.4,
            height: 100 * 96 / 25.4
        }
    };

    return new Promise((resolve, reject) => {
        PosPrinter.print(printData, options, window)
            .then(() => {
                log('log', '打印成功');
                resolve('打印成功');
            })
            .catch((error) => {
                log('error', `打印失败：${error.message}`);
                options.silent = false;
                PosPrinter.print(printData, options, window)
                    .then(() => {
                        log('log', '打印成功（手动模式）');
                        resolve('打印成功（手动模式）');
                    })
                    .catch((err) => {
                        log('error', `手动打印也失败：${err.message}`);
                        reject(`打印失败：${err.message}`);
                    });
            });
    });
}

// ===================== 读卡器核心（Socket版本） =====================
/**
 * 启动Python Socket服务端（独立进程）
 */
function startPythonServer() {
    if (readerProcess && !readerProcess.killed) return; // 已启动则直接返回

    // 1. 构建路径（适配打包/开发环境）
    let scriptPath, pythonPath;
    if (app.isPackaged) {
        scriptPath = path.join(process.resourcesPath, 'script', 'IDCard', 'idcard_reader.py');
        pythonPath = path.join(process.resourcesPath, 'script', 'python', 'python.exe');
    } else {
        scriptPath = path.resolve(__dirname, '../script/IDCard/idcard_reader.py');
        pythonPath = path.resolve(__dirname, '../script/python/python.exe');
    }

    // 2. 验证路径
    if (!fsSync.existsSync(pythonPath)) {
        log('error', `Python路径不存在：${pythonPath}`);
        // 尝试使用系统Python
        pythonPath = 'python.exe';
        log('log', '尝试使用系统Python环境');
    }
    if (!fsSync.existsSync(scriptPath)) {
        log('error', `脚本路径不存在：${scriptPath}`);
        return;
    }

    // 3. 强制杀死残留Python进程（避免端口占用）
    try {
        const { execSync } = require('child_process');
        execSync('taskkill /F /IM python.exe /FI "WINDOWTITLE eq python.exe"', { stdio: 'ignore' });
        log('log', '已清理残留Python进程');
    } catch (err) {
        log('warn', '未检测到残留Python进程');
    }

    // 4. 启动Python服务
    log('log', `Start Python:${pythonPath} ${scriptPath}`);
    const scriptDir = path.dirname(scriptPath);

    // 清除之前的进程引用
    if (readerProcess) {
        try {
            readerProcess.kill();
        } catch (err) {}
        readerProcess = null;
    }
    // , "--socket-test"
    readerProcess = execFile(pythonPath, [scriptPath], {
        cwd: scriptDir,
        env: process.env,
        windowsHide: true,
        shell: true,
        detached: false
    });

    // 5. 监听Python输出
    readerProcess.stdout.on('data', (chunk) => {
        const dataStr = chunk.toString().trim();
        if (!dataStr) return;
        log('log', `Python-log: ${dataStr}`);
        try {
            const jsonData = JSON.parse(dataStr);
            mainWin?.webContents.send('python-log', jsonData);
        } catch (e) {
            mainWin?.webContents.send('python-log', { type: 'log', content: dataStr });
        }

        // Python服务启动成功后立即连接客户端
        if (dataStr.includes('Socket服务已启动') || dataStr.includes('listening on port')) {
            setTimeout(() => connectSocketClient(), 1000);
        }
    });

    // 6. 监听Python错误
    readerProcess.stderr.on('data', (chunk) => {
        const errStr = chunk.toString().trim();
        log('error', `Python-error：${errStr}`);
        mainWin?.webContents.send('python-log', { type: 'error', content: errStr });
    });

    // 7. Python进程异常退出：自动重启（非应用退出时）
    readerProcess.on('close', (code, signal) => {
        const logMsg = `Python server exited, code:${code}, signal:${signal}`;
        log('log', logMsg);
        readerProcess = null;

        // 清理Socket客户端
        if (socketClient) {
            try {
                socketClient.destroy();
            } catch (err) {}
            socketClient = null;
        }

        // 应用未退出时，5秒后重启
        if (!isAppQuiting) {
            log('warn', 'Python进程异常退出，5秒后重启...');
            setTimeout(() => {
                startPythonServer();
            }, 5000);
        }
    });

    // 8. 进程启动失败处理
    readerProcess.on('error', (err) => {
        log('error', `Python进程启动失败：${err.message}`);
        readerProcess = null;

        if (!isAppQuiting) {
            setTimeout(() => startPythonServer(), 5000);
        }
    });

    // 启动Python后立即尝试连接Socket客户端
    setTimeout(() => connectSocketClient(), 2000);
}

/**
 * 连接Socket客户端（断开自动重试）
 */
function connectSocketClient() {
    // 如果应用正在退出，不进行连接
    if (isAppQuiting) return;

    // 清除之前的重连定时器
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    // 如果已有客户端连接，先关闭
    if (socketClient) {
        try {
            socketClient.removeAllListeners();
            socketClient.destroy();
        } catch (err) {}
        socketClient = null;
    }

    // 1. 创建Socket客户端
    socketClient = net.createConnection({ port: 9999, host: '127.0.0.1' }, () => {
        log('log', '已连接到读卡器Socket服务');
        mainWin?.webContents.send('python-log', { type: 'status', content: '读卡器连接成功，等待刷卡...' });
    });

    // 2. 优化Socket配置
    socketClient.setNoDelay(true); // 禁用Nagle算法
    socketClient.setTimeout(0);    // 取消超时
    socketClient.setKeepAlive(true, 30000); // 启用TCP保活，30秒检测一次

    // 3. 接收读卡器数据（处理分包）
    let buffer = "";
    socketClient.on('data', (chunk) => {
        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            try {
                const cardData = JSON.parse(line);
                log('log', `收到读卡器数据：${JSON.stringify(cardData)}`);
                if(cardData.type === 'success'){
                    // 发送到渲染进程
                    mainWin?.webContents.send('card-data', cardData);
                }
            } catch (e) {
                log('error', `解析数据失败：${e.message}，原始数据：${line}`);
            }
        });
    });

    // 4. Socket错误：自动重试
    socketClient.on('error', (err) => {
        log('error', `Socket连接失败：${err.message}`);
        mainWin?.webContents.send('python-log', {
            type: 'error',
            content: `读卡器连接失败：${err.message}，将自动重试...`
        });

        socketClient = null;
        // 应用未退出时，3秒后重试
        if (!isAppQuiting) {
            reconnectTimer = setTimeout(() => connectSocketClient(), 3000);
        }
    });

    // 5. Socket断开：自动重试
    socketClient.on('close', (hadError) => {
        const msg = hadError ? 'Socket连接异常关闭' : 'Socket连接正常关闭';
        log('warn', `${msg}，3秒后重试...`);

        if (hadError) {
            mainWin?.webContents.send('python-log', {
                type: 'warn',
                content: '读卡器连接已断开，将自动重连...'
            });
        }

        socketClient = null;
        // 应用未退出时，3秒后重试
        if (!isAppQuiting) {
            reconnectTimer = setTimeout(() => connectSocketClient(), 3000);
        }
    });

    // 6. 超时处理
    socketClient.on('timeout', () => {
        log('warn', 'Socket连接超时');
        socketClient.destroy();
    });
}

/**
 * 停止读卡器服务
 */
function stopPythonServer() {
    // 1. 清除重连定时器
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    // 2. 关闭Socket连接
    if (socketClient) {
        try {
            socketClient.write('stop'); // 发送停止指令
            socketClient.destroy();
            log('log', 'Socket客户端已关闭');
        } catch (err) {
            log('error', `关闭Socket失败：${err.message}`);
        }
        socketClient = null;
    }

    // 3. 终止Python进程（增强版）
    if (readerProcess) {
        try {
            // 步骤1：先尝试正常终止（发送SIGTERM）
            process.kill(readerProcess.pid, 'SIGTERM');
            log('log', `发送SIGTERM信号终止Python进程（PID：${readerProcess.pid}）`);

            // 步骤2：等待1秒后检查是否仍存活，存活则强制杀死
            setTimeout(() => {
                try {
                    // 检查进程是否存在
                    process.kill(readerProcess.pid, 0); // 0信号仅检查进程是否存在
                    log('warn', `Python进程（PID：${readerProcess.pid}）仍存活，强制杀死`);
                    process.kill(readerProcess.pid, 'SIGKILL');
                } catch (err) {
                    // 进程已退出，无需处理
                    log('log', `Python进程（PID：${readerProcess.pid}）已正常退出`);
                }
            }, 1000);

        } catch (err) {
            log('error', `终止Python进程失败：${err.message}`);
        }

        // 步骤3：强制清理所有Python进程（增强过滤条件）
        try {
            const { execSync } = require('child_process');
            // 方案A：杀死所有python.exe进程（最彻底，适合测试/单机场景）
            execSync('taskkill /F /IM python.exe /T', { stdio: 'ignore' });
            // 方案B：仅杀死关联的python进程（更安全，适合多Python进程场景）
            // execSync(`taskkill /F /PID ${readerProcess.pid} /T`, { stdio: 'ignore' });

            log('log', '已强制清理所有Python进程（含子进程）');
        } catch (err) {
            log('warn', `清理Python进程时出错：${err.message}，可能已无残留进程`);
        }

        readerProcess = null;
        log('log', '读卡器服务已停止');
    }

    return { success: true, message: '读卡器已停止' };
}

// ===================== 串口管理 =====================
function initSerialPort(portName, baudRate, win) {
    log('log', `初始化串口：${portName}，波特率：${baudRate}`);

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

        // 原始数据监听
        serialPortInstance.on('data', (rawData) => {
            const hexData = rawData.toString('hex');
            const strData = rawData.toString('utf-8').trim();
            win?.webContents.send('send-log', `原始数据(Buffer): ${hexData}`);
            win?.webContents.send('send-log', `原始数据(字符串): ${strData}`);

            const rawCode = strData.replace(/\r|\n/g, '');
            if (rawCode) {
                log('log', `串口原始数据：${rawCode}`);
                win?.webContents.send('serial-data-received', rawCode);
            }
        });

        // 解析器
        const parser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', (data) => {
            const code = data.trim();
            win?.webContents.send('send-log', `过滤后: ${code}`);
            if (code) {
                win?.webContents.send('serial-data-received', code);
            }
        });

        // 错误处理
        serialPortInstance.on('error', (err) => {
            log('error', `串口错误: ${err.message}`);
            win?.webContents.send('serial-error', `串口错误: ${err.message}`);
        });

        // 关闭事件
        serialPortInstance.on('close', () => {
            log('log', '串口已关闭');
            win?.webContents.send('serial-closed', '串口已关闭');
        });

        // 打开串口
        serialPortInstance.open((err) => {
            if (err) {
                log('error', `无法打开串口: ${err.message}`);
                win?.webContents.send('serial-error', `无法打开串口: ${err.message}`);
                return;
            }
            log('log', `已连接到串口 ${portName} (${baudRate}bps)`);
            win?.webContents.send('serial-connected', `已连接到 ${portName} (${baudRate}bps)`);
        });
    } catch (err) {
        log('error', `串口初始化失败: ${err.message}`);
        win?.webContents.send('serial-error', `初始化失败: ${err.message}`);
    }
}

function closeSerialPort() {
    if (serialPortInstance && serialPortInstance.isOpen) {
        const portPath = serialPortInstance.path;
        serialPortInstance.close();
        serialPortInstance = null;
        log('log', '串口已关闭');
    }
}

// ===================== IPC通信注册 =====================
// 1. 登录窗口切换
ipcMain.on('switch-to-main-window', () => {
    log('log', '切换到主窗口');

    // 1. 先停止当前读卡器服务（避免端口占用）
    stopPythonServer();
    // 2. 关闭登录窗口
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
    // 3. 创建主窗口（createWindow内部会自动启动读卡器服务）
    mainWin = createWindow(false);
});

// 2. 关闭应用
ipcMain.on('close-app', () => {
    log('log', '用户请求关闭应用');

    isAppQuiting = true;
    // 关闭所有子进程
    stopPythonServer();
    closeSerialPort();

    if (process.platform !== 'darwin') {
        app.quit();
    } else {
        (mainWin || mainWindow).hide();
    }
});

// 3. 打印访客码
ipcMain.handle('print-visitor-code', async (event, visitorCode) => {
    log('log', `收到打印请求，访客码：${visitorCode}`);

    const window = event.sender.getOwnerBrowserWindow();
    try {
        return await printVisitorCode(visitorCode, window);
    } catch (error) {
        log('error', `打印请求失败：${error.message}`);
        throw error;
    }
});

// 4. 获取日志文件路径
ipcMain.handle('get-log-path', () => {
    log('log', '前端请求获取日志文件路径');
    return {
        logDir: logDir,
        currentLogFile: logFilePath,
        logFiles: fsSync.existsSync(logDir)
            ? fsSync.readdirSync(logDir).filter(file => file.endsWith('.log')).sort().reverse()
            : []
    };
});

// 5. 打开日志目录
ipcMain.on('open-log-dir', () => {
    log('log', '用户操作：打开日志目录');
    shell.openPath(logDir).catch(err => {
        log('error', `打开日志目录失败：${err.message}`);
    });
});

// 6. 串口操作
ipcMain.on('init-serial', (event, { portName, baudRate }) => {
    log('log', `用户操作：初始化串口 ${portName}，波特率 ${baudRate}`);
    initSerialPort(portName, baudRate, mainWin || mainWindow);
});

ipcMain.on('close-serial', () => {
    log('log', '用户操作：关闭串口');
    closeSerialPort();
});

// 7. 获取服务器配置
ipcMain.handle('get-server-config', () => {
    log('log', '前端请求获取服务器配置');
    return appConfig.server;
});

// 8. 保存Excel文件
ipcMain.handle('saveExcelFile', async (event, excelBase64, defaultFileName) => {
    log('log', `用户操作：保存Excel文件，默认文件名：${defaultFileName}`);

    try {
        const { filePath, canceled } = await dialog.showSaveDialog({
            title: '保存Excel文件',
            defaultPath: defaultFileName,
            filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (canceled || !filePath) {
            log('log', '用户取消保存Excel文件');
            return { success: false, message: '用户取消保存' };
        }

        if (typeof excelBase64 !== 'string') {
            log('error', '保存Excel失败：无效的文件数据（非base64字符串）');
            return { success: false, message: '无效的文件数据（非base64字符串）' };
        }

        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!base64Regex.test(excelBase64)) {
            log('error', '保存Excel失败：无效的base64字符串格式');
            return { success: false, message: '无效的base64字符串格式' };
        }

        const nodeBuffer = Buffer.from(excelBase64, 'base64');
        await fs.writeFile(filePath, nodeBuffer);

        log('log', `Excel文件保存成功：${filePath}`);
        return { success: true, message: '保存成功', filePath: filePath };
    } catch (error) {
        log('error', `保存Excel失败：${error.message}`);
        return { success: false, message: `保存失败：${error.message}` };
    }
});

// 9. Electron-Store操作
const store = new Store({
    name: 'app-store',
    defaults: {
        user: {
            username: '',
            password: '',
            rememberPwd: false,
            autoLogin: false
        }
    }
});

ipcMain.handle('store-get', (event, key) => {
    log('log', `前端请求获取存储数据：${key}`);
    return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
    log('log', `存储数据：${key} = ${JSON.stringify(value)}`);

    if (value === '' || value === null || value === undefined) {
        store.delete(key);
        log('log', `删除存储数据：${key}`);
    } else {
        store.set(key, value);
    }
    return 'success';
});

ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
    log('log', `删除存储数据：${key}`);
    return 'success';
});

// ===================== 应用生命周期 =====================
app.whenReady().then(() => {
    // 初始化日志系统
    ensureLogDir();
    log('info', '应用启动开始 - ' + new Date().toString());

    setAutoStart(true);
    createWindow(true);

    log('info', '应用启动完成，主窗口已创建 - ' + new Date().toString());
});

app.on('before-quit', () => {
    log('info', '应用开始退出流程 - ' + new Date().toString());
    isAppQuiting = true;
    stopPythonServer(); // 停止读卡器
});

app.on('window-all-closed', () => {
    log('info', '所有窗口已关闭，准备退出应用 - ' + new Date().toString());
    isAppQuiting = true;
    closeSerialPort();
    stopPythonServer(); // 确保进程被终止

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    log('info', '应用被激活 - ' + new Date().toString());
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(true);
    }
});

// 全局异常捕获
process.on('uncaughtException', (err) => {
    const errorMsg = `全局未捕获异常：${err.message}\n${err.stack}\n发生时间：${new Date().toString()}`;
    log('error', errorMsg);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    const errorMsg = `全局未处理Promise拒绝：${reason.message || reason}\nPromise: ${JSON.stringify(promise)}\n发生时间：${new Date().toString()}`;
    log('error', errorMsg);
    console.error('Promise:', promise, 'Reason:', reason);
});

// 确保退出时清理所有资源
process.on('exit', (code) => {
    log('info', `应用退出，退出码：${code} - ${new Date().toString()}`);
    isAppQuiting = true;
    stopPythonServer();
    closeSerialPort();
});

// 应用崩溃处理
app.on('render-process-gone', (event, webContents, details) => {
    log('error', `渲染进程崩溃：${details.reason}，退出码：${details.exitCode} - ${new Date().toString()}`);
});

app.on('child-process-gone', (event, details) => {
    log('error', `子进程崩溃：${details.type}，原因：${details.reason}，退出码：${details.exitCode} - ${new Date().toString()}`);
});