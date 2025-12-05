import { HeaderBar } from '../components/HeaderBar.js';
import { visitorAPI } from '../utils/api.js';
export const DataCenterPage = {
    components: { HeaderBar },
    template: `
      <div style="height: 100vh; overflow: hidden; margin: 0; padding: 0; display: flex; flex-direction: column;">
        <!-- 顶部Header -->
        <HeaderBar :isMainPage="false" />

        <!-- 主体内容区 -->
        <div style="flex: 1; overflow: auto; padding: 20px; background-color: #fff; box-sizing: border-box; overflow: hidden;">
          <!-- 1. 统计卡片 -->
          <!-- 统计卡片 -->
          <el-card style="border: none; box-shadow: none;">
            <el-row :gutter="20" style="padding: 15px 0px;">
              <!-- 今日累计到访 -->
              <el-col :span="6">
                <el-card style="background-color: #e6f7ff; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="font-size: 18px; color: #666;">今日累计到访</p>
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">{{ statistic.totalVisit }}</p>
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
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">{{ statistic.visiting }}</p>
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
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">{{ statistic.left }}</p>
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
                      <p style="font-size: 24px; margin-top: 5px; font-weight: bold;">{{ statistic.noVisit }}</p>
                    </div>
                    <el-icon :size="36" style="color: #666;">
                      <CircleClose />
                    </el-icon>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-card>

          <!-- 2. 带筛选带分页的列表 -->
          <div style="height: calc(100% - 340px); min-height: 550px; overflow: hidden; position: relative;">
            <el-card style="border-radius: 12px; height: 100%; width: 100%; overflow: hidden; display: flex; flex-direction: column; margin: 0; padding: 0;">
              <el-row :gutter="20" style="padding: 15px;">
                <!-- 左侧筛选区域 -->
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

                <!-- 右侧操作按钮 -->
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

              <!-- 表格内容 -->
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
                <el-table-column label="序号" width="80" align="center">
                  <template #default="scope">
                    <!-- 计算逻辑：(当前页码-1)*每页条数 + 索引 + 1 -->
                    {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
                  </template>
                </el-table-column>
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

              <!-- 分页控件 -->
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
          <template #footer>
            <el-button @click="showDeleteDialog = false">取消</el-button>
            <el-button type="danger" @click="showDeleteDialog = false">确认删除</el-button>
          </template>
        </el-dialog>
      </div>
    `,
    setup() {
        const { ref, onMounted, reactive, toRefs } = Vue;
        const { ElMessage, ElLoading } = ElementPlus;
        // 状态管理
        const state = reactive({
            // 统计卡片
            statistic: {
                totalVisit: 0,  // 今日累计到访
                visiting: 0,    // 拜访中
                left: 0,        // 已离开
                noVisit: 0      // 未到访
            },

            // 表格数据
            tableData: [],
            filteredData: [], // 过滤后的数据
            totalCount: 0,    // 总条数

            // 分页参数
            currentPage: 1,
            pageSize: 10,

            // 筛选条件
            filterType: 'all',
            dateRange: null,
            keyword: '',

            // 选择项
            selectedIds: [],
            showDeleteDialog: false,
            deleteCount: 0,
        });

        const getTodayTimeRange = () => {
            const today = new Date();
            const start = new Date(today.setHours(0, 0, 0, 0)).toISOString().replace('T', ' ').slice(0, 19);
            const end = new Date(today.setHours(23, 59, 59, 999)).toISOString().replace('T', ' ').slice(0, 19);
            return { start_time: start, end_time: end };
        };

        // 获取统计数据
        const fetchStatistic = async () => {
            try {
                // 传递今日时间范围参数
                const params = getTodayTimeRange();
                const data = await visitorAPI.getStatistic(params);

                if (data) {
                    state.statistic = {
                        totalVisit: data.total_visit || 0,
                        visiting: data.visiting || 0,
                        left: data.left || 0,
                        noVisit: data.no_visit || 0
                    };
                }
            } catch (error) {
                console.error('获取统计数据失败:', error);
                ElMessage.error('统计数据加载失败');
            }
        };

        const fetchVisitorList = async () => {
            const loading = ElLoading.service({
                lock: true,
                text: '加载中...',
                background: 'rgba(0, 0, 0, 0.7)'
            });

            try {
                // 发送POST请求
                const data = await visitorAPI.getList({
                    page: state.currentPage,
                    page_size: state.pageSize
                });
                console.log(data)

                // 处理接口响应
                if (data) {
                    const { total, list } = data;
                    state.tableData = list.map(item => ({
                        // 映射接口字段到表格需要的格式
                        id: item.id,
                        name: item.visitor_name,
                        visitTime: item.time_visit ? new Date(item.time_visit).toLocaleString() : '',
                        actualVisitTime: item.visiting_status === 'visited' ? item.time_visit : '',
                        leaveTime: item.time_leave ? new Date(item.time_leave).toLocaleString() : '',
                        interviewee: item.host_name,
                        status: mapStatus(item.visiting_status),
                        applicationNo: item.application_no,
                        company: item.visitor_company
                    }));
                    state.totalCount = total;
                    state.filteredData = [...state.tableData];
                } else {
                    ElMessage.error(result.result?.msg || '获取数据失败');
                }
            } catch (error) {
                console.error('请求错误:', error);
                ElMessage.error('网络错误，无法获取数据');
            } finally {
                loading.close();
            }
        };

        // 状态映射（接口状态转显示状态）
        const mapStatus = (visitingStatus) => {
            const statusMap = {
                'no_visit': 'noShow',    // 未到访
                'visited': 'active',     // 拜访中
                'left': 'left',          // 已离开
                'pending': 'pending'     // 待审批
            };
            return statusMap[visitingStatus] || 'active';
        };

        // 页面加载时获取数据
        onMounted(() => {
            fetchVisitorList();
            fetchStatistic();
        });

        // 搜索处理
        const handleSearch = () => {
            state.currentPage = 1; // 重置到第一页
            // 这里可以根据筛选条件再次请求接口
            // 简单前端过滤示例：
            state.filteredData = state.tableData.filter(item => {
                // 状态筛选
                if (state.filterType !== 'all' && item.status !== state.filterType) {
                    return false;
                }
                // 关键词筛选
                if (state.keyword && !item.name.includes(state.keyword) && !item.interviewee.includes(state.keyword)) {
                    return false;
                }
                // 日期范围筛选
                if (state.dateRange) {
                    const visitDate = new Date(item.visitTime).toDateString();
                    const startDate = new Date(state.dateRange[0]).toDateString();
                    const endDate = new Date(state.dateRange[1]).toDateString();
                    if (visitDate < startDate || visitDate > endDate) {
                        return false;
                    }
                }
                return true;
            });
        };

        // 重置筛选条件
        const resetFilter = () => {
            state.filterType = 'all';
            state.dateRange = null;
            state.keyword = '';
            state.filteredData = [...state.tableData];
        };

        // 分页处理
        const handleSizeChange = (size) => {
            state.pageSize = size;
            fetchVisitorList(); // 重新请求数据
        };

        const handleCurrentChange = (page) => {
            state.currentPage = page;
            fetchVisitorList(); // 重新请求数据
        };

        // 选择项变化
        const handleSelectionChange = (selection) => {
            state.selectedIds = selection.map(item => item.id);
            state.deleteCount = selection.length;
        };

        // 批量删除
        const handleBatchDelete = () => {
            state.showDeleteDialog = true;
        };

        // 导出Excel
        const exportToExcel = () => {
            // 实现导出逻辑
            ElMessage.success('导出功能开发中');
        };

        return {
            ...toRefs(state),
            handleSearch,
            resetFilter,
            handleSizeChange,
            handleCurrentChange,
            handleSelectionChange,
            handleBatchDelete,
            exportToExcel
        };
    }
};