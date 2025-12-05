// filePath: VistorManagement/renderer/utils/api.js
const { ElMessage } = ElementPlus;
const { ipcRenderer } = require('electron');

// 缓存服务器配置
let serverConfig = null;

// 获取服务器配置（从主进程）
const getServerConfig = async () => {
    if (!serverConfig) {
        serverConfig = await ipcRenderer.invoke('get-server-config');
    }
    return serverConfig;
};

// 请求工具函数
const request = async (url, method = 'GET', data = null) => {
    try {
        // 获取服务器配置
        const config = await getServerConfig();

        // 构建完整URL
        const baseUrl = `http://${config.ip}:${config.port}${config.apiPath || '/api'}`;
        const fullUrl = `${baseUrl}${url}`;

        // 获取本地存储的token
        const token = localStorage.getItem('token');

        // 配置请求参数
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                // 自动添加token到请求头
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            timeout: (config.timeout || 30) * 1000
        };

        // 添加请求体
        if (data) {
            options.body = JSON.stringify(data);
        }

        // 发送请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(fullUrl, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP错误: 状态码 ${response.status}`);
        }

        const result = await response.json();

        // 适配新的返回格式：{ jsonrpc, id, result: { code, msg, data } }
        if (result.result?.code !== 0) {
            ElMessage.error(result.result?.msg || '请求失败');
            return null;
        }

        return result.result.data;
    } catch (error) {
        console.error('API请求错误:', error);
        if (error.name === 'AbortError') {
            ElMessage.error('请求超时，请重试');
        } else {
            ElMessage.error('网络异常，请检查连接');
        }
        return null;
    }
};

// 登录相关接口
export const authAPI = {
    // 用户登录
    login: (username, password) => {
        return request('/jwt/get_token', 'POST', { username, password });
    },
};

// 其他接口模块...
export const visitorAPI = {
    // 访客登记
    query: (data) => {
        return request('/visitor/application/query', 'POST', data);
    },
    record: (data) => {
        return request('/visitor/record', 'POST', data);
    },
    register: (data) => {
        return request('/visitor/application/list', 'POST', data);
    },
    dashboard: () => {
        return request('/visitor/dashboard', 'POST', {});
    },
    // 获取访客列表
    getList: (data) => {
        return request(`/visitor/application/list`, 'POST', data);
    },
    getStatistic: (data) => {
        return request(`/visitor/application/statistics`, 'POST', data);
    }
};

export default {
    authAPI,
    visitorAPI
};