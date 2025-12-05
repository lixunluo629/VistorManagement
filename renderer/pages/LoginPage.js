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

            <el-form-item>
              <el-button
                  type="primary"
                  style="width: 100%;"
                  @click="handleLogin"
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
            password: ''
        });

        // 表单验证规则
        const rules = reactive({
            username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
            password: [{required: true, message: '请输入密码', trigger: 'blur'}]
        });

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
        onMounted(() => {
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