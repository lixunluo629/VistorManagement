import { HeaderBar } from '../components/HeaderBar.js';

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
                        <div style="border: 1px dashed #91c6f2; border-radius: 6px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;" @click="uploadIdCard">
                          <el-icon :size="24" style="color: #1890ff; margin-bottom: 5px;">
                            <UserFilled />
                          </el-icon>
                          <p style="font-size: 12px; color: #1890ff;">
                            {{ idCardPhoto ? '身份证照片' : '身份证照' }}
                          </p>
                          <img v-if="idCardPhoto" :src="idCardPhoto" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" />
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div style="border: 1px dashed #91c6f2; border-radius: 6px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;" @click="showCameraDialog = true">
                          <el-icon :size="24" style="color: #1890ff; margin-bottom: 5px;">
                            <Camera />
                          </el-icon>
                          <p style="font-size: 12px; color: #1890ff;">
                            {{ livePhoto ? '现场照片' : '开启摄像头拍摄' }}
                          </p>
                          <img v-if="livePhoto" :src="livePhoto" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" />
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
                      <el-input v-model="visitorInfo.phone" placeholder="请输入手机号" />
                    </el-form-item>

                    <!-- 访客编号 -->
                    <el-form-item label="访客编号" label-width="80px" style="margin-bottom: 12px;">
                      <el-input v-model="visitorInfo.qrCode" readonly style="background-color: #f0f7ff;" />
                      <div slot="help" style="font-size: 12px; color: #666;">
                        {{ visitorInfo.qrCode ? '已获取预约编号' : '无预约将自动生成' }}
                      </div>
                    </el-form-item>
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
                      <el-input v-model="supplementInfo.remark" type="textarea" rows="3" placeholder="请输入备注信息（可选）" style="width: 100%;" />
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
                          @keyup.enter="searchInterviewee"
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
              <el-button size="large" type="primary" @click="confirmRegister">
                确认登记
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 摄像头拍摄弹窗 -->
        <el-dialog
            v-model="showCameraDialog"
            title="现场拍摄"
            width="600px"
            :close-on-click-modal="false"
            :show-close="false"
        >
          <div style="text-align: center; padding: 20px 0;">
            <!-- 模拟摄像头画面 -->
            <div style="width: 100%; height: 360px; background-color: #000; margin-bottom: 20px; position: relative; overflow: hidden;">
              <img src="https://picsum.photos/600/360?random=2" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 240px; height: 320px; border: 2px solid #fff; border-radius: 10px;"></div>
              <div style="color: #fff; position: absolute; bottom: 10px; left: 10px; font-size: 12px;">
                请将人脸对准框内
              </div>
            </div>

            <el-row :gutter="20" style="justify-content: center;">
              <el-col :span="4">
                <el-button type="default" @click="showCameraDialog = false">
                  取消
                </el-button>
              </el-col>
              <el-col :span="4">
                <el-button type="primary" @click="capturePhoto">
                  拍摄
                </el-button>
              </el-col>
            </el-row>
          </div>
        </el-dialog>

        <!-- 登记成功弹窗 -->
        <el-dialog
            v-model="showSuccessDialog"
            title="登记成功"
            width="300px"
            :close-on-click-modal="false"
        >
          <div style="text-align: center; padding: 20px 0;">
            <el-icon :size="60" style="color: #52c41a; margin-bottom: 15px;">
              <CheckCircle />
            </el-icon>
            <p>访客 {{ visitorInfo.name }} 登记成功！</p>
            <p style="color: #666; margin-top: 10px;">访客编号：{{ visitorInfo.qrCode }}</p>
          </div>
          <template #footer>
            <el-button type="primary" @click="showSuccessDialog = false">确认</el-button>
          </template>
        </el-dialog>
      </div>
    `,
    setup() {
        const { ref } = Vue;

        // 1. 访客个人信息
        const visitorInfo = ref({
            status: '已预约',
            name: '',
            idCard: '',
            phone: '',
            qrCode: '',
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

        // 5. 照片上传/拍摄
        const uploadIdCard = () => {
            visitorInfo.value.idCardPhoto = 'https://picsum.photos/300/200';
        };
        const capturePhoto = () => {
            visitorInfo.value.livePhoto = 'https://picsum.photos/300/200?random=1';
            showCameraDialog.value = false;
        };

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
            visitorInfo.value = { status: '已预约', name: '', idCard: '', phone: '', qrCode: '', idCardPhoto: '', livePhoto: '' };
            supplementInfo.value = { reason: '', licensePlate: '', company: '', type: '', remark: '' };
            visitInfo.value = { searchKeyword: '', interviewee: { name: '', department: '', phone: '' }, items: '', validTime: new Date(new Date().getTime() + 3600000 * 2).toISOString(), cardAuth: '' };
        };

        // 8. 确认登记
        const confirmRegister = () => {
            if (!visitorInfo.value.name || !visitorInfo.value.idCard || !visitorInfo.value.phone) {
                ElementPlus.ElNotification({ title: '错误', message: '请完善访客基本信息', type: 'error' });
                return;
            }
            if (!visitInfo.value.interviewee.name) {
                ElementPlus.ElNotification({ title: '错误', message: '请查询并选择被访人', type: 'error' });
                return;
            }
            if (!visitorInfo.value.qrCode) {
                visitorInfo.value.qrCode = 'VISIT-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            }
            showSuccessDialog.value = true;
        };

        return {
            visitorInfo,
            supplementInfo,
            visitInfo,
            showCameraDialog,
            showSuccessDialog,
            uploadIdCard,
            capturePhoto,
            searchInterviewee,
            resetForm,
            confirmRegister
        };
    }
};