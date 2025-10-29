const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        title: "访客管理系统",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        // 核心配置：默认全屏
        fullscreen: true,
        // 可选：隐藏窗口边框（全屏时更沉浸，按F11可退出全屏）
        frame: false  // 若需要保留窗口边框，可删除此句
    });

    // 加载应用页面
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // 关键配置：让DevTools在独立窗口打开
    mainWindow.webContents.openDevTools({
        mode: 'detach'  // 分离模式，在单独窗口显示
    });

    // 窗口关闭事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 关闭应用事件处理
ipcMain.on('close-app', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    } else {
        mainWindow.hide();
    }
});

// 应用生命周期管理
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});