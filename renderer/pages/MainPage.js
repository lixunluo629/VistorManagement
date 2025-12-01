import { HeaderBar } from '../components/HeaderBar.js';

export const MainPage = {
    components: { HeaderBar },
    template: `
      <div class="full-height overflow-hidden m-0 p-0 box-sizing flex-column">
        <!-- 顶部Header栏 -->
        <HeaderBar :isMainPage=true />

        <!-- 主体内容区 -->
        <el-container class="flex-1 d-flex main-container">
          <!-- 左侧：45%宽度（默认打开未离开访客+表格高度拉满） -->
          <el-aside class="main-aside">
            <!-- 外层卡片：高度100%，确保内部内容可拉满 -->
            <el-card 
                shadow="always"
                :body-style="{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }"
                class="main-aside-card flex-column"
            >
              <!-- 标签栏：type修正为border-card，绑定默认选中项 -->
              <el-tabs
                  v-model="activeTab"
                  type="border-card"
                  style="flex-shrink: 0; border-bottom: 1px solid #e6e6e6; height: calc(100% - 0px);"
              >
                <!-- 未离开访客：默认选中 -->
                <el-tab-pane  
                  name="active" 
                  class="full-height"
                  :content-style="{ height: '100%', padding: '0', overflow: 'hidden' }"
                >
                  <template #label>
                    <span class="main-tab-span">未离开访客</span>
                  </template>
                  <div class="table-container">
                    <el-table
                      :data="activeVisitors"
                      border
                      size="small"
                      style="height: 80%;"
                      :header-cell-style="{fontSize: '16px', fontWeight: '500'}"
                      :cell-style="{fontSize: '15px'}"
                    >
                      <el-table-column prop="name" label="姓名" width="120"></el-table-column>
                      <el-table-column prop="visitTime" label="来访时间" min-width="180"></el-table-column>
                      <el-table-column prop="interviewee" label="受访人" min-width="120"></el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>

                <!-- 进出流水 -->
                <el-tab-pane 
                  name="logs"
                  class="full-height"
                  :content-style="{ height: '100%', padding: '0', overflow: 'hidden' }"
                >
                  <template #label>
                    <span class="main-tab-span">进出流水</span>
                  </template>
                  <div class="table-container">
                    <el-table
                      :data="visitLogs"
                      border
                      size="small"
                      style="height: 80%;"
                      :header-cell-style="{fontSize: '16px', fontWeight: '500'}"
                      :cell-style="{fontSize: '15px'}"
                    >
                      <el-table-column prop="name" label="姓名" width="120"></el-table-column>
                      <el-table-column prop="time" label="时间" min-width="180"></el-table-column>
                      <el-table-column prop="action" label="操作" min-width="120">
                        <template #default="scope">
                          <el-tag :type="scope.row.action === '进入' ? 'success' : 'info'" style="font-size: 14px;">{{ scope.row.action }}</el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>

                <!-- 超期名单 -->
                <el-tab-pane 
                  name="overdue"
                  class="full-height"
                  :content-style="{ height: '100%', padding: '0', overflow: 'hidden' }"
                >
                  <template #label>
                    <span class="main-tab-span">超期名单</span>
                  </template>
                  <div class="table-container">
                    <el-table
                      :data="overdueVisitors"
                      border
                      size="small"
                      style="height: 80%;"
                      :header-cell-style="{fontSize: '16px', fontWeight: '500'}"
                      :cell-style="{fontSize: '15px'}"
                    >
                      <el-table-column prop="name" label="姓名" width="120"></el-table-column>
                      <el-table-column prop="visitTime" label="来访时间" min-width="180"></el-table-column>
                      <el-table-column prop="overdueTime" label="超期时间" min-width="150"></el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </el-aside>

          <!-- 中间板块（保持不变） -->
          <el-main class="main-main">
            <div class="main-grid">
              <el-card shadow="always" class="main-card">
                <div class="main-card-title">今日累计到访</div>
                <div class="main-card-value">28</div>
                <div class="main-card-sub">较昨日 +3</div>
              </el-card>
              <el-card shadow="always" class="main-card">
                <div class="main-card-title">预约总人数</div>
                <div class="main-card-value">35</div>
                <div class="main-card-sub">已到访 28人</div>
              </el-card>
              <el-card shadow="always" class="main-card">
                <div class="main-card-title">已离开人数</div>
                <div class="main-card-value">15</div>
                <div class="main-card-sub">未离开 13人</div>
              </el-card>
              <el-card shadow="always" class="main-card">
                <div class="main-card-title">超时未离开</div>
                <div class="main-card-value">3</div>
                <div class="main-card-sub">最长超期 2.5小时</div>
              </el-card>
            </div>
          </el-main>

          <!-- 右侧板块（保持不变） -->
          <el-aside class="main-actions">
            <div class="action-btn-group">
              <div class="action-btn-item">
                <el-button
                    size="large"
                    circle
                    class="action-btn"
                    @click="$router.push('/register')"
                ><el-icon><User /></el-icon></el-button>
                <span class="action-btn-span">来访登记</span>
              </div>
              <div class="action-btn-item">
                <el-button
                    size="large"
                    circle
                    class="action-btn"
                    @click="$router.push('/data-center')"
                ><el-icon><DataAnalysis /></el-icon></el-button>
                <span class="action-btn-span">数据中心</span>
              </div>
              <div class="action-btn-item">
                <el-button
                    size="large"
                    circle
                    class="action-btn"
                    @click="$router.push('/settings')"
                ><el-icon><Setting /></el-icon></el-button>
                <span class="action-btn-span">设置中心</span>
              </div>
              <div class="action-btn-item">
                <el-button
                    size="large"
                    circle
                    class="action-btn-last"
                    @click="showCheckoutDialog = true"
                >
                  <el-icon :size="24" style="color: #fff;">
                    <i class="fa fa-sign-out"></i>
                  </el-icon>
                </el-button>
                <span class="action-btn-span">签离</span>
              </div>
            </div>
          </el-aside>
        </el-container>

        <!-- 签离弹窗（保持不变） -->
        <el-dialog
            v-model="showCheckoutDialog"
            title="访客签离"
            :close-on-click-modal="false"
            :width="600"
            :before-close="handleDialogClose"
        >
          <!-- 扫码区域 -->
          <div class="scan-container">
            <!-- 扫码框 -->
            <div class="scan-frame">
              <!-- 扫描线动画 -->
              <div class="scan-line" :style="{ top: scanProgress + '%' }"></div>

              <!-- 扫码提示 -->
              <div class="scan-tip">请将二维码对准扫描区域</div>
            </div>

            <!-- 扫描进度 -->
<!--            <div class="scan-progress">-->
<!--              <el-progress-->
<!--                  :percentage="scanProgress"-->
<!--                  :stroke-width="4"-->
<!--                  style="margin-top: 20px;"-->
<!--              ></el-progress>-->
<!--              <p class="timeout-text">-->
<!--                {{ Math.ceil((100 - scanProgress) / 10) }}秒后自动关闭-->
<!--              </p>-->
<!--            </div>-->
          </div>

          <template #footer>
            <el-button @click="handleDialogClose">取消</el-button>
          </template>
        </el-dialog>

        <!-- 签离成功提示（保持不变） -->
        <el-dialog
            v-model="showSuccessDialog"
            title="签离成功"
            width="300px"
            :close-on-click-modal="false"
        >
          <div style="text-align: center; padding: 20px 0;">
            <el-icon :size="60" style="color: #52c41a; margin-bottom: 15px;">
              <CircleCheck />
            </el-icon>
            <p>访客 <span style="font-weight: bold;">{{ checkedOutVisitor.name }}</span> 已成功签离</p>
            <p style="color: #666; margin-top: 10px;">签离时间：{{ checkedOutVisitor.checkoutTime }}</p>
          </div>
          <template #footer>
            <div style="text-align: center;">
              <el-button type="primary" @click="showSuccessDialog = false">确认</el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    `,
    setup() {
        const { ref, onMounted, onUnmounted, nextTick, watch, reactive } = Vue;
        const { ipcRenderer } = require('electron');

        const activeTab = ref('active');
        const showCheckoutDialog = ref(false);
        const showSuccessDialog = ref(false);
        const scanProgress = ref(0);
        const scanTimer = ref(null);
        const checkedOutVisitor = ref({ name: '', checkoutTime: '' });
        const serialState = reactive({
            isConnected: false,
            portName: 'COM7',
            baudRate: 9600,
            error: ''
        });
        // 扫码结果
        const scanResult = ref('');

        // 初始化串口
        const initSerialPort = () => {
            ipcRenderer.send('init-serial', {
                portName: serialState.portName,
                baudRate: serialState.baudRate
            });
        };
        // 关闭串口
        const closeSerialPort = () => {
            ipcRenderer.send('close-serial');
        };
        // 关闭弹窗时停止扫描
        const handleDialogClose = () => {
            clearInterval(scanTimer.value);
            showCheckoutDialog.value = false;
            closeSerialPort();
        };
        // 扫描动画计时器
        const startScanAnimation = () => {
            if (scanTimer.value) clearInterval(scanTimer.value);
            scanProgress.value = 0;
            // 每30ms更新一次扫描线位置（约3秒完成一次扫描）
            scanTimer.value = setInterval(() => {
                scanProgress.value += 1;
                // 扫描线到达底部后重新从顶部开始
                if (scanProgress.value > 100) {
                    scanProgress.value = 0;
                }
            }, 30);
        };
        // 处理扫码结果
        const handleScanCode = (code) => {
            handleDialogClose();
            checkedOutVisitor.value = {
                name: code,
                checkoutTime: new Date().toLocaleString()
            };
            showSuccessDialog.value = true;
        };
        // 点击签离按钮时激活串口读取
        watch(showCheckoutDialog, (newVal) => {
            if (newVal) startScanAnimation();
            else scanProgress.value = 0;
        });

        const removeVisitorFromActiveList = (name) => {
            activeVisitors.value = activeVisitors.value.filter(v => v.name !== name);
            visitLogs.value.unshift({
                name: name,
                action: '离开',
                time: new Date().toLocaleString()
            });
        };

        // 模拟数据（保持不变）
        // 2. 用for循环批量生成模拟数据
        // —— 未离开访客数据（生成30条，确保超出表格高度）
        const activeVisitors = ref([]);
        // 循环生成30条不同访客数据
        for (let i = 1; i <= 30; i++) {
            // 随机生成来访时间（近2小时内）
            const randomHour = Math.floor(Math.random() * 2); // 0-1小时
            const randomMinute = Math.floor(Math.random() * 60); // 0-59分钟
            const visitTime = new Date();
            visitTime.setHours(visitTime.getHours() - randomHour);
            visitTime.setMinutes(visitTime.getMinutes() - randomMinute);
            // 格式化时间为 "YYYY-MM-DD HH:MM"
            const formattedTime = `${visitTime.getFullYear()}-${String(visitTime.getMonth() + 1).padStart(2, '0')}-${String(visitTime.getDate()).padStart(2, '0')} ${String(visitTime.getHours()).padStart(2, '0')}:${String(visitTime.getMinutes()).padStart(2, '0')}`;

            // 随机分配受访人（3个选项循环）
            const interviewees = ['李总', '王经理', '赵工'];
            const randomInterviewee = interviewees[Math.floor(Math.random() * interviewees.length)];

            // 推入数据数组
            activeVisitors.value.push({
                name: `访客${i}`, // 姓名按序号递增
                visitTime: formattedTime,
                interviewee: randomInterviewee
            });
        }
        const visitLogs = ref([]);
        for (let i = 1; i <= 50; i++) {
            // 随机生成时间（近4小时内）
            const randomHour = Math.floor(Math.random() * 4);
            const randomMinute = Math.floor(Math.random() * 60);
            const logTime = new Date();
            logTime.setHours(logTime.getHours() - randomHour);
            logTime.setMinutes(logTime.getMinutes() - randomMinute);
            const formattedLogTime = `${logTime.getFullYear()}-${String(logTime.getMonth() + 1).padStart(2, '0')}-${String(logTime.getDate()).padStart(2, '0')} ${String(logTime.getHours()).padStart(2, '0')}:${String(logTime.getMinutes()).padStart(2, '0')}`;

            // 随机生成"进入"或"离开"操作（概率各50%）
            const actions = ['进入', '离开'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];

            visitLogs.value.push({
                name: `访客${Math.floor(Math.random() * 30) + 1}`, // 随机复用1-30号访客姓名
                action: randomAction,
                time: formattedLogTime
            });
        }
        // —— 超期名单数据（生成5条）
        const overdueVisitors = ref([]);
        for (let i = 1; i <= 5; i++) {
            // 超期时间随机（1-3小时）
            const overdueHour = Math.floor(Math.random() * 3) + 1;
            const overdueMinute = Math.floor(Math.random() * 60);
            const overdueTime = `${overdueHour}小时${overdueMinute}分`;

            // 来访时间为当天早间
            const morningTime = new Date();
            morningTime.setHours(9 + Math.floor(Math.random() * 3)); // 9-11点
            morningTime.setMinutes(Math.floor(Math.random() * 60));
            const formattedMorningTime = `${morningTime.getFullYear()}-${String(morningTime.getMonth() + 1).padStart(2, '0')}-${String(morningTime.getDate()).padStart(2, '0')} ${String(morningTime.getHours()).padStart(2, '0')}:${String(morningTime.getMinutes()).padStart(2, '0')}`;

            overdueVisitors.value.push({
                name: `超期访客${i}`,
                visitTime: formattedMorningTime,
                overdueTime: overdueTime
            });
        }

        onMounted(()=>{
            ipcRenderer.on('serial-data-received', (event, code) => {
                handleScanCode(code);
            });
        });
        onUnmounted(() => {
            ipcRenderer.removeAllListeners('serial-data-received');
        });
        return {
            activeTab,
            activeVisitors,
            visitLogs,
            overdueVisitors,
            showCheckoutDialog,
            showSuccessDialog,
            scanProgress,
            checkedOutVisitor,
            serialState,
            handleDialogClose
        };
    }
};