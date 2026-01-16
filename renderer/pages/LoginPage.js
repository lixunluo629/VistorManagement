import { authAPI } from '../utils/api.js';
export const LoginPage = {
    template: `
      <div class="login-container">
        <div class="login-header">
        </div>
        <!-- 关闭按钮 -->
        <el-button
            class="login-close-btn"
            icon="Close"
            type="text"
            @click="handleClose"
        ></el-button>
        <!-- 登录卡片 -->
        <el-card shadow="never" class="login-card">
          <div class="login-title">访客准入</div>

          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
            <el-form-item>
              <el-input
                  v-model="loginForm.username"
                  placeholder="请输入用户名"
                  prefix-icon="User"
                  @keyup.enter.stop="handleLogin"
              ></el-input>
            </el-form-item>

            <el-form-item>
              <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  prefix-icon="Lock"
                  @keyup.enter.stop="handleLogin"
              ></el-input>
            </el-form-item>
            <!-- 记住密码 + 自动登录复选框 -->
            <el-form-item class="login-checkbox-group">
              <el-checkbox v-model="loginForm.rememberPwd">记住密码</el-checkbox>
<!--              <el-checkbox v-model="loginForm.autoLogin" :disabled="!loginForm.rememberPwd">自动登录</el-checkbox>-->
            </el-form-item>
            <el-form-item>
              <el-button
                  type="primary"
                  style="width: 100%;"
                  @click="handleLogin"
                  :loading="loading"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    `,
    setup() {
        const {ref, reactive, onMounted, onUnmounted} = Vue;
        const router = VueRouter.useRouter();
        const {ipcRenderer} = require('electron');
        const { ElMessage } = ElementPlus;
        // 登录表单数据
        const loginForm = reactive({
            username: '',
            password: '',
            rememberPwd: false,
            // autoLogin: false
        });

        // 表单验证规则
        const rules = reactive({
            username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
            password: [{required: true, message: '请输入密码', trigger: 'blur'}],
        });
        // 记住密码、自动登录状态
        const loginFormRef = ref(null);
        const loading = ref(false); // 添加加载状态

        // 登录处理
        const handleLogin = async () => {
            loginFormRef.value.validate(async (valid) => {
                if (valid) {
                    loading.value = true;
                    try {
                        // 1. 对密码进行MD5加密（示例中密码已加密，这里保持一致）
                        const md5Password = CryptoJS.MD5(loginForm.password).toString();

                        // 2. 调用登录接口
                        const data = await authAPI.login(
                            loginForm.username,
                            md5Password
                        );

                        if (data) {
                            // 3. 存储token及用户信息
                            localStorage.setItem('token', data.token);
                            localStorage.setItem('expireTime', data.expire_time);
                            localStorage.setItem('userInfo', JSON.stringify(data.user_info));

                            // 4. 登录成功处理
                            if (loginForm.rememberPwd){
                                await saveData();
                            }
                            ElMessage.success('登录成功');
                            ipcRenderer.send('switch-to-main-window');
                        }
                    } catch (error) {
                        console.error('登录失败', error);
                        ElMessage.error('登录失败，请检查用户名或密码');
                    } finally {
                        loading.value = false;
                    }
                }
            });
        };

        // 关闭按钮处理
        const handleClose = () => {
            // 可以根据需求修改关闭行为，比如关闭窗口或返回上一页
            ipcRenderer.send('close-app');
        };
        const getData = async () => {
            // 调用主进程的 store-get 接口
            // 修复：去掉 .value，直接赋值给 reactive 对象的属性
            loginForm.username = await ipcRenderer.invoke('store-get', 'user.username') || '';
            loginForm.password = await ipcRenderer.invoke('store-get', 'user.password') || '';
            loginForm.rememberPwd = await ipcRenderer.invoke('store-get', 'user.rememberPwd') || false;
            // loginForm.autoLogin = await ipcRenderer.invoke('store-get', 'user.autoLogin') || false;

            console.log(loginForm);
            // 自动登录
            // if (loginForm.autoLogin && loginForm.username && loginForm.password) {
            //     await handleLogin();
            // }
        };
        // 保存数据到 electron-store
        const saveData = async () => {
            // 调用主进程的 store-set 接口
            await ipcRenderer.invoke('store-set', 'user.username', loginForm.username);
            await ipcRenderer.invoke('store-set', 'user.password', loginForm.password);
            await ipcRenderer.invoke('store-set', 'user.rememberPwd', loginForm.rememberPwd);
            // await ipcRenderer.invoke('store-set', 'user.autoLogin', loginForm.autoLogin);
        };
        onMounted(() => {
            getData().then(r => {});
        });
        onUnmounted(() => {
        });
        return {
            loginForm,
            rules,
            loginFormRef,
            handleLogin,
            handleClose,
            loading
        };
    }
};