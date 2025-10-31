const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let mainWindow;

function createWindow(isLogin = true) {
    // 根据是否为登录窗口设置不同尺寸
    const windowOptions = isLogin ? {
        // 登录窗口：小尺寸，非全屏
        width: 300,          // 窗口宽度（类似QQ登录框大小）
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
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).then(r => {});

    // 开发环境打开调试工具
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    // 窗口关闭事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // 确保页面渲染完成后再显示
    if (isLogin){
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.show();
        });
    }
    return mainWindow;
}

// 监听登录成功事件，切换到主窗口
ipcMain.on('switch-to-main-window', () => {
    if (mainWindow) mainWindow.close(); // 关闭登录窗口
    const mainWin = createWindow(false); // 创建全屏主窗口
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
