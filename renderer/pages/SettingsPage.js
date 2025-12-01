import { HeaderBar } from '../components/HeaderBar.js';

export const SettingsPage = {
    components: { HeaderBar },
    template: `
      <div style="height: 100vh; overflow: hidden; margin: 0; padding: 0; box-sizing: border-box; display: flex; flex-direction: column;">
        <!-- 顶部Header栏（非主界面显示返回按钮） -->
        <HeaderBar :isMainPage=false />
        <el-container style="height: 100vh; padding: 15px;">
      <el-main style="padding: 0; background-color: #fff;">
        <el-card>
          <div slot="header">
            <span style="font-size: 16px;">设置中心</span>
          </div>
          
          <!-- 密码验证弹窗（默认显示） -->
          <el-dialog v-model="showPasswordDialog" title="管理员验证" :close-on-click-modal="false">
            <el-form>
              <el-form-item label="管理员密码" required>
                <el-input type="password" v-model="password" @keydown.enter="verifyPassword" placeholder="请输入管理员密码"></el-input>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="cancelPassword">取消</el-button>
              <el-button type="primary" @click="verifyPassword">确认</el-button>
            </template>
          </el-dialog>
          
          <!-- 设置内容（验证通过后显示） -->
          <el-tabs v-model="activeTab" v-if="isAuthenticated">
            <!-- 服务器设置 -->
            <el-tab-pane label="服务器设置" name="server">
              <el-form label-width="120px" style="padding: 20px;">
                <el-form-item label="服务器IP" required>
                  <el-input v-model="serverConfig.ip" placeholder="如 192.168.1.100"></el-input>
                </el-form-item>
                <el-form-item label="接口端口" required>
                  <el-input v-model="serverConfig.port" placeholder="如 8080"></el-input>
                </el-form-item>
                <el-form-item label="API路径">
                  <el-input v-model="serverConfig.apiPath" placeholder="如 /api/visitor"></el-input>
                </el-form-item>
                <el-form-item label="超时时间">
                  <el-input v-model="serverConfig.timeout" suffix="秒" placeholder="默认30秒"></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveServerConfig">保存设置</el-button>
                  <el-button style="margin-left: 10px;" @click="testConnection">测试连接</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 必填项设置 -->
            <el-tab-pane label="必填项设置" name="required">
              <el-card style="margin: 20px;">
                <div slot="header">登记必填项设置</div>
                <el-checkbox-group v-model="requiredFields" style="padding: 10px 20px;">
                  <el-row :gutter="20">
                    <el-col :span="8"><el-checkbox label="carNumber">车牌号</el-checkbox></el-col>
                    <el-col :span="8"><el-checkbox label="idNumber">证件号码</el-checkbox></el-col>
                    <el-col :span="8"><el-checkbox label="phone">手机号</el-checkbox></el-col>
                    <el-col :span="8"><el-checkbox label="reason">来访事由</el-checkbox></el-col>
                    <el-col :span="8"><el-checkbox label="company">来访单位</el-checkbox></el-col>
                    <el-col :span="8"><el-checkbox label="interviewee">拜访人</el-checkbox></el-col>
                    <el-col :span="8"><el-checkbox label="items">携带物品</el-checkbox></el-col>
                  </el-row>
                </el-checkbox-group>
                <div style="padding: 10px 20px; text-align: right;">
                  <el-button type="primary" @click="saveRequiredFields">保存设置</el-button>
                </div>
              </el-card>
            </el-tab-pane>
            
            <!-- 字典设置 -->
            <el-tab-pane label="字典设置" name="dictionary">
              <el-card style="margin: 20px;">
                <div slot="header">
                  <el-row :gutter="20" align="middle">
                    <el-col :span="12">访客类型</el-col>
                    <el-col :span="12" style="text-align: right;">
                      <el-button type="primary" size="small">+ 添加</el-button>
                    </el-col>
                  </el-row>
                </div>
                <el-table :data="visitorTypes" border size="small">
                  <el-table-column prop="id" label="ID" width="60"></el-table-column>
                  <el-table-column prop="name" label="类型名称"></el-table-column>
                  <el-table-column label="操作" width="120">
                    <template #default>
                      <el-button type="text" size="small">编辑</el-button>
                      <el-button type="text" size="small" style="color: #f56c6c;">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
              
              <!-- 来访事由设置（结构同上，省略重复代码） -->
              <el-card style="margin: 20px;">
                <div slot="header">
                  <el-row :gutter="20" align="middle">
                    <el-col :span="12">来访事由</el-col>
                    <el-col :span="12" style="text-align: right;">
                      <el-button type="primary" size="small">+ 添加</el-button>
                    </el-col>
                  </el-row>
                </div>
                <el-table :data="visitReasons" border size="small">
                  <el-table-column prop="id" label="ID" width="60"></el-table-column>
                  <el-table-column prop="name" label="事由名称"></el-table-column>
                  <el-table-column label="操作" width="120">
                    <template #default>
                      <el-button type="text" size="small">编辑</el-button>
                      <el-button type="text" size="small" style="color: #f56c6c;">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-tab-pane>
            
            <!-- 系统设置 -->
            <el-tab-pane label="系统设置" name="system">
              <el-form label-width="150px" style="padding: 20px;">
                <el-form-item label="人脸比对阈值">
                  <el-slider v-model="systemConfig.faceThreshold" :min="50" :max="100" :step="1" show-input></el-slider>
                </el-form-item>
                
                <el-form-item label="认证模式">
                  <el-radio-group v-model="systemConfig.authMode">
                    <el-radio label="1">身份证照片+现场人脸比对</el-radio>
                    <el-radio label="2">登记照片+现场人脸比对</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="二维码扫描器串口">
                  <el-select v-model="systemConfig.serialPort">
                    <el-option label="COM1" value="COM1"></el-option>
                    <el-option label="COM2" value="COM2"></el-option>
                    <el-option label="COM3" value="COM3"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="打印机设置">
                  <el-checkbox v-model="systemConfig.printEnabled">开启打印功能</el-checkbox>
                  <el-select v-model="systemConfig.printerName" style="margin-top: 10px; width: 100%;">
                    <el-option label="Zebra ZD420" value="1"></el-option>
                    <el-option label="HP LaserJet" value="2"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="摄像头设备">
                  <el-select v-model="systemConfig.camera">
                    <el-option label="集成摄像头" value="1"></el-option>
                    <el-option label="USB摄像头" value="2"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveSystemConfig">保存设置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-main>
    </el-container>
      </div>
  `,
    setup() {
        const { ref, reactive } = Vue;
        const { ElMessage } = ElementPlus;

        // 密码验证相关
        const showPasswordDialog = ref(true);
        const password = ref('');
        const isAuthenticated = ref(false);

        // 标签页切换
        const activeTab = ref('server');

        // 服务器配置
        const serverConfig = reactive({
            ip: '192.168.1.100',
            port: '8080',
            apiPath: '/api/visitor',
            timeout: 30
        });

        // 必填项设置
        const requiredFields = ref(['idNumber', 'phone', 'interviewee', 'reason']);

        // 字典数据
        const visitorTypes = ref([
            { id: 1, name: '业务访客' },
            { id: 2, name: '技术支持' },
            { id: 3, name: '面试人员' }
        ]);
        const visitReasons = ref([
            { id: 1, name: '业务洽谈' },
            { id: 2, name: '技术支持' },
            { id: 3, name: '面试' }
        ]);

        // 系统设置
        const systemConfig = reactive({
            faceThreshold: 80,
            authMode: '1',
            serialPort: 'COM1',
            printEnabled: true,
            printerName: '1',
            camera: '1'
        });

        // 密码验证
        const verifyPassword = () => {
            if (!password.value) return ElMessage.warning('请输入密码');
            // 模拟验证（实际需对接后端）
            if (password.value === 'admin123') {
                isAuthenticated.value = true;
                showPasswordDialog.value = false;
                ElMessage.success('验证成功');
            } else {
                ElMessage.error('密码错误');
            }
        };

        const cancelPassword = () => {
            // 返回主界面
            history.back();
        };

        // 保存设置（模拟）
        const saveServerConfig = () => ElMessage.success('服务器设置已保存');
        const testConnection = () => ElMessage.success('连接测试成功');
        const saveRequiredFields = () => ElMessage.success('必填项设置已保存');
        const saveSystemConfig = () => ElMessage.success('系统设置已保存');

        return {
            showPasswordDialog,
            password,
            isAuthenticated,
            activeTab,
            serverConfig,
            requiredFields,
            visitorTypes,
            visitReasons,
            systemConfig,
            verifyPassword,
            cancelPassword,
            saveServerConfig,
            testConnection,
            saveRequiredFields,
            saveSystemConfig
        };
    }
};