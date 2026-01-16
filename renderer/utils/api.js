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

// 工具函数：将对象转为URL查询参数
const objectToQueryString = (params) => {
    if (!params || typeof params !== 'object') return '';

    const queryParams = new URLSearchParams();
    // 遍历参数，过滤掉null/undefined值
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            queryParams.append(key, value);
        }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
};

// 请求工具函数
const request = async (url, method = 'GET', data = null) => {
    try {
        // 获取服务器配置
        const config = await getServerConfig();

        const protocol = config.protocol === 'HTTP' ? 'http' : 'https';
        // 构建完整URL
        const baseUrl = `${protocol}://${config.ip}:${config.port}${config.apiPath || '/api'}`;

        // ===== 核心修改：处理GET请求参数 =====
        let fullUrl = `${baseUrl}${url}`;
        // GET请求：将参数拼接到URL
        if (method.toUpperCase() === 'GET' && data) {
            fullUrl += objectToQueryString(data);
        }

        // 获取本地存储的token
        const token = localStorage.getItem('token');

        // 配置请求参数
        const options = {
            method: method.toUpperCase(), // 统一转为大写
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: (config.timeout || 30) * 1000
        };

        // ===== 核心修改：仅非GET请求添加body =====
        // POST/PUT等请求：添加请求体
        if (data && method.toUpperCase() !== 'GET') {
            options.headers['Content-Type'] = 'application/json';
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

        // 处理HTTP状态码错误
        if (!response.ok) {
            throw new Error(`HTTP错误: 状态码 ${response.status}`);
        }
        // 1. GET请求：适配 { code, msg, data } 格式
        if (method === 'GET') {
            const responseText = await response.text();
            try {
                const result = JSON.parse(responseText);
                if (result.code === 0) {
                    return result.data; // GET成功返回data
                } else {
                    ElMessage.warning(result.msg || 'GET请求失败');
                    return null;
                }
            } catch (parseError) {
                console.warn('响应数据不是JSON格式:', parseError);
                // 如果不是JSON，直接返回原始字符串（特殊场景备用）
                return responseText;
            }
        }
        // 2. POST/PUT等请求：适配原有jsonrpc格式 { jsonrpc, id, result: { code, msg, data } }
        else {
            const result = await response.json();

            // 适配新的返回格式：{ jsonrpc, id, result: { code, msg, data } }
            if (result.result?.code !== 0) {
                ElMessage.warning(result.result?.msg || '请求失败');
                return null;
            }

            return result.result.data;
        }

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
    create: (data) => {
        return request('/visitor/application/create ', 'POST', data);
    },
    update: (data) => {
        return request('/visitor/application/update', 'POST', data);
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
    },
    // 查询获取拜访人
    searchInterviewee: (keyword) => {
        return request(`/wecom/search_contact`, 'GET', {keyword})
    },
    getAreaList:(keyword) => {
        return request('/wecom/form_area', 'GET', { keyword })
    },
    getFormReason: () => {
        return request('/wecom/form_reason', 'GET')
    }
};

export default {
    authAPI,
    visitorAPI
};