import { HeaderBar } from '../components/HeaderBar.js';
import { visitorAPI } from "../utils/api.js";

export const RegisterPage = {
    components: { HeaderBar },
    template: `
      <div style="height: 100vh; overflow: hidden; margin: 0; padding: 0; display: flex; flex-direction: column;">
        <!-- 顶部Header -->
        <HeaderBar :isMainPage="false" />

        <!-- 主体内容区 -->
        <div style="flex: 1; padding: 20px; height: 800px; background-color: #f5f5f5; box-sizing: border-box; overflow-y: auto;">
          <el-card style="border-radius: 12px; padding: 20px; max-width: 1600px; margin: 0 auto; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <!-- 三栏等宽布局 -->
            <el-row :gutter="30" style="margin-bottom: 20px;">
              <!-- 1. 左侧：访客个人信息板块（浅蓝色背景） -->
              <el-col :span="8">
                <div style="height: 600px; border: 1px solid #ddd; border-radius: 12px; background-color: #e6f7ff; overflow: hidden;">
                  <!-- 标题栏（居中+下划线） -->
                  <div style="text-align: center; padding: 12px 0; font-size: 16px; font-weight: 500; color: #444; border-bottom: 1px solid #d9d9d9;">
                    访客个人信息
                  </div>

                  <!-- 内容区 -->
                  <div style="padding: 15px;">
                    <!-- 照片区域（身份证+现场照片） -->
                    <el-row :gutter="15" style="margin-bottom: 15px;">
                      <el-col :span="12">
                        <div style="border: 1px dashed #91c6f2; border-radius: 6px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
                          <el-icon :size="24" style="color: #1890ff; margin-bottom: 5px;">
                            <UserFilled />
                          </el-icon>
                          <p style="font-size: 12px; color: #1890ff;">
                            {{ visitorInfo.idCardPhoto ? '身份证照片' : '身份证照' }}
                          </p>
                          <img v-if="visitorInfo.idCardPhoto" :src="visitorInfo.idCardPhoto" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" />
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div style="border: 1px dashed #91c6f2; border-radius: 6px; height: 120px; cursor: pointer; position: relative; overflow: hidden;" @click="showCameraDialog = true">
                          <div v-if="!visitorInfo.livePhoto"
                               style="width: 100%;height: 100%; display: flex; flex-direction: column;align-items: center;justify-content: center;">
                            <el-icon :size="24" style="color: #1890ff; margin-bottom: 5px;">
                              <Camera />
                            </el-icon>
                            <p style="font-size: 12px; color: #1890ff;">开启摄像头拍摄</p>
                          </div>
                          <img v-if="visitorInfo.livePhoto" :src="visitorInfo.livePhoto" 
                               style="width: 100%; height: 100%; object-fit: cover; position: absolute;top: 0;left: 0;"alt="现场照片"/>
                        </div>
                      </el-col>
                    </el-row>

                    <!-- 来访状态 -->
                    <el-form-item label="来访状态" label-width="80px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.status" readonly style="background-color: #f0f7ff;" />
                    </el-form-item>

                    <!-- 访客姓名 -->
                    <el-form-item label="访客姓名" label-width="80px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.name" placeholder="请输入姓名" />
                    </el-form-item>

                    <!-- 证件号码 -->
                    <el-form-item label="证件号码" label-width="80px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.idCard" placeholder="请输入身份证号" />
                    </el-form-item>

                    <!-- 手机号码 -->
                    <el-form-item label="手机号码" label-width="80px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.phone" placeholder="请输入手机号" @keyup.enter="handlePhoneQuery"/>
                    </el-form-item>

                    <!-- 访客编号 -->
                    <el-form-item label="访客编号" label-width="80px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.applicationNo" readonly style="background-color: #f0f7ff;" />
                      <div slot="help" style="font-size: 12px; color: #666;">
                        {{ visitorInfo.applicationNo ? '已获取预约编号' : '无预约将自动生成' }}
                      </div>
                    </el-form-item>
                  </div>
                  <div style="margin-top: 20px; border-top: 1px solid #d9d9d9; padding-top: 15px;">
                    <p style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">读卡器数据</p>
                    <div v-if="latestCardData" style="background-color: #fff; padding: 10px; border-radius: 6px; font-size: 13px;">
                      <p>{{ latestCardData }}</p>
                    </div>
                    <div v-else style="color: #666; font-size: 13px;">等待刷卡...</div>
                  </div>
                </div>
              </el-col>

              <!-- 2. 中间：补充登记板块（淡灰色背景） -->
              <el-col :span="8">
                <div style="height: 600px; border: 1px solid #ddd; border-radius: 12px; background-color: #f5f5f5; overflow: hidden;">
                  <!-- 标题栏 -->
                  <div style="text-align: center; padding: 12px 0; font-size: 16px; font-weight: 500; color: #444; border-bottom: 1px solid #d9d9d9;">
                    补充登记信息
                  </div>

                  <!-- 内容区（label单独一行，输入框单独一行） -->
                  <div style="padding: 15px;">
                    <!-- 来访事由 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        来访事由
                      </label>
                      <el-select v-model="supplementInfo.reason" placeholder="请选择事由" style="width: 100%;">
                        <el-option label="业务洽谈" value="business"></el-option>
                        <el-option label="技术支持" value="tech"></el-option>
                        <el-option label="面试" value="interview"></el-option>
                        <el-option label="参观考察" value="visit"></el-option>
                        <el-option label="其他" value="other"></el-option>
                      </el-select>
                    </div>

                    <!-- 车牌号码 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        车牌号码
                      </label>
                      <el-input v-model="supplementInfo.licensePlate" placeholder="如：粤A12345" style="width: 100%;" />
                    </div>

                    <!-- 来访单位 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        来访单位
                      </label>
                      <el-input v-model="supplementInfo.company" placeholder="请输入单位名称" style="width: 100%;" />
                    </div>

                    <!-- 访客类型 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        访客类型
                      </label>
                      <el-select v-model="supplementInfo.type" placeholder="请选择类型" style="width: 100%;">
                        <el-option label="外部客户" value="customer"></el-option>
                        <el-option label="应聘人员" value="applicant"></el-option>
                        <el-option label="合作单位" value="partner"></el-option>
                        <el-option label="亲友访客" value="friend"></el-option>
                      </el-select>
                    </div>

                    <!-- 登记备注 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        登记备注
                      </label>
                      <el-input v-model="supplementInfo.remark" type="textarea" :rows="3" placeholder="请输入备注信息（可选）" style="width: 100%;" />
                    </div>
                  </div>
                </div>
              </el-col>

              <!-- 3. 右侧：拜访信息板块（淡灰色背景） -->
              <el-col :span="8">
                <div style="height: 600px; border: 1px solid #ddd; border-radius: 12px; background-color: #f5f5f5; overflow: hidden;">
                  <!-- 标题栏 -->
                  <div style="text-align: center; padding: 12px 0; font-size: 16px; font-weight: 500; color: #444; border-bottom: 1px solid #d9d9d9;">
                    拜访信息
                  </div>

                  <!-- 内容区（label单独一行，输入框单独一行） -->
                  <div style="padding: 15px;">
                    <!-- 被访人查询（无label） -->
                    <div style="margin-bottom: 15px;">
                      <el-input
                          v-model="visitInfo.searchKeyword"
                          placeholder="请输入拜访人姓名/手机号码进行查询"
                          @keyup.enter.stop="searchInterviewee"
                          style="width: 100%;"
                      >
                        <el-button slot="append" icon="Search" @click="searchInterviewee"></el-button>
                      </el-input>
                    </div>

                    <!-- 被访人信息（查询后填充） -->
                    <div style="border: 1px solid #eee; border-radius: 6px; padding: 10px; margin-bottom: 15px; background-color: #fff; min-height: 100px; box-sizing: border-box;">
                      <el-row :gutter="10">
                        <el-col :span="12">
                          <p style="font-size: 12px; color: #666; margin: 0 0 3px 0;">被访人姓名</p>
                          <p style="font-weight: 500; margin: 0 0 8px 0; min-height: 20px;">
                            {{ visitInfo.interviewee.name || '-' }}
                          </p>
                        </el-col>
                        <el-col :span="12">
                          <p style="font-size: 12px; color: #666; margin: 0 0 3px 0;">所属部门</p>
                          <p style="margin: 0 0 8px 0; min-height: 20px;">
                            {{ visitInfo.interviewee.department || '-' }}
                          </p>
                        </el-col>
                        <el-col :span="24">
                          <p style="font-size: 12px; color: #666; margin: 0 0 3px 0;">手机号码</p>
                          <p style="margin: 0; min-height: 20px;">
                            {{ visitInfo.interviewee.phone || '-' }}
                          </p>
                        </el-col>
                      </el-row>
                    </div>

                    <!-- 携带物品 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        携带物品
                      </label>
                      <el-input v-model="visitInfo.items" placeholder="如：电脑、文件袋" style="width: 100%;" />
                    </div>

                    <!-- 有效时间 -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        有效时间
                      </label>
                      <el-date-picker
                          v-model="visitInfo.validTime"
                          type="datetime"
                          placeholder="选择有效截止时间"
                          format="YYYY-MM-DD HH:mm"
                          style="width: 100%;"
                      ></el-date-picker>
                    </div>

                    <!-- 卡号授权（数字输入） -->
                    <div style="margin-bottom: 15px;">
                      <label style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        卡号授权
                      </label>
                      <el-input
                          v-model="visitInfo.cardAuth"
                          placeholder="请输入授权卡号（数字）"
                          style="width: 100%;"
                          type="number"
                      />
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 操作按钮（右下角） -->
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <el-button size="large" type="default" @click="resetForm" >
                清空
              </el-button>
              <el-button size="large" type="primary" @click="handleRegister">
                确认登记
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 摄像头拍摄弹窗 -->
        <el-dialog
            v-model="showCameraDialog"
            title="现场拍照"
            width="600px"
            :close-on-click-modal="false"
        >
          <!-- 视频流容器 -->
          <div style="text-align: center; margin-bottom: 15px;">
            <video
                ref="videoElement"
                autoplay
                playsinline
                style="width: 100%; max-height: 400px; border: 1px solid #ddd;"
            ></video>
            <!-- 用于捕获画面的Canvas（隐藏） -->
            <canvas ref="canvasElement" style="display: none;"></canvas>
          </div>

          <!-- 操作按钮 -->
          <template #footer>
            <el-button @click="closeCamera">取消</el-button>
            <el-button type="primary" @click="capturePhoto">拍照</el-button>
          </template>
        </el-dialog>

        <!-- 登记成功弹窗 -->
        <el-dialog
            v-model="showSuccessDialog"
            title="登记成功"
            width="300px"
            :close-on-click-modal="false"
        >
          <div style="text-align: center; padding: 20px 0;">
            <!-- 动态显示图标：打印中显示加载图标，完成后显示对勾 -->
            <el-icon
                :size="60"
                :style="{
                    color: printing ? '#1890ff' : '#52c41a',  // 动态颜色
                    marginBottom: '15px'  // 固定样式（注意驼峰命名：margin-bottom → marginBottom）
                  }"
            >
              <template v-if="printing">
                <Loading /> <!-- 打印中显示加载图标 -->
              </template>
              <template v-else>
                <CircleCheck /> <!-- 打印完成显示对勾 -->
              </template>
            </el-icon>

            <!-- 动态显示文字内容 -->
            <p v-if="printing">正在打印访客凭证...</p>
            <p v-else>访客 {{ visitorInfo.name }} 登记成功！</p>

            <p style="color: #666; margin-top: 10px;" v-if="!printing">
              访客编号：{{ visitorInfo.applicationNo }}
            </p>

            <!-- 打印失败提示（可选） -->
            <p style="color: #f56c6c; margin-top: 10px;" v-if="printError">
              {{ printError }}
            </p>
          </div>

          <template #footer>
            <!-- 打印中不显示按钮，完成/失败后显示 -->
            <el-button
                type="primary"
                @click="handleDialogClose;$router.push('/main')"
                v-if="!printing"
            >
              确认
            </el-button>

            <!-- 打印失败时显示重试按钮 -->
            <el-button
                type="warning"
                @click="retryPrint"
                v-if="printError"
                style="margin-right: 10px;"
            >
              重试打印
            </el-button>
          </template>
        </el-dialog>
      </div>
    `,
    setup() {
        const { ref, onMounted, onUnmounted, watch } = Vue;
        const { ElMessage, ElLoading } = ElementPlus;
        const { ipcRenderer } = require('electron');

        // 新增：存储读卡器数据
        const cardDataList = ref([]); // 历史数据列表
        const latestCardData = ref(null); // 最新数据

        onMounted(async () => {
            ipcRenderer.on('main-process-log', (event, data) => {
                console.log('[主进程]', data.message);
            });
            // 启动读卡器进程
            const result = await ipcRenderer.invoke('start-reader');
            if (result.success) {
                ElementPlus.ElNotification({
                    title: '提示',
                    message: '读卡器已启动，等待刷卡...',
                    type: 'info'
                });
            }

            // 监听主进程发送的读卡器数据
            ipcRenderer.on('card-data', async (event, data) => {
                console.log('收到的数据:', data)
                if (data.type === 'success' && data.content?.data) {
                    const cardInfo = data.content.data; // 提取身份证信息
                    console.log('解析后的身份证信息:', cardInfo);

                    // 1. 显示身份证数据
                    latestCardData.value = cardInfo;
                    cardDataList.value.unshift({
                        ...cardInfo,
                        readTime: data.timestamp || new Date().toLocaleString(),
                        message: data.content.message
                    });

                    // 2. 自动查询访客申请（核心修改）
                    if (cardInfo.idNumber) { // 确保身份证号存在
                        const queryResult = await queryVisitorApplication(cardInfo.idNumber);
                        if (queryResult.success) {
                            fillVisitorForm(queryResult.data);
                        }
                    }
                } else {
                    console.warn('无效的读卡器数据:', data);
                    ElMessage.warning(data.content?.message || '身份证读取失败');
                }
            });
        });

        onUnmounted(async () => {
            // 停止读卡器进程
            await ipcRenderer.invoke('stop-reader');
            // 移除事件监听，避免内存泄漏
            ipcRenderer.removeAllListeners('card-data');
            // 移除摄像头监控
            closeCamera();
        });

        // 1. 访客个人信息
        const visitorInfo = ref({
            status: '已预约',
            name: '',
            idCard: '',
            phone: '',
            applicationNo: '',
            idCardPhoto: '',
            livePhoto: ''
        });

        // 2. 补充登记信息
        const supplementInfo = ref({
            reason: '',
            licensePlate: '',
            company: '',
            type: '',
            remark: ''
        });

        // 3. 拜访信息（卡号授权改为数字输入）
        const visitInfo = ref({
            searchKeyword: '',
            interviewee: { name: '', department: '', phone: '' },
            items: '',
            validTime: new Date(new Date().getTime() + 3600000 * 2).toISOString(),
            cardAuth: '' // 数字卡号
        });

        // 4. 弹窗控制
        const showCameraDialog = ref(false); // 摄像头弹窗
        const showSuccessDialog = ref(false);

        // 手机号输入框回车查询拜访申请
        const handlePhoneQuery = async () => {
            if (!visitorInfo.value.phone) {
                ElMessage.warning('请输入手机号');
                return;
            }
            // 调用查询接口（仅传手机号）
            const queryResult = await queryVisitorApplication(null, visitorInfo.value.phone);
            if (queryResult.success) {
                fillVisitorForm(queryResult.data); // 复用表单填充逻辑
            }
        };
        // 新增：表单填充复用函数（提取原身份证查询中的填充逻辑）
        const fillVisitorForm = (appData) => {
            visitorInfo.value.name = appData.visitor_name || '';
            visitorInfo.value.idCard = appData.visitor_idcard || '';
            visitorInfo.value.phone = appData.visitor_phone || '';

            supplementInfo.value.company = appData.visitor_company || '';
            supplementInfo.value.reason = appData.reason || '';

            visitInfo.value.interviewee = {
                name: appData.interviewee || '',
                department: appData.host_department || '',
                phone: appData.host_mobile || ''
            };
            visitInfo.value.validTime = new Date(appData.plan_leave_time).toISOString();

            // 存储申请单号（用于后续记录进出）
            visitorInfo.value.applicationNo = appData.application_no;
        };

        // 5. 照片上传/拍摄
        // const livePhoto = ref(''); // 存储拍摄的照片（base64格式）
        const videoElement = ref(null); // 视频元素引用
        const canvasElement = ref(null); // Canvas元素引用
        let stream = null; // 摄像头数据流
        // 打开摄像头
        const openCamera = async () => {
            try {
                // 请求摄像头权限（优先前置摄像头）
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' } // 切换为 'environment' 可使用后置摄像头
                });
                // 将流绑定到视频元素
                if (videoElement.value) {
                    videoElement.value.srcObject = stream;
                }
            } catch (err) {
                ElMessage.error(`摄像头访问失败：${err.message}`);
                console.error('摄像头错误:', err);
                showCameraDialog.value = false; // 打开失败则关闭弹窗
            }
        };

        // 拍摄照片
        const capturePhoto = () => {
            if (!videoElement.value || !canvasElement.value) return;

            // 设置Canvas尺寸与视频一致
            const { videoWidth, videoHeight } = videoElement.value;
            canvasElement.value.width = videoWidth;
            canvasElement.value.height = videoHeight;

            // 绘制当前视频帧到Canvas
            const ctx = canvasElement.value.getContext('2d');
            ctx.drawImage(videoElement.value, 0, 0, videoWidth, videoHeight);

            // 将Canvas内容转为base64图片，赋值给livePhoto
            visitorInfo.value.livePhoto = canvasElement.value.toDataURL('image/jpeg');

            // 关闭弹窗并停止摄像头
            closeCamera();
            ElMessage.success('拍照成功');
        };

        // 关闭摄像头并释放资源
        const closeCamera = () => {
            if (stream) {
                // 停止所有轨道
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            showCameraDialog.value = false;
        };

        // 监听弹窗显示状态：打开时启动摄像头，关闭时释放资源
        watch(showCameraDialog, (newVal) => {
            if (newVal) {
                openCamera(); // 弹窗打开时初始化摄像头
            } else {
                closeCamera(); // 弹窗关闭时释放资源
            }
        });

        // 6. 被访人查询
        const searchInterviewee = () => {
            if (!visitInfo.value.searchKeyword) {
                ElementPlus.ElNotification({ title: '提示', message: '请输入查询关键词', type: 'warning' });
                return;
            }
            visitInfo.value.interviewee = { name: '张经理', department: '技术部', phone: '13800138000' };
        };

        // 7. 清空表单
        const resetForm = () => {
            visitorInfo.value = { status: '已预约', name: '', idCard: '', phone: '', applicationNo: '', idCardPhoto: '', livePhoto: '' };
            supplementInfo.value = { reason: '', licensePlate: '', company: '', type: '', remark: '' };
            visitInfo.value = { searchKeyword: '', interviewee: { name: '', department: '', phone: '' }, items: '', validTime: new Date(new Date().getTime() + 3600000 * 2).toISOString(), cardAuth: '' };
        };

        // 8. 确认登记
        const printing = ref(false); // 控制打印状态
        const printError = ref(''); // 存储打印错误信息
        const generateVisitorCode = () => {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            return `VIS-${timestamp}-${random}`;
        };
        const handleRegister = async () => {
            // 1. 表单校验（原有逻辑）
            if (!visitorInfo.value.name || !visitorInfo.value.idCard) {
                ElMessage.warning('请完善访客姓名和身份证信息');
                return;
            }
            if (!visitorInfo.value.applicationNo) {
                ElMessage.warning('未查询到对应访客申请，无法登记');
                return;
            }

            // 2. 生成访客编码并显示弹窗（原有逻辑）
            showSuccessDialog.value = true;
            printing.value = true;
            printError.value = '';

            try {
                // 4. 记录进入状态（新增逻辑）
                const recordResult = await recordVisitorEntry(
                    visitorInfo.value.applicationNo,
                    'enter', // 进入类型
                    '前台登记进入' // 备注
                );
                if (recordResult.success) {
                    ElMessage.success('登记成功并记录进入状态');
                }

                // 3. 打印访客凭证（原有逻辑）
                await ipcRenderer.invoke('print-visitor-code', visitorInfo.value.applicationNo);

                printing.value = false;
            } catch (error) {
                printing.value = false;
                printError.value = `操作失败：${error.message || '请重试'}`;
            }
        };

        // 查询访客申请接口
        const queryVisitorApplication = async (idcard, phone) => {
            if (!idcard && !phone) {
                ElMessage.warning('请提供身份证号或手机号');
                return { success: false };
            }
            try {
                const requestData = {};
                if (idcard) requestData.idcard = idcard;
                if (phone) requestData.phone = phone;
                const data = await visitorAPI.query(requestData);
                if (data) {
                    return { success: true, data: data };
                } else {
                    // ElMessage.warning('未查询到访客申请');
                    return { success: false };
                }
            } catch (error) {
                console.error('查询访客申请失败:', error);
                ElMessage.error('查询接口异常，请重试');
                return { success: false };
            }
        };

        // 记录进出记录接口
        const recordVisitorEntry = async (applicationNo, type, remark) => {
            try {
                const data = await visitorAPI.record(
                    { application_no: applicationNo, type, remark }
                );
                if (data) {
                    return { success: true };
                } else {
                    return { success: false };
                }
            } catch (error) {
                console.error('记录进出状态失败:', error);
                ElMessage.error('记录接口异常，请重试');
                return { success: false };
            }
        };
        // 关闭弹窗
        const handleDialogClose = () => {
            showSuccessDialog.value = false;
            printError.value = ''; // 重置错误信息
        };

        // 重试打印
        const retryPrint = async () => {
            printing.value = true;
            printError.value = '';
            try {
                await ipcRenderer.invoke('print-visitor-code', visitorInfo.value.applicationNo);
                printing.value = false;
            } catch (error) {
                printing.value = false;
                printError.value = `打印失败：${error.message}`;
            }
        };

        return {
            visitorInfo,
            supplementInfo,
            visitInfo,
            showCameraDialog,
            showSuccessDialog,
            capturePhoto,
            closeCamera,
            searchInterviewee,
            resetForm,
            handleRegister,
            cardDataList,
            latestCardData,
            videoElement,
            canvasElement,
            printing,
            printError,
            handleDialogClose,
            retryPrint,
            handlePhoneQuery,
            fillVisitorForm
        };
    }
};