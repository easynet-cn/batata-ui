<template>
  <div class="services-page">
    <div class="page-header">
      <h1>服务管理</h1>
      <p>管理 Nacos 中的服务注册与发现</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="服务名称">
          <el-input
            v-model="searchForm.serviceName"
            placeholder="请输入服务名称"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分组">
          <el-select
            v-model="searchForm.groupName"
            placeholder="请选择分组"
            clearable
            @clear="handleSearch"
          >
            <el-option label="DEFAULT_GROUP" value="DEFAULT_GROUP" />
            <el-option label="PRODUCTION_GROUP" value="PRODUCTION_GROUP" />
            <el-option label="TEST_GROUP" value="TEST_GROUP" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建服务
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 服务列表 -->
    <el-card class="table-card">
      <el-table v-loading="nacosStore.loading" :data="services" stripe style="width: 100%">
        <el-table-column prop="name" label="服务名称" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewServiceDetail(row)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="groupName" label="分组" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.groupName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="集群数量" width="100" align="center">
          <template #default="{ row }">
            {{ row.clusterCount }}
          </template>
        </el-table-column>

        <el-table-column label="实例数量" width="100" align="center">
          <template #default="{ row }">
            {{ row.ipCount }}
          </template>
        </el-table-column>

        <el-table-column label="健康实例" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.healthyInstanceCount > 0 ? 'success' : 'danger'" size="small">
              {{ row.healthyInstanceCount }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="健康状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getHealthStatus(row).type" :icon="getHealthStatus(row).icon">
              {{ getHealthStatus(row).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="triggerFlag" label="触发保护" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.triggerFlag === 'true' ? 'warning' : 'info'" size="small">
              {{ row.triggerFlag === 'true' ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewServiceDetail(row)">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="editService"> 编辑 </el-button>
            <el-button type="danger" size="small" @click="deleteService(row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建服务对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建服务" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="服务名称" prop="serviceName">
          <el-input v-model="createForm.serviceName" placeholder="请输入服务名称" />
        </el-form-item>
        <el-form-item label="分组" prop="groupName">
          <el-select v-model="createForm.groupName" placeholder="请选择分组" style="width: 100%">
            <el-option label="DEFAULT_GROUP" value="DEFAULT_GROUP" />
            <el-option label="PRODUCTION_GROUP" value="PRODUCTION_GROUP" />
            <el-option label="TEST_GROUP" value="TEST_GROUP" />
          </el-select>
        </el-form-item>
        <el-form-item label="元数据">
          <el-input
            v-model="createForm.metadata"
            type="textarea"
            :rows="4"
            placeholder="请输入元数据（JSON格式）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateService">确定</el-button>
      </template>
    </el-dialog>

    <!-- 服务详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`服务详情 - ${currentService?.name}`"
      width="80%"
      top="5vh"
    >
      <div v-if="currentService" class="service-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="服务名称">
            {{ currentService.name }}
          </el-descriptions-item>
          <el-descriptions-item label="分组">
            <el-tag size="small">{{ currentService.groupName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="集群数量">
            {{ currentService.clusterCount }}
          </el-descriptions-item>
          <el-descriptions-item label="实例数量">
            {{ currentService.ipCount }}
          </el-descriptions-item>
          <el-descriptions-item label="健康实例">
            <el-tag type="success" size="small">
              {{ currentService.healthyInstanceCount }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="触发保护">
            <el-tag :type="currentService.triggerFlag === 'true' ? 'warning' : 'info'" size="small">
              {{ currentService.triggerFlag === 'true' ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 实例列表 -->
        <div class="instances-section">
          <h3>服务实例</h3>
          <el-table
            v-loading="nacosStore.loading"
            :data="serviceInstances"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="instanceId" label="实例ID" min-width="200" />
            <el-table-column prop="ip" label="IP地址" width="150" />
            <el-table-column prop="port" label="端口" width="100" align="center" />
            <el-table-column prop="weight" label="权重" width="100" align="center" />
            <el-table-column label="健康状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.healthy ? 'success' : 'danger'" size="small">
                  {{ row.healthy ? '健康' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="启用状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="clusterName" label="集群名称" width="150" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useNacosStore } from '@/stores/nacos'
import type { ServiceInfo } from '@/api/nacos'

const nacosStore = useNacosStore()

// 搜索表单
const searchForm = reactive({
  serviceName: '',
  groupName: '',
})

// 分页
const pagination = reactive({
  pageNo: 1,
  pageSize: 20,
  total: 0,
})

// 对话框状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const currentService = ref<ServiceInfo | null>(null)

// 表单引用
const createFormRef = ref<FormInstance>()

// 创建表单
const createForm = reactive({
  serviceName: '',
  groupName: 'DEFAULT_GROUP',
  metadata: '',
})

// 表单验证规则
const createRules: FormRules = {
  serviceName: [
    { required: true, message: '请输入服务名称', trigger: 'blur' },
    {
      min: 2,
      max: 50,
      message: '服务名称长度在 2 到 50 个字符',
      trigger: 'blur',
    },
  ],
  groupName: [{ required: true, message: '请选择分组', trigger: 'change' }],
}

// 计算属性
const services = computed(() => nacosStore.services)
const serviceInstances = computed(() => nacosStore.serviceInstances)

// 获取健康状态
const getHealthStatus = (service: ServiceInfo) => {
  const healthyCount = service.healthyInstanceCount
  const totalCount = service.ipCount

  if (totalCount === 0) {
    return { type: 'info', text: '无实例', icon: SuccessFilled }
  }

  const healthRate = healthyCount / totalCount
  if (healthRate === 1) {
    return { type: 'success', text: '健康', icon: SuccessFilled }
  } else if (healthRate > 0.5) {
    return { type: 'warning', text: '部分异常', icon: SuccessFilled }
  } else {
    return { type: 'danger', text: '异常', icon: CircleCloseFilled }
  }
}

// 搜索
const handleSearch = async () => {
  pagination.pageNo = 1
  await fetchServices()
}

// 重置
const handleReset = () => {
  searchForm.serviceName = ''
  searchForm.groupName = ''
  handleSearch()
}

// 分页大小改变
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  await fetchServices()
}

// 当前页改变
const handleCurrentChange = async (page: number) => {
  pagination.pageNo = page
  await fetchServices()
}

// 获取服务列表
const fetchServices = async () => {
  try {
    const result = await nacosStore.fetchServices(
      pagination.pageNo,
      pagination.pageSize,
      searchForm.groupName || undefined,
    )
    pagination.total = result.count
  } catch {
    ElMessage.error('获取服务列表失败')
  }
}

// 查看服务详情
const viewServiceDetail = async (service: ServiceInfo) => {
  currentService.value = service
  showDetailDialog.value = true

  try {
    await nacosStore.fetchServiceInstances(service.name, service.groupName)
  } catch {
    ElMessage.error('获取服务实例失败')
  }
}

// 编辑服务
const editService = () => {
  ElMessage.info('编辑功能开发中...')
}

// 删除服务
const deleteService = async (service: ServiceInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务 "${service.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    await nacosStore.deleteService(service.name, service.groupName)
    ElMessage.success('删除成功')
    await fetchServices()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 创建服务
const handleCreateService = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()

    let metadata = {}
    if (createForm.metadata.trim()) {
      try {
        metadata = JSON.parse(createForm.metadata)
      } catch {
        ElMessage.error('元数据格式错误，请输入有效的JSON格式')
        return
      }
    }

    await nacosStore.createService(createForm.serviceName, createForm.groupName, metadata)
    ElMessage.success('创建成功')
    showCreateDialog.value = false

    // 重置表单
    createForm.serviceName = ''
    createForm.groupName = 'DEFAULT_GROUP'
    createForm.metadata = ''

    await fetchServices()
  } catch {
    ElMessage.error('创建失败')
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchServices()
})
</script>

<style scoped>
.services-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #6b7280;
  margin: 0;
}

.search-card {
  margin-bottom: 24px;
}

.table-card {
  margin-bottom: 24px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.service-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.instances-section {
  margin-top: 24px;
}

.instances-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

:deep(.el-table .cell) {
  word-break: break-word;
}
</style>
