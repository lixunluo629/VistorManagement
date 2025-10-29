import { HeaderBar } from '../components/HeaderBar.js';

export const DataCenterPage = {
    components: { HeaderBar },
    template: `
      <div style="height: 100vh; overflow: hidden; margin: 0; padding: 0; display: flex; flex-direction: column;">
        <!-- 顶部Header -->
        <HeaderBar :isMainPage="false" />

        <!-- 主体内容区 -->
        <div style="flex: 1; overflow: auto; padding: 20px; background-color: #fff; box-sizing: border-box; overflow: hidden;">
          <!-- 1. 统计卡片（今日累计到访/拜访中/已离开/未到访） -->
          <el-card style="border: none; box-shadow: none;">
            <el-row :gutter="20" style="padding: 15px 0px;">
              <!-- 今日累计到访 -->
              <el-col :span="6">
                <el-card style="background-color: #e6f7ff; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="font-size: 18px; color: #666;">今日累计到访</p>
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">28</p>
                    </div>
                    <el-icon :size="36" style="color: #1890ff;">
                      <UserFilled />
                    </el-icon>
                  </div>
                </el-card>
              </el-col>

              <!-- 拜访中 -->
              <el-col :span="6">
                <el-card style="background-color: #fff7e6; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="font-size: 18px; color: #666;">拜访中</p>
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">13</p>
                    </div>
                    <el-icon :size="36" style="color: #faad14;">
                      <Clock />
                    </el-icon>
                  </div>
                </el-card>
              </el-col>

              <!-- 已离开 -->
              <el-col :span="6">
                <el-card style="background-color: #f6ffed; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="font-size: 18px; color: #666;">已离开</p>
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">15</p>
                    </div>
                    <el-icon :size="36" style="color: #52c41a;">
                      <CircleCheck />
                    </el-icon>
                  </div>
                </el-card>
              </el-col>

              <!-- 未到访 -->
              <el-col :span="6">
                <el-card style="background-color: #f5f5f5; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="font-size: 18px; color: #666;">未到访</p>
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">7</p>
                    </div>
                    <el-icon :size="36" style="color: #666;">
                      <CircleClose />
                    </el-icon>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-card>

          <!-- 2. 带筛选带分页的列表（适配筛选类型） -->
          <div style="height: calc(100% - 340px); min-height: 550px; overflow: hidden; position: relative;">
            <el-card style="border-radius: 12px; height: 100%; width: 100%; overflow: hidden; display: flex; flex-direction: column; margin: 0; padding: 0;">
              <el-row :gutter="20" style="padding: 15px;">
                <!-- 左侧筛选区域（保持不变） -->
                <el-col :span="16">
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <el-select v-model="filterType" placeholder="筛选类型">
                        <el-option label="全部记录" value="all"></el-option>
                        <el-option label="已离开" value="left"></el-option>
                        <el-option label="拜访中" value="active"></el-option>
                        <el-option label="未到访" value="noShow"></el-option>
                      </el-select>
                    </el-col>
                    <el-col :span="8">
                      <el-date-picker
                          v-model="dateRange"
                          type="daterange"
                          range-separator="至"
                          start-placeholder="开始日期"
                          end-placeholder="结束日期"
                          format="YYYY-MM-DD"
                      ></el-date-picker>
                    </el-col>
                    <el-col :span="6">
                      <el-input v-model="keyword" placeholder="搜索姓名/受访人"></el-input>
                    </el-col>
                    <el-col :span="2">
                      <el-button type="primary" @click="handleSearch">查询</el-button>
                    </el-col>
                    <el-col :span="2">
                      <el-button @click="resetFilter">重置</el-button>
                    </el-col>
                  </el-row>
                </el-col>

                <!-- 右侧新增按钮区域 -->
                <el-col :span="8" style="display: flex; justify-content: flex-end; gap: 10px;">
                  <el-button
                      type="success"
                      @click="exportToExcel"
                      icon="Download"
                  >
                    导出Excel
                  </el-button>
                  <el-button
                      type="danger"
                      @click="handleBatchDelete"
                      icon="Delete"
                      :disabled="selectedIds.length === 0"
                  >
                    批量删除
                  </el-button>
                </el-col>
              </el-row>
              <el-table
                  :data="filteredData"
                  border
                  style="width: 100%; flex: 1;"
                  height="400"
                  size="small"
                  @selection-change="handleSelectionChange"
                  :header-cell-style="{fontSize: '16px', fontWeight: '500'}"
                  :cell-style="{fontSize: '15px'}"
              >
              <el-table-column
                  type="selection"
                  width="55"
                  align="center"
              ></el-table-column>
              <el-table-column prop="id" label="序号" width="80"></el-table-column>
              <el-table-column prop="name" label="姓名" min-width="100" show-overflow-tooltip></el-table-column>
              <el-table-column prop="visitTime" label="预约到访时间" min-width="180"></el-table-column>
              <el-table-column prop="actualVisitTime" label="实际到访时间" min-width="180" show-overflow-tooltip>
                <template #default="scope">
                  <span v-if="scope.row.actualVisitTime">{{ scope.row.actualVisitTime }}</span>
                  <span v-else style="color: #ff4d4f;">未到访</span>
                </template>
              </el-table-column>
              <el-table-column prop="leaveTime" label="离开时间" min-width="180" show-overflow-tooltip>
                <template #default="scope">
                  <span v-if="scope.row.leaveTime">{{ scope.row.leaveTime }}</span>
                  <span v-else-if="scope.row.actualVisitTime" style="color: #faad14;">拜访中</span>
                  <span v-else style="color: #666;">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="interviewee" label="受访人" min-width="120" show-overflow-tooltip></el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag
                      :type="scope.row.status === 'active' ? 'warning' : 
                         scope.row.status === 'left' ? 'success' : 
                         scope.row.status === 'noShow' ? 'info' : 'danger'"
                  >
                    {{ scope.row.status === 'active' ? '拜访中' :
                      scope.row.status === 'left' ? '已离开' :
                          scope.row.status === 'noShow' ? '未到访' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>

              <!-- 分页控件（保持不变） -->
              <div style="margin-top: 15px; display: flex; justify-content: flex-end; align-items: center;">
                  <el-pagination
                      @size-change="handleSizeChange"
                      @current-change="handleCurrentChange"
                      :current-page="currentPage"
                      :page-sizes="[10, 20, 50, 100]"
                      :page-size="pageSize"
                      layout="total, sizes, prev, pager, next, jumper"
                      :total="totalCount"
                  ></el-pagination>
                </div>
            </el-card>
          </div>
        </div>
        
        <!-- 删除确认弹窗 -->
        <el-dialog
            v-model="showDeleteDialog"
            title="确认删除"
            width="300px"
            :close-on-click-modal="false"
        >
          <p>确定要删除选中的 {{ deleteCount }} 条记录吗？</p>
          <p style="color: #ff4d4f; font-size: 12px;">提示：删除后数据将无法恢复，请谨慎操作</p>
          <template #footer>
            <el-button @click="showDeleteDialog = false">取消</el-button>
            <el-button type="danger" @click="confirmDelete">确认删除</el-button>
          </template>
        </el-dialog>
     
      </div>
    `,
    setup() {
        const { ref, computed, nextTick, onMounted } = Vue;

        // 1. 筛选条件（适配新状态：拜访中/已离开/未到访）
        const filterType = ref('all');
        const dateRange = ref([]);
        const keyword = ref('');

        // 2. 分页参数（保持不变）
        const currentPage = ref(1);
        const pageSize = ref(10);
        const totalCount = ref(0);

        // 3. 选中的记录ID（用于批量删除）
        const selectedIds = ref([]);
        // 删除相关弹窗控制
        const showDeleteDialog = ref(false);
        const deleteCount = ref(0);
        const deleteIds = ref([]); // 待删除的ID集合

        // 4. 导出成功提示
        const showExportSuccess = ref(false);

        // 5. 原始数据（新增「实际到访时间」和「未到访」状态，匹配统计卡片）
        const allData = ref([]);
        for (let i = 1; i <= 138; i++) {
            // 状态分配：30%拜访中，40%已离开，25%未到访，5%异常
            let status, actualVisitTime, leaveTime;
            if (i % 20 === 0) {
                status = 'abnormal';
                actualVisitTime = `2023-10-${i % 30 + 1} ${i % 24}:${i % 60 < 10 ? '0' + i % 60 : i % 60}`;
                leaveTime = '';
            } else if (i % 4 === 0) {
                status = 'noShow'; // 未到访
                actualVisitTime = '';
                leaveTime = '';
            } else if (i % 3 === 0) {
                status = 'left'; // 已离开
                actualVisitTime = `2023-10-${i % 30 + 1} ${i % 24}:${i % 60 < 10 ? '0' + i % 60 : i % 60}`;
                leaveTime = `2023-10-${i % 30 + 1} ${(i % 24) + 1}:${i % 60 < 10 ? '0' + i % 60 : i % 60}`;
            } else {
                status = 'active'; // 拜访中
                actualVisitTime = `2023-10-${i % 30 + 1} ${i % 24}:${i % 60 < 10 ? '0' + i % 60 : i % 60}`;
                leaveTime = '';
            }

            allData.value.push({
                id: i,
                name: `访客${i}`,
                visitTime: `2023-10-${i % 30 + 1} ${i % 24}:${i % 60 < 10 ? '0' + i % 60 : i % 60}`, // 预约时间
                actualVisitTime: actualVisitTime, // 实际到访时间
                leaveTime: leaveTime, // 离开时间
                interviewee: `受访人${i % 10 + 1}`,
                reason: i % 4 === 0 ? '业务洽谈' : i % 4 === 1 ? '技术支持' : i % 4 === 2 ? '面试' : '参观考察',
                status: status
            });
        }
        totalCount.value = allData.value.length;

        // 6. 筛选逻辑（适配新状态）
        const filteredData = computed(() => {
            let result = allData.value.filter(item => {
                // 状态筛选（匹配统计卡片的「拜访中/已离开/未到访」）
                if (filterType.value !== 'all') {
                    if (filterType.value === 'active' && item.status !== 'active') return false;
                    if (filterType.value === 'left' && item.status !== 'left') return false;
                    if (filterType.value === 'noShow' && item.status !== 'noShow') return false;
                }
                // 日期筛选（按预约时间筛选）
                if (dateRange.value.length) {
                    const visitDate = new Date(item.visitTime).toDateString();
                    const startDate = new Date(dateRange.value[0]).toDateString();
                    const endDate = new Date(dateRange.value[1]).toDateString();
                    if (new Date(visitDate) < new Date(startDate) || new Date(visitDate) > new Date(endDate)) return false;
                }
                // 关键词筛选（姓名/受访人）
                if (keyword.value && !item.name.includes(keyword.value) && !item.interviewee.includes(keyword.value)) return false;
                return true;
            });

            // 分页处理
            totalCount.value = result.length;
            const startIndex = (currentPage.value - 1) * pageSize.value;
            return result.slice(startIndex, startIndex + pageSize.value);
        });

        // 7. 复选框选择事件
        const handleSelectionChange = (selection) => {
            selectedIds.value = selection.map(item => item.id);
        };

        // 8. 批量删除操作
        const handleBatchDelete = () => {
            deleteIds.value = [...selectedIds.value];
            deleteCount.value = selectedIds.value.length;
            showDeleteDialog.value = true;
        };

        // 9. 确认删除
        const confirmDelete = () => {
            // 过滤掉要删除的记录
            allData.value = allData.value.filter(item => !deleteIds.value.includes(item.id));
            // 重置选择状态
            selectedIds.value = [];
            // 关闭弹窗
            showDeleteDialog.value = false;
            // 刷新列表
            handleSearch();
        };

        // 10. 导出Excel
        const exportToExcel = () => {
            // 实际项目中需调用后端接口或使用xlsx库前端生成
            // 这里仅做模拟
            console.log('导出数据：', filteredData.value);
            // 显示成功提示
            ElementPlus.ElNotification({
                title: '导出成功',
                message: '数据已成功导出为Excel文件',
                type: 'success',
                duration: 3000
            });
        };

        // 11. 筛选和分页方法（保持不变）
        const handleSearch = () => {
            currentPage.value = 1; // 重置页码
        };
        const resetFilter = () => {
            filterType.value = 'all';
            dateRange.value = [];
            keyword.value = '';
            currentPage.value = 1;
        };
        const handleSizeChange = (val) => {
            pageSize.value = val;
            currentPage.value = 1;
        };
        const handleCurrentChange = (val) => {
            currentPage.value = val;
        };

        // 核心：精确计算表格高度

        // 初始化计算 + 监听窗口变化
        onMounted(() => {
        });

        return {
            filterType,
            dateRange,
            keyword,
            currentPage,
            pageSize,
            totalCount,
            filteredData,
            handleSearch,
            resetFilter,
            handleSizeChange,
            handleCurrentChange,
            selectedIds,
            showDeleteDialog,
            deleteCount,
            showExportSuccess,
            handleSelectionChange,
            handleBatchDelete,
            confirmDelete,
            exportToExcel
        };
    }
};