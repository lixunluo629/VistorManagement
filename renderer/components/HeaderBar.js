export const HeaderBar = {
    props: {
        // 是否为主界面（控制显示关闭/返回按钮）
        isMainPage: {
            type: Boolean,
            default: false
        }
    },
    template: `
    <el-header class="header-bar">
      <!-- 中间：系统名称 -->
      <div style="font-size: 32px; font-weight: bold;">
        访客准入系统
      </div>
      
      <!-- 主界面显示关闭按钮，其他界面隐藏 -->
      <div class="header-btn">
        <el-button 
          v-if="isMainPage"
          type="text" 
          style="color: white;font-size: 16px;"
          @click="handleClose"
        ><el-icon :size="21"><SwitchButton /></el-icon>&nbsp;关闭</el-button>
      </div>
      <!-- 仅非主界面显示返回按钮 -->
      <div class="header-btn">
        <el-button
            v-if="!isMainPage"
            type="text"
            style="color: white;font-size: 16px;"
            @click="$router.push('/main')"
        ><el-icon :size="21"><House /></el-icon>&nbsp;主界面</el-button>
      </div>
    </el-header>
  `,
    setup() {
        const { ipcRenderer } = require('electron');

        // 关闭应用（仅主界面可用）
        const handleClose = () => {
            ipcRenderer.send('close-app');
        };

        return { handleClose };
    }
};