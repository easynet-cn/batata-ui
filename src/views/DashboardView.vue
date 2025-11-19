<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>仪表板</h1>
      <p>Nacos 服务发现和配置管理平台概览</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card services-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Service /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ nacosStore.serviceTotal }}</div>
              <div class="stat-label">服务总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card instances-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ nacosStore.totalInstancesCount }}</div>
              <div class="stat-label">实例总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card configs-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ nacosStore.configTotal }}</div>
              <div class="stat-label">配置总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card namespaces-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ nacosStore.namespaces.length }}</div>
              <div class="stat-label">命名空间</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表和列表 -->
    <el-row :gutter="24" class="content-row">
      <!-- 服务健康状态图表 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>服务健康状态</span>
              <el-button type="text" @click="refreshData">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          <v-chart class="chart" :option="healthChartOption" />
        </el-card>
      </el-col>

      <!-- 最近活动 -->
      <el-col :span="12">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span>最近活动</span>
              <el-button type="text" @click="refreshData">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="activity-list">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon" :class="activity.type">
                <el-icon
                  ><component :is="getActivityIcon(activity.type)"
                /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-row :gutter="24" class="actions-row">
      <el-col :span="24">
        <el-card class="actions-card">
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/services')">
              <el-icon><Service /></el-icon>
              服务管理
            </el-button>
            <el-button type="success" @click="$router.push('/configs')">
              <el-icon><Document /></el-icon>
              配置管理
            </el-button>
            <el-button type="warning" @click="$router.push('/namespaces')">
              <el-icon><Folder /></el-icon>
              命名空间
            </el-button>
            <el-button type="info" @click="$router.push('/cluster-nodes')">
              <el-icon><Monitor /></el-icon>
              集群节点
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, type Component } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { useNacosStore } from "@/stores/nacos";
import { ElMessage } from "element-plus";
import {
  Service,
  Monitor,
  Document,
  Folder,
  Refresh,
  Plus,
  Edit,
  Delete,
  Setting,
} from "@element-plus/icons-vue";

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

const nacosStore = useNacosStore();

// 最近活动数据
const recentActivities = ref([
  {
    id: 1,
    type: "create",
    title: "创建新服务 user-service",
    time: "2 分钟前",
  },
  {
    id: 2,
    type: "update",
    title: "更新配置 application.yaml",
    time: "5 分钟前",
  },
  {
    id: 3,
    type: "delete",
    title: "删除服务 old-service",
    time: "10 分钟前",
  },
  {
    id: 4,
    type: "create",
    title: "创建命名空间 production",
    time: "15 分钟前",
  },
  {
    id: 5,
    type: "update",
    title: "服务实例状态变更",
    time: "20 分钟前",
  },
]);

// 健康状态图表配置
const healthChartOption = computed(() => ({
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
  },
  series: [
    {
      name: "服务健康状态",
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: false,
        position: "center",
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: "bold",
        },
      },
      labelLine: {
        show: false,
      },
      data: [
        {
          value: nacosStore.healthyServicesCount,
          name: "健康服务",
          itemStyle: { color: "#52c41a" },
        },
        {
          value: nacosStore.serviceTotal - nacosStore.healthyServicesCount,
          name: "异常服务",
          itemStyle: { color: "#ff4d4f" },
        },
      ],
    },
  ],
}));

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, Component> = {
    create: Plus,
    update: Edit,
    delete: Delete,
    setting: Setting,
  };
  return iconMap[type] || Setting;
};

// 刷新数据
const refreshData = async () => {
  try {
    await Promise.all([
      nacosStore.fetchServices(),
      nacosStore.fetchConfigs(),
      nacosStore.fetchNamespaces(),
    ]);
    ElMessage.success("数据刷新成功");
  } catch {
    ElMessage.error("数据刷新失败");
  }
};

// 页面加载时获取数据
onMounted(async () => {
  await refreshData();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.dashboard-header p {
  color: #6b7280;
  margin: 0;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  height: 120px;
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
}

.services-card .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.instances-card .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.configs-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.namespaces-card .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.content-row {
  margin-bottom: 24px;
}

.chart-card,
.activity-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 320px;
}

.activity-list {
  height: 320px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.activity-icon.create {
  background: #f6ffed;
  color: #52c41a;
}

.activity-icon.update {
  background: #fff7e6;
  color: #fa8c16;
}

.activity-icon.delete {
  background: #fff1f0;
  color: #ff4d4f;
}

.activity-icon.setting {
  background: #f0f5ff;
  color: #1890ff;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
}

.actions-card {
  height: auto;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
</style>
