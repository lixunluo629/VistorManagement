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
                          value-format="YYYY-MM-DD"
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
                      :disabled="selectedIds.length === 0"
                  >
                    导出勾选数据
                  </el-button>
<!--                  <el-button-->
<!--                      type="danger"-->
<!--                      @click="handleBatchDelete"-->
<!--                      icon="Delete"-->
<!--                      :disabled="selectedIds.length === 0"-->
<!--                  >-->
<!--                    批量删除-->
<!--                  </el-button>-->
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
        const { ipcRenderer } = require('electron');
        const { ElMessage, ElLoading } = ElementPlus;
        const XLSX = require('xlsx');
        // 状态管理
        const state = reactive({
            // 统计卡片
            statistic: {
                totalVisit: 0,
                visiting: 0,
                left: 0,
                noVisit: 0
            },

            // 表格数据
            tableData: [],
            filteredData: [],
            totalCount: 0,

            // 分页参数
            currentPage: 1,
            pageSize: 10,

            // 筛选条件
            filterType: 'all',
            dateRange: ['', ''],
            keyword: '',

            // 选择项
            selectedIds: [],
            showDeleteDialog: false,
            deleteCount: 0,
        });

        // 处理日期范围：开始日00:00:00，结束日+1天00:00:00
        const handleDateRange = (dateRange) => {
            if (!dateRange || dateRange.length < 2 || !dateRange[0] || !dateRange[1]) {
                return { startTime: '', endTime: '' };
            }

            const [startDateStr, endDateStr] = dateRange;
            const startTime = `${startDateStr} 00:00:00`;
            const endDate = new Date(endDateStr);
            endDate.setDate(endDate.getDate() + 1);
            const year = endDate.getFullYear();
            const month = String(endDate.getMonth() + 1).padStart(2, '0');
            const day = String(endDate.getDate()).padStart(2, '0');
            const endTime = `${year}-${month}-${day} 00:00:00`;

            return { startTime, endTime };
        };

        const getTodayTimeRange = () => {
            const today = new Date();
            const start = new Date(today.setHours(0, 0, 0, 0)).toISOString().replace('T', ' ').slice(0, 19);
            const end = new Date(today.setHours(23, 59, 59, 999)).toISOString().replace('T', ' ').slice(0, 19);
            return { start_time: start, end_time: end };
        };

        // 获取统计数据
        const fetchStatistic = async () => {
            try {
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

        // 获取访客列表（带分页）
        const fetchVisitorList = async () => {
            const loading = ElLoading.service({
                lock: true,
                text: '加载中...',
                background: 'rgba(0, 0, 0, 0.7)'
            });

            try {
                const { startTime, endTime } = handleDateRange(state.dateRange);
                const requestParams = {
                    page: state.currentPage,
                    page_size: state.pageSize,
                    status: state.filterType === 'all' ? '' : state.filterType,
                    keyword: state.keyword,
                    time_visit_start: startTime,
                    time_visit_end: endTime
                };

                const data = await visitorAPI.getList(requestParams);
                if (data) {
                    const { total, list } = data;
                    state.tableData = list.map(item => ({
                        id: item.id,
                        name: item.visitor_name,
                        visitTime: item.time_visit ? new Date(item.time_visit).toLocaleString() : '',
                        actualVisitTime: item.visiting_status !== 'no_visit' ? item.time_arrive : '',
                        leaveTime: item.time_leave ? new Date(item.time_leave).toLocaleString() : '',
                        interviewee: item.host_name,
                        status: mapStatus(item.visiting_status),
                        applicationNo: item.application_no,
                        company: item.visitor_company
                    }));
                    state.totalCount = total;
                    state.filteredData = [...state.tableData];
                } else {
                    ElMessage.error('获取数据失败');
                }
            } catch (error) {
                console.error('请求错误:', error);
                ElMessage.error('网络错误，无法获取数据');
            } finally {
                loading.close();
            }
        };

        // 状态映射
        const mapStatus = (visitingStatus) => {
            const statusMap = {
                'no_visit': 'noShow',
                'visited': 'active',
                'left': 'left',
                'pending': 'pending'
            };
            return statusMap[visitingStatus] || 'active';
        };

        // 状态文字转换（用于Excel）
        const getStatusText = (statusKey) => {
            const statusTextMap = {
                'noShow': '未到访',
                'active': '拜访中',
                'left': '已离开',
                'pending': '待审批'
            };
            return statusTextMap[statusKey] || '异常';
        };

        // 导出勾选的数据为Excel
        const exportToExcel = async () => {
            if (state.selectedIds.length === 0) {
                ElMessage.warning('请先勾选需要导出的数据');
                return;
            }

            const loading = ElLoading.service({
                lock: true,
                text: '正在导出勾选数据...',
                background: 'rgba(0, 0, 0, 0.7)'
            });

            try {
                const selectedRows = state.tableData.filter(row => state.selectedIds.includes(row.id));
                if (selectedRows.length === 0) {
                    ElMessage.warning('勾选的数据不存在，请刷新后重试');
                    loading.close();
                    return;
                }

                // 1. 定义表头和数据映射（方便配置样式和列宽）
                const headerMap = [
                    { key: 'serial', label: '序号', width: 8 }, // 列宽：8个字符
                    { key: 'name', label: '姓名', width: 15 },
                    { key: 'visitTime', label: '预约到访时间', width: 25 },
                    { key: 'actualTime', label: '实际到访时间', width: 25 },
                    { key: 'leaveTime', label: '离开时间', width: 25 },
                    { key: 'interviewee', label: '受访人', width: 15 },
                    { key: 'status', label: '状态', width: 10 },
                    { key: 'applyNo', label: '申请单号', width: 20 },
                    { key: 'company', label: '访客公司', width: 20 }
                ];

                // 2. 格式化数据（生成二维数组，包含表头和数据）
                // 表头行（用于设置样式）
                const headerRow = headerMap.map(item => item.label);
                // 数据行
                const dataRows = selectedRows.map((item, index) => [
                    index + 1,
                    item.name || '',
                    item.visitTime || '',
                    item.actualVisitTime || '未到访',
                    item.leaveTime || (item.status === 'active' ? '拜访中' : '-'),
                    item.interviewee || '',
                    getStatusText(item.status),
                    item.applicationNo || '',
                    item.company || ''
                ]);

                // 3. 创建工作表并设置样式
                const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

                // 3.2 设置列宽（!cols属性：每列的宽度，wch为字符数，width为像素）
                ws['!cols'] = headerMap.map(item => ({ wch: item.width })); // wch：字符宽度

                // 4. 创建工作簿并添加工作表
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, '访客数据');

                // 5. 生成base64字符串（保持之前的传递逻辑）
                const excelBase64 = XLSX.write(wb, {
                    bookType: 'xlsx',
                    type: 'base64',
                    cellStyles: true // 关键：启用单元格样式（必须添加，否则样式不生效）
                });

                // 6. 定义默认文件名
                const today = new Date().toLocaleDateString().replace(/\//g, '-');
                const defaultFileName = `访客数据_${today}.xlsx`;

                // 7. 调用主进程的保存方法
                const result = await ipcRenderer.invoke('saveExcelFile', excelBase64, defaultFileName);

                if (result.success) {
                    ElMessage.success(`Excel保存成功：${result.filePath}`);
                } else {
                    ElMessage.warning(result.message);
                }

            } catch (error) {
                console.error('导出失败:', error);
                ElMessage.error('导出失败，请重试');
            } finally {
                loading.close();
            }
        };

        // 页面加载时获取数据
        onMounted(() => {
            fetchVisitorList();
            fetchStatistic();
        });

        // 搜索处理
        const handleSearch = () => {
            state.currentPage = 1;
            fetchVisitorList();
        };

        // 重置筛选条件
        const resetFilter = () => {
            state.currentPage = 1;
            state.filterType = 'all';
            state.dateRange = ['', ''];
            state.keyword = '';
            fetchVisitorList();
        };

        // 分页处理
        const handleSizeChange = (size) => {
            state.pageSize = size;
            fetchVisitorList();
        };

        const handleCurrentChange = (page) => {
            state.currentPage = page;
            fetchVisitorList();
        };

        // 选择项变化
        const handleSelectionChange = (selection) => {
            state.selectedIds = selection.map(item => item.id);
            state.deleteCount = selection.length;
        };

        // 批量删除
        // const handleBatchDelete = () => {
        //     state.showDeleteDialog = true;
        // };

        return {
            ...toRefs(state),
            handleSearch,
            resetFilter,
            handleSizeChange,
            handleCurrentChange,
            handleSelectionChange,
            // handleBatchDelete,
            exportToExcel
        };
    }
};