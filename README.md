# 访客管理系统（visitor\_management）

一个基于 Electron + Vue 3 + Element Plus 开发的桌面端访客管理应用，支持访客信息登记、二维码识别、串口设备交互及 Excel 数据导出功能。

## 功能特性



* **访客信息管理**：支持访客基本信息录入、查询与存储，满足日常访客登记场景。

* **二维码识别**：集成 `jsqr` 库实现二维码扫描，快速读取访客预登记信息，提升登记效率。

* **串口设备交互**：通过 `serialport` 库连接硬件设备（如身份证读卡器、热敏打印机），实现硬件联动。

* **数据导出**：借助 `xlsx` 库将访客数据导出为 Excel 文件，便于数据存档、统计与分析。

* **现代化 UI 界面**：基于 Element Plus 构建直观易用的桌面端界面，适配不同屏幕尺寸。

## 技术栈说明



| 技术类别     | 具体框架 / 工具               | 版本     | 核心作用                  |
| -------- | ----------------------- | ------ | --------------------- |
| 桌面应用框架   | Electron                | 39.0.0 | 构建跨平台桌面应用，实现前端与系统交互   |
| 前端框架     | Vue                     | 3.5.22 | 页面渲染与组件化开发            |
| 路由管理     | Vue Router              | 4.6.3  | 管理应用内页面跳转与路由配置        |
| UI 组件库   | Element Plus            | 2.11.5 | 提供表单、表格、弹窗等基础组件       |
| UI 图标库   | @element-plus/icons-vue | 2.3.2  | 配套 Element Plus 的图标资源 |
| 二维码处理    | jsqr                    | 1.4.0  | 解析二维码图像数据             |
| 串口通信     | serialport              | 13.0.0 | 实现与硬件设备的串口数据交互        |
| Excel 处理 | xlsx                    | 0.18.5 | 实现访客数据的 Excel 导入 / 导出 |
| 打包工具     | Electron Forge          | 7.10.2 | 应用打包、分发与安装包生成         |

## 环境准备

### 1. 必备工具



* **Node.js**：推荐 v18.x 及以上版本（需与 Electron 39.0.0 兼容），建议通过 NVM 管理 Node 版本。

* **npm**：Node.js 自带的包管理器，项目依赖管理与脚本执行依赖。

* **硬件驱动**（可选）：若需使用串口设备（如读卡器），需提前安装对应设备的 Windows 驱动。

### 2. 依赖安装步骤



1. 克隆或下载项目代码到本地，进入项目根目录：



```
# 克隆仓库（若使用 Git）

git clone <项目仓库地址>

# 进入项目目录

cd visitor\_management
```



1. 安装项目依赖（首次安装可能耗时较长，需耐心等待）：



```
npm install
```

> 注意事项：



* 若 `serialport` 等原生模块安装失败，需先安装编译工具：`npm install -g node-gyp`

* 国内网络建议配置镜像加速：`npm config set electron_mirror "``https://npmmirror.com/mirrors/electron/``"`



## 常用命令说明



| 命令                | 功能描述                                                       |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | 启动 Electron 开发环境，快速预览应用效果（基于原生 Electron 命令）                |
| `npm run start`   | 通过 Electron Forge 启动开发环境，支持热重载与调试                          |
| `npm run package` | 打包应用（生成未签名的可执行文件），输出路径：`out/visitor_management-win32-x64/` |
| `npm run make`    | 生成 Windows 安装包（含 .exe 安装程序与 zip 压缩包），输出路径：`out/make/`      |
| `npm run build`   | 备用打包命令（基于 electron-builder，需额外配置 `electron-builder.json`）  |

## 打包与分发

### 1. 生成 Windows 安装包

执行以下命令，自动生成适配 Windows 系统的安装程序：



```
npm run make
```



* **输出产物**：


* `.exe 安装包`：路径 `out/make/squirrel.windows/x64/`，支持一键安装、自动更新。

* `zip 压缩包`：路径 `out/make/zip/win32/x64/`，无需安装，解压即可运行。

### 2. 打包注意事项



* **网络稳定性**：打包过程需下载 Electron 二进制文件，若失败可重试或检查镜像配置。

* **原生模块编译**：`serialport` 会自动编译为 Electron 兼容版本，确保编译工具（如 VS Build Tools）已安装。

* **自定义图标**：若需替换应用图标，需在 `forge.config.js` 中配置 `packagerConfig.icon`（Windows 需 .ico 格式图标）。

## 项目目录结构



```
visitor\_management/

├── main/                # Electron 主进程目录

│   └── index.js         # 主进程入口文件（窗口创建、IPC 通信、系统交互）

├── renderer/            # Vue 渲染进程目录（前端页面代码）

│   ├── pages/           # 页面前端源码

│   ├── components/      # 页面组件源码

│   ├── assets/          # 静态资源（图片、图标、css样式）

│   └── index.html       # 渲染进程入口页面

├── package.json         # 项目配置文件（依赖、脚本、版本信息）

├── forge.config.js      # Electron Forge 打包配置文件（需自行创建）

└── README.md            # 项目说明文档（当前文档）
```