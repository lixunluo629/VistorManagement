import {HeaderBar} from '../components/HeaderBar.js';
import {visitorAPI} from "../utils/api.js";

export const RegisterPage = {
    components: {HeaderBar},
    template: `
      <div style="height: 100vh; overflow: hidden; margin: 0; padding: 0; display: flex; flex-direction: column;">
        <!-- 顶部Header -->
        <HeaderBar :isMainPage="false"/>

        <!-- 主体内容区 -->
        <div
            style="flex: 1; padding: 20px; height: 800px; background-color: #f5f5f5; box-sizing: border-box; overflow-y: auto;">
          <el-card
              style="border-radius: 12px; padding: 20px; max-width: 1600px; margin: 0 auto; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <!-- 三栏等宽布局 -->
            <el-row :gutter="30" style="margin-bottom: 20px;">
              <!-- 1. 左侧：访客个人信息板块（浅蓝色背景） -->
              <el-col :span="8">
                <div
                    style="height: 600px; border: 1px solid #ddd; border-radius: 12px; background-color: #e6f7ff; overflow: hidden;">
                  <!-- 标题栏（居中+下划线） -->
                  <div
                      style="text-align: center; padding: 12px 0; font-size: 16px; font-weight: 500; color: #444; border-bottom: 1px solid #d9d9d9;">
                    访客个人信息
                  </div>

                  <!-- 内容区 -->
                  <div style="padding: 15px;">
                    <!-- 照片区域（身份证+现场照片） -->
                    <el-row :gutter="15" style="margin-bottom: 15px;">
                      <el-col :span="12">
                        <div
                            style="border: 1px dashed #91c6f2; border-radius: 6px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden;">
                          <!-- 身份证照片展示（自动显示读卡器返回的base64） -->
                          <div v-if="!visitorInfo.idCardPhoto"
                               style="width: 100%; height: 100%; display: flex; flex-direction: column;align-items: center;justify-content: center;">
                            <el-icon :size="24" style="color: #1890ff; margin-bottom: 5px;">
                              <UserFilled/>
                            </el-icon>
                            <p style="font-size: 12px; color: #1890ff;">身份证照</p>
                          </div>
                          <img v-if="visitorInfo.idCardPhoto" :src="visitorInfo.idCardPhoto"
                               style="height: 100%; object-fit: cover; border-radius: 6px;"/>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div
                            style="border: 1px dashed #91c6f2; border-radius: 6px; height: 120px; cursor: pointer; position: relative; overflow: hidden;text-align: center"
                            @click="showCameraDialog = true">
                          <div v-if="!visitorInfo.livePhoto"
                               style="width: 100%;height: 100%; display: flex; flex-direction: column;align-items: center;justify-content: center;">
                            <el-icon :size="24" style="color: #1890ff; margin-bottom: 5px;">
                              <Camera/>
                            </el-icon>
                            <p style="font-size: 12px; color: #1890ff;">开启摄像头拍摄</p>
                          </div>
                          <img v-if="visitorInfo.livePhoto" :src="visitorInfo.livePhoto"
                               style="max-width:100%;max-height: 100%;"
                               alt="现场照片"/>
                        </div>
                      </el-col>
                    </el-row>

                    <!-- 来访状态 -->
                    <el-form-item label="来访状态" label-width="90px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.status" readonly style="background-color: #f0f7ff;"/>
                    </el-form-item>

                    <!-- 访客姓名（必填） -->
                    <el-form-item label="访客姓名" label-width="90px" style="margin-bottom: 12px;">
                      <template #label>
                        访客姓名<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </template>
                      <el-input v-model="visitorInfo.name" placeholder="请输入姓名"/>
                    </el-form-item>

                    <!-- 证件号码（非必填） -->
                    <el-form-item label="证件号码" label-width="90px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.idCard" placeholder="请输入身份证号（非必填）"/>
                    </el-form-item>

                    <!-- 手机号码（必填） -->
                    <el-form-item label="手机号码" label-width="90px" style="margin-bottom: 12px;">
                      <template #label>
                        手机号码<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </template>
                      <el-input 
                          v-model="visitorInfo.phone" 
                          placeholder="请输入手机号" 
                          @keyup.enter="handlePhoneQuery"
                          type="number"/>
                    </el-form-item>

                    <!-- 访客单位（必填） -->
                    <el-form-item label="访客单位" label-width="90px" style="margin-bottom: 12px;">
                      <template #label>
                        访客单位<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </template>
                      <el-input v-model="visitorInfo.company" placeholder="请输入访客单位"/>
                    </el-form-item>

                    <!-- 访客编号 -->
<!--                    <el-form-item label="访客编号" label-width="90px" style="margin-bottom: 12px;">-->
<!--                      <el-input v-model="visitorInfo.applicationNo" readonly style="background-color: #f0f7ff;"/>-->
<!--                      <div slot="help" style="font-size: 12px; color: #666;">-->
<!--                        {{ visitorInfo.applicationNo ? '已获取预约编号' : '无预约将自动生成' }}-->
<!--                      </div>-->
<!--                    </el-form-item>-->
                  </div>
                  <div style="margin-top: 20px; border-top: 1px solid #d9d9d9; padding-top: 15px;display: none;">
                    <p style="font-size: 14px; font-weight: 500; margin-bottom: 10px;">读卡器数据</p>
                    <div v-if="latestCardData"
                         style="background-color: #fff; padding: 10px; border-radius: 6px; font-size: 13px;">
                      <p>{{ latestCardData }}</p>
                    </div>
                    <div v-else style="color: #666; font-size: 13px;">等待刷卡...</div>
                  </div>
                </div>
              </el-col>

              <!-- 2. 中间：补充登记板块（淡灰色背景） -->
              <el-col :span="8">
                <div
                    style="height: 600px; border: 1px solid #ddd; border-radius: 12px; background-color: #f5f5f5; overflow: hidden;">
                  <!-- 标题栏 -->
                  <div
                      style="text-align: center; padding: 12px 0; font-size: 16px; font-weight: 500; color: #444; border-bottom: 1px solid #d9d9d9;">
                    补充登记信息
                  </div>

                  <!-- 内容区 -->
                  <div style="padding: 15px;">
                    <!-- 来访事由（必填） -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        来访事由<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </label>
                      <el-select
                          v-model="supplementInfo.reason"
                          placeholder="请选择事由"
                          style="width: 100%;"
                          :loading="reasonLoading"
                      >
                        <el-option
                            v-for="item in reasonList"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        ></el-option>
                      </el-select>
                    </div>

                    <!-- 车牌号码（非必填，动态列表） -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        车牌号码
                      </label>
                      <!-- 动态车牌号输入框列表 -->
                      <div v-for="(plate, index) in supplementInfo.licensePlate" :key="index" style="margin-bottom: 8px; display: flex; gap: 8px;">
                        <el-input
                            v-model="supplementInfo.licensePlate[index]"
                            placeholder="如：粤A12345（非必填）"
                            style="flex: 1;"
                        />
                        <el-button
                            type="danger"
                            icon="Delete"
                            size="small"
                            @click="removeLicensePlate(index)"
                            :disabled="supplementInfo.licensePlate.length <= 1"
                        ></el-button>
                      </div>
                      <!-- 添加按钮 -->
                      <el-button
                          type="primary"
                          icon="Plus"
                          size="small"
                          @click="addLicensePlate"
                          style="width: 100%;"
                      >
                        添加车牌号
                      </el-button>
                    </div>

                    <!-- 来访人数（必填） -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        来访人数<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </label>
                      <el-input 
                          v-model="supplementInfo.numVisitor" 
                          placeholder="请输入来访人数" 
                          type="number"
                          style="width: 100%;"/>
                    </div>

                    <!-- 登记备注（非必填） -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        登记备注
                      </label>
                      <el-input v-model="supplementInfo.remark" type="textarea" :rows="3"
                                placeholder="请输入备注信息（可选）" style="width: 100%;"/>
                    </div>
                  </div>
                </div>
              </el-col>

              <!-- 3. 右侧：拜访信息板块（淡灰色背景） -->
              <el-col :span="8">
                <div
                    style="height: 600px; border: 1px solid #ddd; border-radius: 12px; background-color: #f5f5f5; overflow: hidden;">
                  <!-- 标题栏 -->
                  <div
                      style="text-align: center; padding: 12px 0; font-size: 16px; font-weight: 500; color: #444; border-bottom: 1px solid #d9d9d9;">
                    拜访信息
                  </div>

                  <!-- 内容区 -->
                  <div style="padding: 15px;">
                    <!-- 被访人查询 - 改为下拉选择组件 -->
                    <div style="margin-bottom: 15px;">
                      <el-select
                          v-model="visitInfo.selectedIntervieweeId"
                          placeholder="请输入被访人姓名进行查询/选择"
                          filterable
                          remote
                          reserve-keyword
                          :remote-method="searchInterviewee"
                          :loading="intervieweeLoading"
                          style="width: 100%;"
                          @change="handleIntervieweeChange"
                      >
                        <el-option
                            v-for="item in intervieweeList"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        >
                        </el-option>
                      </el-select>
                    </div>

                    <!-- 被访人信息（移除手机号显示，必填） -->
                    <div
                        style="border: 1px solid #eee; border-radius: 6px; padding: 10px; margin-bottom: 15px; background-color: #fff; min-height: 80px; box-sizing: border-box;">
                      <el-row :gutter="10">
                        <el-col :span="12">
                          <p style="font-size: 12px; color: #666; margin: 0 0 3px 0;">被访人姓名<span style='color: #f56c6c; margin-left: 4px;'>*</span></p>
                          <p style="font-weight: 500; margin: 0 0 8px 0; min-height: 20px;">
                            {{ visitInfo.interviewee.name || '-' }}
                          </p>
                        </el-col>
                        <el-col :span="12">
                          <p style="font-size: 12px; color: #666; margin: 0 0 3px 0;">所属部门<span style='color: #f56c6c; margin-left: 4px;'>*</span></p>
                          <p style="margin: 0 0 8px 0; min-height: 20px;">
                            {{ visitInfo.interviewee.department || '-' }}
                          </p>
                        </el-col>
                      </el-row>
                    </div>

                    <!-- 拜访区域（必填）- 改为下拉选择框 -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        拜访区域<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </label>
                      <el-select
                          v-model="visitInfo.areaNames"
                          placeholder="请选择拜访区域"
                          style="width: 100%;"
                          @change="handleAreaChange"
                          multiple
                          collapse-tags
                      >
                        <el-option
                            v-for="area in areaList"
                            :key="area.id"
                            :label="area.name"
                            :value="area.id"
                        ></el-option>
                      </el-select>
                    </div>

                    <!-- 拜访时间（必填）- 改为时间选择器 -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        拜访时间<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </label>
                      <el-date-picker
                          v-model="visitInfo.planVisitTime"
                          type="datetime"
                          placeholder="选择开始时间"
                          style="width: 100%;"
                          format="YYYY-MM-DD HH:mm:ss"
                          value-format="YYYY-MM-DD HH:mm:ss"
                          placement="left"
                          editable="false"
                      ></el-date-picker>
                    </div>

                    <!-- 离开时间（必填）- 改为时间选择器 -->
                    <div style="margin-bottom: 15px;">
                      <label
                          style="display: block; font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 500;">
                        离开时间<span style='color: #f56c6c; margin-left: 4px;'>*</span>
                      </label>
                      <el-date-picker
                          v-model="visitInfo.planLeaveTime"
                          type="datetime"
                          placeholder="选择结束时间"
                          style="width: 100%;"
                          format="YYYY-MM-DD HH:mm:ss"
                          value-format="YYYY-MM-DD HH:mm:ss"
                          placement="left"
                          editable="false"
                      ></el-date-picker>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 操作按钮（右下角） -->
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <el-button size="large" type="default" @click="resetForm">
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
                <Loading/> <!-- 打印中显示加载图标 -->
              </template>
              <template v-else>
                <CircleCheck/> <!-- 打印完成显示对勾 -->
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
        const {ref, onMounted, onUnmounted, watch} = Vue;
        const {ElMessage, ElLoading} = ElementPlus;
        const {ipcRenderer} = require('electron');
        // 新增：存储读卡器数据
        const cardDataList = ref([]); // 历史数据列表
        const latestCardData = ref(null); // 最新数据

        onMounted(async () => {
            ipcRenderer.on('python-log', (event, data) => {
                // console.log('[主进程]', data);
            });
            // 启动读卡器进程
            ElementPlus.ElNotification({
                title: '提示',
                message: '读卡器已启动，等待刷卡...',
                type: 'info'
            });

            // 监听主进程发送的读卡器数据
            ipcRenderer.on('card-data', async (event, data) => {
                console.log('收到的数据:', data)
                if (data.type === 'success' && data.content) {
                    const cardInfo = data.content; // 提取身份证信息
                    console.log('解析后的身份证信息:', cardInfo);

                    // 1. 显示身份证数据
                    if (cardInfo) {
                        visitorInfo.value.idCard = cardInfo.idNumber;
                        visitorInfo.value.name = cardInfo.name;
                        if (cardInfo.photoBase64) {
                            visitorInfo.value.idCardPhoto = cardInfo.photoBase64; // 赋值到身份证照片区域
                        }
                    }
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
            // 加载基础数据：区域 + 事由
            await Promise.all([
                loadAreaList(),
                loadFormReason()
            ]);
        });

        onUnmounted(async () => {
            // 停止读卡器进程
            // await ipcRenderer.invoke('stop-reader');
            // 移除事件监听，避免内存泄漏
            ipcRenderer.removeAllListeners('card-data');
            // 移除摄像头监控
            closeCamera();
        });

        // 1. 访客个人信息
        const originalData = ref(null); // 接口读取访客申请原始数据
        const visitorInfo = ref({
            status: '未预约',
            name: '',
            idCard: '',
            phone: '',
            applicationNo: '',
            idCardPhoto: '',
            livePhoto: '',
            company: '' // 新增：访客单位（原来访单位）
        });

        // 2. 补充登记信息
        const supplementInfo = ref({
            reason: '',
            licensePlate: [], // 车牌号数组
            remark: '',
            numVisitor: '' // 新增：来访人数，默认值1
        });

        // 3. 拜访信息（卡号授权改为数字输入）
        const visitInfo = ref({
            searchKeyword: '',
            selectedIntervieweeId: '', // 新增：选中的被访人ID
            interviewee: {      // 拜访人信息
                name: '',
                department: ''
            },
            areaNames: [], // 拜访区域（存储选中的区域名称）
            planVisitTime: '', // 拜访时间（datetime格式）
            planLeaveTime: '' // 离开时间（datetime格式）
        });
        // 新增：被访人相关响应式数据
        const intervieweeList = ref([]); // 被访人列表
        const intervieweeLoading = ref(false); // 被访人查询加载状态

        // 新增：拜访区域相关响应式数据
        const areaList = ref([]); // 拜访区域列表
        const areaLoading = ref(false); // 区域加载状态
        const reasonList = ref([]); // 来访事由列表
        const reasonLoading = ref(false); // 事由加载状态
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
            // 保存原始快照（深拷贝，避免引用关联）
            originalData.value = JSON.parse(JSON.stringify(appData));

            // 填充表单（原有逻辑）
            visitorInfo.value.name = appData.visitor_name || '';
            visitorInfo.value.idCard = appData.visitor_idcard || '';
            visitorInfo.value.phone = appData.visitor_phone || '';
            visitorInfo.value.applicationNo = appData.application_no || '';
            visitorInfo.value.company = appData.visitor_company || '';
            supplementInfo.value.reason = appData.reason || '';
            supplementInfo.value.licensePlate = appData.vehicle_list || [];
            supplementInfo.value.remark = appData.remark || ''; // 接口若无remark则初始为空
            supplementInfo.value.numVisitor = appData.num_visitor || 1;
            visitorInfo.value.livePhoto = appData.picture || '';
            visitInfo.value.interviewee = {
                name: appData.interviewee || '',
                department: appData.host_department || ''
            };
            visitInfo.value.areaNames = appData.area_ids || [];
            visitInfo.value.planVisitTime = appData.plan_visit_time || '';
            visitInfo.value.planLeaveTime = appData.plan_leave_time || '';
        };
        const getChangedFields = () => {
            if (!originalData.value) return null; // 无原始数据则返回空

            const changes = {};
            const original = originalData.value;
            const current = {
                // 访客基础信息
                visitor_name: visitorInfo.value.name,
                visitor_idcard: visitorInfo.value.idCard,
                visitor_phone: visitorInfo.value.phone,
                visitor_company: visitorInfo.value.company,
                picture: visitorInfo.value.livePhoto, // 照片
                // 补充信息
                reason: supplementInfo.value.reason,
                vehicle_list: supplementInfo.value.licensePlate, // 车牌号
                remark: supplementInfo.value.remark, // 备注
                num_visitor: supplementInfo.value.numVisitor,
                // 拜访信息（如需检测可加，按需求）
                interviewee: visitInfo.value.interviewee.name,
                host_department: visitInfo.value.interviewee.department,
                area_names: visitInfo.value.areaNames,
                plan_visit_time: visitInfo.value.planVisitTime,
                plan_leave_time: visitInfo.value.planLeaveTime
            };

            // 遍历对比，仅收集变更字段
            Object.keys(current).forEach(key => {
                const originalVal = original[key];
                const currentVal = current[key];

                // 特殊处理数组（车牌号）
                if (Array.isArray(originalVal) && Array.isArray(currentVal)) {
                    if (JSON.stringify(originalVal) !== JSON.stringify(currentVal)) {
                        changes[key] = currentVal;
                    }
                }
                // 普通字段对比（空值兼容）
                else if (String(originalVal || '') !== String(currentVal || '')) {
                    changes[key] = currentVal;
                }
            });

            return changes;
        };
        const updateVisitorInfo = async (submitData) => {
            try {
                const data = await visitorAPI.update(submitData); // 替换为实际更新接口
                if (data) {
                    return { success: true };
                } else {
                    ElMessage.error('信息更新失败：' + (data?.result?.msg || '未知错误'));
                    return { success: false };
                }
            } catch (error) {
                console.error('更新访客信息失败:', error);
                ElMessage.error('更新接口异常，请重试');
                return { success: false };
            }
        };
        const addLicensePlate = () => {
            supplementInfo.value.licensePlate.push('');
        };
        const removeLicensePlate = (index) => {
            supplementInfo.value.licensePlate.splice(index, 1);
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
                    video: {facingMode: 'user'} // 切换为 'environment' 可使用后置摄像头
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
            const {videoWidth, videoHeight} = videoElement.value;
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

        // 6. 拜访信息区域功能
        // 新增：加载拜访区域列表（接口获取）
        const loadAreaList = async () => {
            try {
                areaLoading.value = true;
                const res = await visitorAPI.getAreaList('');
                console.log(res);
                if (res) {
                    areaList.value = res.map(item => ({
                        id: item.id,
                        name: item.name
                    })) || [];
                }
            } catch (error) {
                console.error('加载拜访区域失败:', error);
                ElMessage.error('加载拜访区域失败，请重试');
            } finally {
                areaLoading.value = false;
            }
        };
        // 加载拜访事由（适配getFormReason接口）
        const loadFormReason = async () => {
            try {
                const res = await visitorAPI.getFormReason();
                if (res) {
                    // 将接口返回的事由列表赋值给reasonList（需要先定义）
                    reasonList.value = res.map(item => ({
                        id: item.id,
                        name: item.name
                    })) || [];
                }
            } catch (error) {
                console.error('加载来访事由失败:', error);
                ElMessage.error('加载来访事由失败，使用默认选项');
            }
        };
        // 改造：被访人远程搜索方法
        const searchInterviewee = async (keyword) => {
            if (!keyword) {
                intervieweeList.value = [];
                return;
            }

            try {
                intervieweeLoading.value = true;
                // 调用被访人查询接口，替换为实际接口地址
                const res = await visitorAPI.searchInterviewee(keyword);
                if (res) {
                    intervieweeList.value = res.map(item => ({
                        id: item.id,
                        name: item.name + '  ———  ' + item.department,
                        department: item.department
                    })) || [];
                }
            } catch (error) {
                console.error('查询被访人失败:', error);
                ElMessage.error('查询被访人失败，请重试');
                intervieweeList.value = [];
            } finally {
                intervieweeLoading.value = false;
            }
        };

        // 新增：监听被访人选择变化
        const handleIntervieweeChange = (val) => {
            // 1. 增强调试日志：打印所有关键数据
            console.log('===== 被访人选择变更 =====');
            console.log('选中的val值:', val, '类型:', typeof val);
            console.log('visitInfo.selectedIntervieweeId:', visitInfo.value?.selectedIntervieweeId); // 兼容ref/非ref
            console.log('当前intervieweeList:', intervieweeList.value);
            console.log('当前interviewee原值:', visitInfo.value?.interviewee);

            // 2. 空值处理：直接清空
            if (!val || val === '') {
                console.log('清空被访人信息');
                // 确保是响应式更新（兼容ref对象）
                if (visitInfo.value) { // 如果visitInfo是ref对象
                    visitInfo.value.interviewee = { name: '', department: '' };
                } else { // 如果visitInfo是普通对象
                    visitInfo.interviewee = { name: '', department: '' };
                }
                return;
            }

            try {
                // 3. 统一ID类型：解决数字/字符串不匹配问题（核心！）
                const targetId = typeof val === 'string' ? val : Number(val);
                console.log('统一类型后的目标ID:', targetId, '类型:', typeof targetId);

                // 4. 查找匹配项：兼容ID的数字/字符串类型
                const selectedItem = intervieweeList.value.find(item => {
                    // 把item.id也转为和targetId相同的类型再对比
                    const itemId = typeof targetId === 'string' ? String(item.id) : Number(item.id);
                    return itemId === targetId;
                });

                console.log('找到的匹配项:', selectedItem);

                // 5. 更新被访人信息（确保响应式）
                if (selectedItem) {
                    const newInterviewee = {
                        name: selectedItem.name || '未知姓名',
                        department: selectedItem.department || '无部门'
                    };
                    console.log('要更新的interviewee:', newInterviewee);

                    // 响应式更新（关键：区分ref/普通对象）
                    if (visitInfo.value) {
                        visitInfo.value.interviewee = newInterviewee;
                    } else {
                        visitInfo.interviewee = newInterviewee;
                    }
                } else {
                    // 未找到匹配项时清空
                    console.warn('未找到ID为', targetId, '的被访人');
                    if (visitInfo.value) {
                        visitInfo.value.interviewee = { name: '', department: '' };
                    } else {
                        visitInfo.interviewee = { name: '', department: '' };
                    }
                }

                // 6. 验证更新结果
                console.log('更新后的interviewee:', visitInfo.value?.interviewee || visitInfo.interviewee);
            } catch (error) {
                console.error('更新被访人信息失败:', error);
                // 异常时清空
                if (visitInfo.value) {
                    visitInfo.value.interviewee = { name: '', department: '' };
                } else {
                    visitInfo.interviewee = { name: '', department: '' };
                }
            }
        };

        // 新增：拜访区域变更处理
        const handleAreaChange = (val) => {
            // 可添加区域变更后的额外逻辑
            console.log('选中的拜访区域:', val);
            console.log(visitInfo.value.areaNames)
        };

        // 7. 清空表单
        const resetForm = () => {
            visitorInfo.value = {
                status: '已预约',
                name: '',
                idCard: '',
                phone: '',
                applicationNo: '',
                idCardPhoto: '',
                livePhoto: '',
                company: '',
            };
            supplementInfo.value = {
                reason: '',
                licensePlate: [], // 重置为数组
                remark: '',
                numVisitor: ''
            };
            visitInfo.value = {
                searchKeyword: '',
                interviewee: { name: '', department: '' },
                areaNames: [],
                planVisitTime: '',
                planLeaveTime: ''
            };
        };


        // 8. 确认登记
        const printing = ref(false); // 控制打印状态
        const printError = ref(''); // 存储打印错误信息
        const generateVisitorCode = () => {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            return `VIS-${timestamp}-${random}`;
        };
        const formatDateTime = (datetimeStr) => {
            console.log(datetimeStr);
            if (!datetimeStr) return '';
            return datetimeStr.replace(' ', 'T').split(':').slice(0, 2).join(':');
        };
        const handleRegister = async () => {
            // 1. 表单校验（更新必填项校验逻辑）
            const requiredFields = [
                { name: '访客姓名', value: visitorInfo.value.name },
                { name: '手机号码', value: visitorInfo.value.phone },
                { name: '访客单位', value: visitorInfo.value.company },
                { name: '来访事由', value: supplementInfo.value.reason },
                { name: '来访人数', value: supplementInfo.value.numVisitor },
                { name: '被访人姓名', value: visitInfo.value.interviewee.name },
                { name: '所属部门', value: visitInfo.value.interviewee.department },
                { name: '拜访区域', value: visitInfo.value.areaNames },
                { name: '拜访时间', value: visitInfo.value.planVisitTime },
                { name: '离开时间', value: visitInfo.value.planLeaveTime }
            ];

            // 检查所有必填项
            const emptyField = requiredFields.find(item => !item.value);
            if (emptyField) {
                ElMessage.warning(`请完善${emptyField.name}信息`);
                return;
            }

            // 2. 区分有预约/无预约流程
            let updateSuccess = true;
            let createResult = null; // 存储创建接口返回结果
            const hasAppointment = !!visitorInfo.value.applicationNo;

            // ===== 分支1：有预约（原有更新逻辑）=====
            if (hasAppointment) {
                // 变更检测 + 提交更新
                const changedFields = getChangedFields();
                if (changedFields && Object.keys(changedFields).length > 0) {
                    const submitData = {
                        id: originalData.value?.application_id, // 从原始快照取主键
                        ...changedFields
                    };
                    console.log('更新预约数据:', submitData);

                    const updateResult = await updateVisitorInfo(submitData);
                    if (!updateResult.success) {
                        updateSuccess = false;
                        ElMessage.error('信息更新失败，登记终止');
                        return;
                    } else {
                        ElMessage.success('信息更新成功，继续完成登记');
                        originalData.value = { ...originalData.value, ...changedFields };
                    }
                }
            }
            // ===== 分支2：无预约（新增创建逻辑）=====
            else {
                try {
                    // 构造创建表单数据（完全匹配接口要求的字段名和格式）
                    const createData = {
                        visitorName: visitorInfo.value.name,         // 访客姓名
                        phone: visitorInfo.value.phone,               // 手机号码
                        idCard: visitorInfo.value.idCard || '',       // 证件号码（非必填）
                        visitorUnit: visitorInfo.value.company,       // 访客单位
                        visitAreas: visitInfo.value.areaNames,                       // 核心修改：提取ID数组
                        // 时间格式转换：适配接口的 "2025-12-09T18:40" 格式
                        arriveTime: formatDateTime(visitInfo.value.planVisitTime),  // 拜访时间
                        leaveTime: formatDateTime(visitInfo.value.planLeaveTime),   // 离开时间
                        visitorCount: Number(supplementInfo.value.numVisitor), // 来访人数（转数字）
                        visitReason: Number(supplementInfo.value.reason),       // 来访事由（转数字）
                        plateNumbers: supplementInfo.value.licensePlate.filter(item => item), // 车牌号数组（过滤空值）
                        remark: supplementInfo.value.remark || '',    // 备注（非必填）
                        visitor: visitInfo.value.selectedIntervieweeId ? Number(visitInfo.value.selectedIntervieweeId) : 0,
                        photo: visitorInfo.value.livePhoto || '',     // 现场照片base64
                        source: 'VM'    // 来源：现场访客机登记
                    };
                    console.log('创建新预约数据（匹配接口）:', createData);

                    // 调用创建接口
                    createResult = await visitorAPI.create(createData);
                    if (!createResult) {
                        updateSuccess = false;
                        ElMessage.error('创建访客记录失败，登记终止');
                        return;
                    } else {
                        ElMessage.success('创建访客记录成功，继续完成登记');
                        // 同步创建后的编号到表单（用于后续打印/记录）
                        visitorInfo.value.applicationNo = createResult.application_no;
                    }
                } catch (error) {
                    updateSuccess = false;
                    ElMessage.error(`创建失败：${error.message || '网络异常'}`);
                    return;
                }
            }

            // 3. 更新/创建成功后，执行统一的登记逻辑
            if (updateSuccess) {
                showSuccessDialog.value = true;
                printing.value = true;
                printError.value = '';

                try {
                    // 记录进入状态（使用最新的applicationNo）
                    const recordResult = await recordVisitorEntry(
                        visitorInfo.value.applicationNo,
                        'enter',
                        hasAppointment ? '前台登记进入' : '无预约前台创建并登记'
                    );
                    if (recordResult.success) {
                        ElMessage.success('登记成功并记录进入状态');
                    }

                    // 打印访客凭证
                    await ipcRenderer.invoke('print-visitor-code', visitorInfo.value.applicationNo);
                    printing.value = false;
                } catch (error) {
                    printing.value = false;
                    printError.value = `操作失败：${error.message || '请重试'}`;
                }
            }
        };

        // 查询访客申请接口
        const queryVisitorApplication = async (idcard, phone) => {
            if (!idcard && !phone) {
                ElMessage.warning('请提供身份证号或手机号');
                return {success: false};
            }
            try {
                const requestData = {};
                if (idcard) requestData.idcard = idcard;
                if (phone) requestData.phone = phone;
                const data = await visitorAPI.query(requestData);
                if (data) {
                    return {success: true, data: data};
                } else {
                    // ElMessage.warning('未查询到访客申请');
                    return {success: false};
                }
            } catch (error) {
                console.error('查询访客申请失败:', error);
                ElMessage.error('查询接口异常，请重试');
                return {success: false};
            }
        };

        // 记录进出记录接口
        const recordVisitorEntry = async (applicationNo, type, remark) => {
            try {
                const data = await visitorAPI.record(
                    {application_no: applicationNo, type, remark}
                );
                if (data) {
                    return {success: true};
                } else {
                    return {success: false};
                }
            } catch (error) {
                console.error('记录进出状态失败:', error);
                ElMessage.error('记录接口异常，请重试');
                return {success: false};
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
            handleIntervieweeChange,
            intervieweeList,
            intervieweeLoading,
            reasonLoading,
            reasonList,
            areaList,
            areaLoading,
            handleAreaChange,
            resetForm,
            handleRegister,
            updateVisitorInfo,
            getChangedFields,
            cardDataList,
            latestCardData,
            videoElement,
            canvasElement,
            printing,
            printError,
            handleDialogClose,
            retryPrint,
            handlePhoneQuery,
            fillVisitorForm,
            addLicensePlate,
            removeLicensePlate
        };
    }
};