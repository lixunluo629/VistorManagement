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

        // 登录处理
        const handleLogin = () => {
            loginFormRef.value.validate((valid) => {
                if (valid) {
                    if (loginForm.username === 'admin' && loginForm.password === '123456') {
                        ElementPlus.ElMessage.success('登录成功');
                        ipcRenderer.send('switch-to-main-window');
                    } else {
                        ElementPlus.ElMessage.error('用户名或密码错误');
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
        };
    }
};