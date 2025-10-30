export const LoginPage = {
    template: `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh;">
        <el-card shadow="never" style="width: 350px; height: 500px; padding: 30px; position: relative; background-color: transparent; border: 0;">
          <!-- 关闭按钮 -->
          <el-button
              type="text"
              style="position: absolute; top: 10px; right: 10px; color: #999; padding: 5px;"
              @click="handleClose"
          >
            <el-icon><Close /></el-icon>
          </el-button>

          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 24px; color: #1890ff; margin: 0;">访客管理系统</h2>
            <p style="color: #666; margin-top: 10px;">请登录后使用系统功能</p>
          </div>

          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
            </el-form-item>

            <el-button type="primary" style="width: 100%;" @click="handleLogin">登录</el-button>
          </el-form>
        </el-card>
      </div>
    `,
    setup() {
        const {ref, reactive} = Vue;
        const router = VueRouter.useRouter();
        const {ipcRenderer} = require('electron'); // 引入ipcRenderer
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

        return {
            loginForm,
            rules,
            loginFormRef,
            handleLogin,
            handleClose,
        };
    }
};