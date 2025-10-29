import { HeaderBar } from '../components/HeaderBar.js';

export const MainPage = {
    components: { HeaderBar },
    template: `
      <div style="height: 100vh; overflow: hidden; margin: 0; padding: 0; box-sizing: border-box; display: flex; flex-direction: column;">
        <!-- 顶部Header栏 -->
        <HeaderBar :isMainPage=true />

        <!-- 主体内容区 -->
        <el-container style="flex: 1; display: flex; border: none; height: 750px;">
          <!-- 左侧：45%宽度（默认打开未离开访客+表格高度拉满） -->
          <el-aside
              style="width: 45%; background-color: #F5F7FA; padding: 20px; box-sizing: border-box; overflow: hidden; height: 100%;"
          >
            <!-- 外层卡片：高度100%，确保内部内容可拉满 -->
            <el-card 
                shadow="always"
                :body-style="{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }"
                style="height: 100%; display: flex; flex-direction: column; border-radius: 4px; overflow: hidden; font-size: 15px;"
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
                  style="height: 100%;"
                  :content-style="{ height: '100%', padding: '0', overflow: 'hidden' }"
              >
                <template #label>
                  <span style="font-size: 16px">未离开访客</span>
                </template>
                <div style="height: 100%; padding-top: 10px; box-sizing: border-box; overflow: hidden;">
                  <el-table
                      :data="activeVisitors"
                      border
                      size="small"
                      style="width: 100%; height: 100%;"
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
                  style="height: 100%;"
                  :content-style="{ height: '100%', padding: '0', overflow: 'hidden' }"
              >
                <template #label>
                  <span style="font-size: 16px">进出流水</span>
                </template>
                <div style="height: 100%; padding-top: 10px; box-sizing: border-box; overflow: hidden;">
                  <el-table
                      :data="visitLogs"
                      border
                      size="small"
                      style="width: 100%; height: 100%;"
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
                  style="height: 100%;"
                  :content-style="{ height: '100%', padding: '0', overflow: 'hidden' }"
              >
                <template #label>
                  <span style="font-size: 16px">超期名单</span>
                </template>
                <div style="height: 100%; padding-top: 10px; box-sizing: border-box; overflow: hidden;">
                  <el-table
                      :data="overdueVisitors"
                      border
                      size="small"
                      style="width: 100%; height: 100%;"
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
          <el-main
              style="width: 45%; padding: 20px; box-sizing: border-box; background-color: #F5F7FA; overflow: hidden; height: 100%; margin: 0;"
          >
            <div style="height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 20px;">
              <el-card shadow="always" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px; text-align: center;">
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">今日累计到访</div>
                <div style="font-size: 48px; font-weight: bold; color: #1890ff;">28</div>
                <div style="font-size: 14px; color: #999; margin-top: 8px;">较昨日 +3</div>
              </el-card>
              <el-card shadow="always" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px; text-align: center;">
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">预约总人数</div>
                <div style="font-size: 48px; font-weight: bold; color: #1890ff;">35</div>
                <div style="font-size: 14px; color: #999; margin-top: 8px;">已到访 28人</div>
              </el-card>
              <el-card shadow="always" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px; text-align: center;">
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">已离开人数</div>
                <div style="font-size: 48px; font-weight: bold; color: #52c41a;">15</div>
                <div style="font-size: 14px; color: #999; margin-top: 8px;">未离开 13人</div>
              </el-card>
              <el-card shadow="always" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px; text-align: center;">
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">超时未离开</div>
                <div style="font-size: 48px; font-weight: bold; color: #ff4d4f;">3</div>
                <div style="font-size: 14px; color: #999; margin-top: 8px;">最长超期 2.5小时</div>
              </el-card>
            </div>
          </el-main>

          <!-- 右侧板块（保持不变） -->
          <el-aside
              style="width: 10%; background-color: #F5F7FA; padding: 30px 0; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; overflow: hidden; height: 100%;"
          >
            <div style="display: flex; flex-direction: column; align-items: center; gap: 40px; justify-content: center; flex: 1;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <el-button
                    size="large"
                    circle
                    style="width: 80px; height: 80px; font-size: 24px; background-color: #1890ff; color: #fff; border: none;"
                    @click="$router.push('/register')"
                ><el-icon><User /></el-icon></el-button>
                <span style="font-size: 14px;">来访登记</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <el-button
                    size="large"
                    circle
                    style="width: 80px; height: 80px; font-size: 24px; background-color: #1890ff; color: #fff; border: none;"
                    @click="$router.push('/data-center')"
                ><el-icon><DataAnalysis /></el-icon></el-button>
                <span style="font-size: 14px;">数据中心</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <el-button
                    size="large"
                    circle
                    style="width: 80px; height: 80px; font-size: 24px; background-color: #1890ff; color: #fff; border: none;"
                    @click="$router.push('/settings')"
                ><el-icon><Setting /></el-icon></el-button>
                <span style="font-size: 14px;">设置中心</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <el-button
                    size="large"
                    circle
                    style="width: 80px; height: 80px; font-size: 24px; background-color: #52c41a; color: #fff; border: none;"
                    @click="showCheckoutDialog = true"
                >
                  <el-icon :size="24" style="color: #fff;">
                    <i class="fa fa-sign-out"></i>
                  </el-icon>
                </el-button>
                <span style="font-size: 14px;">签离</span>
              </div>
            </div>
          </el-aside>
        </el-container>

        <!-- 签离弹窗（保持不变） -->
        <el-dialog
            v-model="showCheckoutDialog"
            title="访客签离"
            width="400px"
            :close-on-click-modal="false"
            :show-close="false"
        >
          <div style="text-align: center; padding: 20px 0;">
            <div style="width: 200px; height: 200px; margin: 0 auto; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <img src="https://picsum.photos/200/200" alt="签离二维码" style="width: 180px; height: 180px;">
            </div>
            <p style="margin-bottom: 10px;">请使用访客凭证上的二维码扫码签离</p>
            <p style="color: #666; font-size: 14px;">正在等待扫码...</p>
            <el-progress
                :percentage="scanProgress"
                style="width: 80%; margin: 20px auto 0;"
                v-if="scanProgress > 0 && scanProgress < 100"
            ></el-progress>
          </div>
          <template #footer>
            <div style="text-align: center;">
              <el-button @click="showCheckoutDialog = false">取消</el-button>
            </div>
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
        const { ref, onMounted, onUnmounted, nextTick, watch } = Vue;
        const activeTab = ref('active');
        const showCheckoutDialog = ref(false);
        const showSuccessDialog = ref(false);
        const scanProgress = ref(0);
        const checkedOutVisitor = ref({ name: '', checkoutTime: '' });

        // 模拟扫码过程（保持不变）
        const simulateScan = () => {
            if (showCheckoutDialog.value) {
                scanProgress.value = 0;
                const timer = setInterval(() => {
                    scanProgress.value += 10;
                    if (scanProgress.value >= 100) {
                        clearInterval(timer);
                        showCheckoutDialog.value = false;
                        checkedOutVisitor.value = {
                            name: '张三',
                            checkoutTime: new Date().toLocaleString()
                        };
                        showSuccessDialog.value = true;
                        removeVisitorFromActiveList(checkedOutVisitor.value.name);
                    }
                }, 300);
            }
        };

        watch(showCheckoutDialog, (newVal) => {
            if (newVal) simulateScan();
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

        return {
            activeTab,
            activeVisitors,
            visitLogs,
            overdueVisitors,
            showCheckoutDialog,
            showSuccessDialog,
            scanProgress,
            checkedOutVisitor
        };
    }
};