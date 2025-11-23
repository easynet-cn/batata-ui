<template>
  <div class="configs-page">
    <div class="page-header">
      <h1>配置管理</h1>
      <p>管理 Nacos 中的配置文件</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="Data ID">
          <el-input
            v-model="searchForm.dataId"
            placeholder="请输入Data ID"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分组">
          <el-select
            v-model="searchForm.group"
            placeholder="请选择分组"
            clearable
            @clear="handleSearch"
          >
            <el-option label="DEFAULT_GROUP" value="DEFAULT_GROUP" />
            <el-option label="PRODUCTION_GROUP" value="PRODUCTION_GROUP" />
            <el-option label="TEST_GROUP" value="TEST_GROUP" />
          </el-select>
        </el-form-item>
        <el-form-item label="命名空间">
          <el-select
            v-model="searchForm.tenant"
            placeholder="请选择命名空间"
            clearable
            @clear="handleSearch"
          >
            <el-option label="公共空间" value="" />
            <el-option
              v-for="ns in nacosStore.namespaces"
              :key="ns.namespaceId"
              :label="ns.namespaceShowName"
              :value="ns.namespaceId"
            />
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
            新建配置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 配置列表 -->
    <el-card class="table-card">
      <el-table v-loading="nacosStore.loading" :data="configs" stripe style="width: 100%">
        <el-table-column prop="dataId" label="Data ID" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewConfigDetail(row)">
              {{ row.dataId }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="group" label="分组" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.group }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="appName" label="应用名" width="120" />

        <el-table-column prop="type" label="格式" width="100">
          <template #default="{ row }">
            <el-tag :type="getConfigTypeColor(row.type)" size="small">
              {{ row.type || 'text' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="环境" width="150">
          <template #default="{ row }">
            <el-tag v-for="env in row.envs" :key="env" size="small" class="env-tag">
              {{ env }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="修改时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.modifyTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewConfigDetail(row)"> 详情 </el-button>
            <el-button type="warning" size="small" @click="editConfig(row)"> 编辑 </el-button>
            <el-button type="info" size="small" @click="viewHistory"> 历史 </el-button>
            <el-button type="danger" size="small" @click="deleteConfig(row)"> 删除 </el-button>
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

    <!-- 创建/编辑配置对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑配置' : '新建配置'"
      width="80%"
      top="5vh"
    >
      <el-form ref="configFormRef" :model="configForm" :rules="configRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Data ID" prop="dataId">
              <el-input
                v-model="configForm.dataId"
                placeholder="请输入Data ID"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分组" prop="group">
              <el-select v-model="configForm.group" placeholder="请选择分组" style="width: 100%">
                <el-option label="DEFAULT_GROUP" value="DEFAULT_GROUP" />
                <el-option label="PRODUCTION_GROUP" value="PRODUCTION_GROUP" />
                <el-option label="TEST_GROUP" value="TEST_GROUP" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应用名">
              <el-input v-model="configForm.appName" placeholder="请输入应用名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="格式">
              <el-select v-model="configForm.type" placeholder="请选择格式" style="width: 100%">
                <el-option label="TEXT" value="text" />
                <el-option label="JSON" value="json" />
                <el-option label="YAML" value="yaml" />
                <el-option label="XML" value="xml" />
                <el-option label="HTML" value="html" />
                <el-option label="Properties" value="properties" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="命名空间">
          <el-select v-model="configForm.tenant" placeholder="请选择命名空间" style="width: 100%">
            <el-option label="公共空间" value="" />
            <el-option
              v-for="ns in nacosStore.namespaces"
              :key="ns.namespaceId"
              :label="ns.namespaceShowName"
              :value="ns.namespaceId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="配置内容" prop="content">
          <el-input
            v-model="configForm.content"
            type="textarea"
            :rows="12"
            placeholder="请输入配置内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 配置详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`配置详情 - ${currentConfig?.dataId}`"
      width="80%"
      top="5vh"
    >
      <div v-if="currentConfig" class="config-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Data ID">
            {{ currentConfig.dataId }}
          </el-descriptions-item>
          <el-descriptions-item label="分组">
            <el-tag size="small">{{ currentConfig.group }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="应用名">
            {{ currentConfig.appName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="格式">
            <el-tag :type="getConfigTypeColor(currentConfig.type)" size="small">
              {{ currentConfig.type || 'text' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="MD5">
            {{ currentConfig.md5 }}
          </el-descriptions-item>
          <el-descriptions-item label="命名空间">
            {{ getNamespaceName(currentConfig.tenant) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(currentConfig.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="修改时间">
            {{ formatTime(currentConfig.modifyTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 配置内容 -->
        <div class="content-section">
          <h3>配置内容</h3>
          <el-input
            v-model="configContent"
            type="textarea"
            :rows="15"
            readonly
            class="content-textarea"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useNacosStore } from '@/stores/nacos'
import type { ConfigItem } from '@/api/nacos'

const nacosStore = useNacosStore()

// 搜索表单
const searchForm = reactive({
  dataId: '',
  group: '',
  tenant: '',
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
const currentConfig = ref<ConfigItem | null>(null)
const isEdit = ref(false)
const configContent = ref('')

// 表单引用
const configFormRef = ref<FormInstance>()

// 配置表单
const configForm = reactive({
  dataId: '',
  group: 'DEFAULT_GROUP',
  appName: '',
  type: 'text',
  tenant: '',
  content: '',
})

// 表单验证规则
const configRules: FormRules = {
  dataId: [
    { required: true, message: '请输入Data ID', trigger: 'blur' },
    {
      min: 1,
      max: 255,
      message: 'Data ID长度在 1 到 255 个字符',
      trigger: 'blur',
    },
  ],
  group: [{ required: true, message: '请选择分组', trigger: 'change' }],
  content: [{ required: true, message: '请输入配置内容', trigger: 'blur' }],
}

// 计算属性
const configs = computed(() => nacosStore.configs)

// 获取配置类型颜色
const getConfigTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    json: 'success',
    yaml: 'success',
    xml: 'warning',
    html: 'danger',
    properties: 'info',
    text: '',
  }
  return colorMap[type] || ''
}

// 获取命名空间名称
const getNamespaceName = (tenant: string) => {
  if (!tenant) return '公共空间'
  const ns = nacosStore.namespaces.find((n) => n.namespaceId === tenant)
  return ns ? ns.namespaceShowName : tenant
}

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

// 搜索
const handleSearch = async () => {
  pagination.pageNo = 1
  await fetchConfigs()
}

// 重置
const handleReset = () => {
  searchForm.dataId = ''
  searchForm.group = ''
  searchForm.tenant = ''
  handleSearch()
}

// 分页大小改变
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  await fetchConfigs()
}

// 当前页改变
const handleCurrentChange = async (page: number) => {
  pagination.pageNo = page
  await fetchConfigs()
}

// 获取配置列表
const fetchConfigs = async () => {
  try {
    const result = await nacosStore.fetchConfigs(
      pagination.pageNo,
      pagination.pageSize,
      searchForm.dataId || undefined,
      searchForm.group || undefined,
      searchForm.tenant || undefined,
    )
    pagination.total = result.totalCount
  } catch {
    ElMessage.error('获取配置列表失败')
  }
}

// 查看配置详情
const viewConfigDetail = async (config: ConfigItem) => {
  currentConfig.value = config
  showDetailDialog.value = true

  try {
    const content = await nacosStore.fetchConfigContent(config.dataId, config.group, config.tenant)
    configContent.value = typeof content === 'string' ? content : content.data || String(content)
  } catch {
    ElMessage.error('获取配置内容失败')
  }
}

// 编辑配置
const editConfig = async (config: ConfigItem) => {
  isEdit.value = true
  currentConfig.value = config

  // 填充表单
  configForm.dataId = config.dataId
  configForm.group = config.group
  configForm.appName = config.appName || ''
  configForm.type = config.type || 'text'
  configForm.tenant = config.tenant || ''

  try {
    const content = await nacosStore.fetchConfigContent(config.dataId, config.group, config.tenant)
    configForm.content = typeof content === 'string' ? content : content.data || String(content)
  } catch {
    ElMessage.error('获取配置内容失败')
    return
  }

  showCreateDialog.value = true
}

// 查看历史
const viewHistory = () => {
  ElMessage.info('历史版本功能开发中...')
}

// 删除配置
const deleteConfig = async (config: ConfigItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置 "${config.dataId}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    await nacosStore.deleteConfig(config.dataId, config.group, config.tenant)
    ElMessage.success('删除成功')
    await fetchConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 保存配置
const handleSaveConfig = async () => {
  if (!configFormRef.value) return

  try {
    await configFormRef.value.validate()

    await nacosStore.publishConfig(
      configForm.dataId,
      configForm.group,
      configForm.content,
      configForm.type,
      configForm.tenant || undefined,
    )

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    showCreateDialog.value = false
    resetConfigForm()
    await fetchConfigs()
  } catch {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

// 重置配置表单
const resetConfigForm = () => {
  configForm.dataId = ''
  configForm.group = 'DEFAULT_GROUP'
  configForm.appName = ''
  configForm.type = 'text'
  configForm.tenant = ''
  configForm.content = ''
  isEdit.value = false
}

// 页面加载时获取数据
onMounted(async () => {
  await Promise.all([fetchConfigs(), nacosStore.fetchNamespaces()])
})
</script>

<style scoped>
.configs-page {
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

.config-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.content-section {
  margin-top: 24px;
}

.content-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.content-textarea {
  font-family: 'Courier New', monospace;
}

.env-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

:deep(.el-table .cell) {
  word-break: break-word;
}

:deep(.el-textarea__inner) {
  font-family: 'Courier New', monospace;
  line-height: 1.5;
}
</style>
