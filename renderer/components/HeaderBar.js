export const HeaderBar = {
    props: {
        // 是否为主界面（控制显示关闭/返回按钮）
        isMainPage: {
            type: Boolean,
            default: false
        }
    },
    template: `
    <el-header style="height: 80px; background-color: #1890ff; color: white; display: flex; align-items: center; justify-content: center; padding: 0 20px;">
      <!-- 中间：系统名称 -->
      <div style="font-size: 32px; font-weight: bold;">
        访客管理系统
      </div>
      
      <!-- 右侧：主界面显示关闭按钮，其他界面隐藏 -->
      <div style="position: absolute; right: 20px;">
        <el-button 
          v-if="isMainPage"
          type="text" 
          style="color: white;font-size: 16px;"
          @click="handleClose"
        ><el-icon :size="21"><SwitchButton /></el-icon>&nbsp;关闭</el-button>
      </div>
      <!-- 左侧：仅非主界面显示返回按钮 -->
      <div style="position: absolute; right: 20px;">
        <el-button
            v-if="!isMainPage"
            type="text"
            style="color: white;font-size: 16px;"
            @click="$router.push('/')"
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