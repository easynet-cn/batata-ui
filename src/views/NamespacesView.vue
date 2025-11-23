<template>
  <div class="namespaces-page">
    <div class="page-header">
      <h1>命名空间管理</h1>
      <p>管理 Nacos 中的命名空间，用于隔离不同环境的配置</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="action-card">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建命名空间
      </el-button>
      <el-button @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </el-card>

    <!-- 命名空间列表 -->
    <el-card class="table-card">
      <el-table v-loading="nacosStore.loading" :data="namespaces" stripe style="width: 100%">
        <el-table-column prop="namespaceShowName" label="命名空间名称" min-width="200">
          <template #default="{ row }">
            <div class="namespace-name">
              <el-icon v-if="row.namespace === 'public'" color="#67c23a"><FolderOpened /></el-icon>
              <el-icon v-else color="#409eff"><Folder /></el-icon>
              <span>{{ row.namespaceShowName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="namespaceId" label="命名空间ID" min-width="200">
          <template #default="{ row }">
            <el-tag size="small" :type="row.namespace === 'public' ? 'success' : 'primary'">
              {{ row.namespaceId }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="quota" label="配额" width="120" align="center">
          <template #default="{ row }">
            {{ row.quota === -1 ? '无限制' : row.quota }}
          </template>
        </el-table-column>

        <el-table-column prop="configCount" label="配置数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.configCount }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 0 ? 'success' : 'primary'" size="small">
              {{ row.type === 0 ? '系统' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewConfigs(row)"> 查看配置 </el-button>
            <el-button
              v-if="row.type === 1"
              type="warning"
              size="small"
              @click="editNamespace(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.type === 1"
              type="danger"
              size="small"
              @click="deleteNamespace(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建命名空间对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建命名空间" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="120px">
        <el-form-item label="命名空间ID" prop="namespaceId">
          <el-input
            v-model="createForm.namespaceId"
            placeholder="请输入命名空间ID（如：dev、test、prod）"
          />
          <div class="form-tip">命名空间ID只能包含字母、数字、下划线，且不能以数字开头</div>
        </el-form-item>

        <el-form-item label="命名空间名称" prop="namespaceName">
          <el-input v-model="createForm.namespaceName" placeholder="请输入命名空间显示名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="createForm.namespaceDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入命名空间描述（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateNamespace">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑命名空间对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑命名空间" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="120px">
        <el-form-item label="命名空间ID">
          <el-input v-model="editForm.namespaceId" disabled />
          <div class="form-tip">命名空间ID创建后不可修改</div>
        </el-form-item>

        <el-form-item label="命名空间名称" prop="namespaceName">
          <el-input v-model="editForm.namespaceName" placeholder="请输入命名空间显示名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="editForm.namespaceDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入命名空间描述（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditNamespace">确定</el-button>
      </template>
    </el-dialog>

    <!-- 命名空间统计卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalNamespaces }}</div>
              <div class="stat-label">命名空间总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalConfigs }}</div>
              <div class="stat-label">配置总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><FolderOpened /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ customNamespaces }}</div>
              <div class="stat-label">自定义命名空间</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Folder, FolderOpened, Document } from '@element-plus/icons-vue'
import { useNacosStore } from '@/stores/nacos'
import type { Namespace } from '@/api/nacos'

const router = useRouter()
const nacosStore = useNacosStore()

// 对话框状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)

// 表单引用
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

// 创建表单
const createForm = reactive({
  namespaceId: '',
  namespaceName: '',
  namespaceDesc: '',
})

// 编辑表单
const editForm = reactive({
  namespaceId: '',
  namespaceName: '',
  namespaceDesc: '',
})

// 表单验证规则
const createRules: FormRules = {
  namespaceId: [
    { required: true, message: '请输入命名空间ID', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      message: '命名空间ID只能包含字母、数字、下划线，且不能以数字开头',
      trigger: 'blur',
    },
    {
      min: 2,
      max: 50,
      message: '命名空间ID长度在 2 到 50 个字符',
      trigger: 'blur',
    },
  ],
  namespaceName: [
    { required: true, message: '请输入命名空间名称', trigger: 'blur' },
    {
      min: 2,
      max: 100,
      message: '命名空间名称长度在 2 到 100 个字符',
      trigger: 'blur',
    },
  ],
}

const editRules: FormRules = {
  namespaceName: [
    { required: true, message: '请输入命名空间名称', trigger: 'blur' },
    {
      min: 2,
      max: 100,
      message: '命名空间名称长度在 2 到 100 个字符',
      trigger: 'blur',
    },
  ],
}

// 计算属性
const namespaces = computed(() => nacosStore.namespaces)

const totalNamespaces = computed(() => namespaces.value.length)

const totalConfigs = computed(() => namespaces.value.reduce((sum, ns) => sum + ns.configCount, 0))

const customNamespaces = computed(() => namespaces.value.filter((ns) => ns.type === 1).length)

// 刷新数据
const refreshData = async () => {
  try {
    await nacosStore.fetchNamespaces()
    ElMessage.success('数据刷新成功')
  } catch {
    ElMessage.error('数据刷新失败')
  }
}

// 查看配置
const viewConfigs = (namespace: Namespace) => {
  router.push({
    path: '/configs',
    query: { tenant: namespace.namespaceId },
  })
}

// 编辑命名空间
const editNamespace = (namespace: Namespace) => {
  editForm.namespaceId = namespace.namespaceId
  editForm.namespaceName = namespace.namespaceShowName
  editForm.namespaceDesc = '' // Nacos API 不返回描述信息
  showEditDialog.value = true
}

// 删除命名空间
const deleteNamespace = async (namespace: Namespace) => {
  if (namespace.configCount > 0) {
    ElMessage.warning('该命名空间下还有配置，请先删除所有配置')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除命名空间 "${namespace.namespaceShowName}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    await nacosStore.deleteNamespace(namespace.namespaceId)
    ElMessage.success('删除成功')
    await refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 创建命名空间
const handleCreateNamespace = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()

    await nacosStore.createNamespace(
      createForm.namespaceId,
      createForm.namespaceName,
      createForm.namespaceDesc || undefined,
    )

    ElMessage.success('创建成功')
    showCreateDialog.value = false

    // 重置表单
    createForm.namespaceId = ''
    createForm.namespaceName = ''
    createForm.namespaceDesc = ''

    await refreshData()
  } catch {
    ElMessage.error('创建失败')
  }
}

// 编辑命名空间
const handleEditNamespace = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()

    // 注意：Nacos API 可能不支持更新命名空间，这里只是示例
    ElMessage.info('更新命名空间功能需要后端API支持')
    showEditDialog.value = false
  } catch {
    ElMessage.error('更新失败')
  }
}

// 页面加载时获取数据
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.namespaces-page {
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

.action-card {
  margin-bottom: 24px;
}

.table-card {
  margin-bottom: 24px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.namespace-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.el-table .cell) {
  word-break: break-word;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
