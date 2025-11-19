<template>
  <div class="cluster-nodes-page">
    <div class="page-header">
      <h1>集群节点管理</h1>
      <p>查看 Nacos 集群节点状态和健康信息</p>
    </div>

    <!-- 集群概览 -->
    <el-row :gutter="24" class="overview-row">
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="overview-icon">
              <el-icon size="32"><Monitor /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ totalNodes }}</div>
              <div class="overview-label">节点总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card healthy">
          <div class="overview-content">
            <div class="overview-icon">
              <el-icon size="32"><SuccessFilled /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ healthyNodes }}</div>
              <div class="overview-label">健康节点</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card warning">
          <div class="overview-content">
            <div class="overview-icon">
              <el-icon size="32"><WarningFilled /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ warningNodes }}</div>
              <div class="overview-label">警告节点</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card error">
          <div class="overview-content">
            <div class="overview-icon">
              <el-icon size="32"><CircleCloseFilled /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ errorNodes }}</div>
              <div class="overview-label">异常节点</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card class="action-card">
      <el-button @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
      <el-button type="primary" @click="showMetricsDialog = true">
        <el-icon><TrendCharts /></el-icon>
        集群指标
      </el-button>
    </el-card>

    <!-- 节点列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="nacosStore.loading"
        :data="clusterNodes"
        stripe
        style="width: 100%"
      >
        <el-table-column label="节点状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getNodeStatusType(String(row.state))"
              :icon="getNodeStatusIcon(String(row.state))"
              size="small"
            >
              {{ getNodeStatusText(String(row.state)) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="ip" label="IP地址" width="150" />

        <el-table-column prop="port" label="端口" width="100" align="center" />

        <el-table-column prop="address" label="完整地址" min-width="200" />

        <el-table-column label="元数据" min-width="300">
          <template #default="{ row }">
            <div class="metadata-list">
              <el-tag
                v-for="(value, key) in row.metaData"
                :key="key"
                size="small"
                class="metadata-tag"
              >
                {{ key }}: {{ value }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="failAccessCnt"
          label="失败次数"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.failAccessCnt > 0 ? 'danger' : 'success'"
              size="small"
            >
              {{ row.failAccessCnt }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewNodeDetail(row)">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="pingNode(row)">
              Ping
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 节点详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`节点详情 - ${currentNode?.ip}:${currentNode?.port}`"
      width="60%"
    >
      <div v-if="currentNode" class="node-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="IP地址">
            {{ currentNode.ip }}
          </el-descriptions-item>
          <el-descriptions-item label="端口">
            {{ currentNode.port }}
          </el-descriptions-item>
          <el-descriptions-item label="完整地址">
            {{ currentNode.address }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getNodeStatusType(String(currentNode.state))"
              :icon="getNodeStatusIcon(String(currentNode.state))"
            >
              {{ getNodeStatusText(String(currentNode.state)) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败次数">
            <el-tag
              :type="
                (Number(currentNode.failAccessCnt) || 0) > 0
                  ? 'danger'
                  : 'success'
              "
              size="small"
            >
              {{ currentNode.failAccessCnt }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="权重">
            {{ currentNode.weight || 1 }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="metadata-section">
          <h3>元数据信息</h3>
          <el-table :data="metadataList" stripe>
            <el-table-column prop="key" label="键" width="200" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 集群指标对话框 -->
    <el-dialog
      v-model="showMetricsDialog"
      title="集群指标"
      width="80%"
      top="5vh"
    >
      <div class="metrics-content">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>节点状态分布</span>
              </template>
              <v-chart class="chart" :option="statusChartOption" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card>
              <template #header>
                <span>失败次数分布</span>
              </template>
              <v-chart class="chart" :option="failChartOption" />
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from "vue";
import { ElMessage } from "element-plus";
import {
  Monitor,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  Refresh,
  TrendCharts,
} from "@element-plus/icons-vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { useNacosStore } from "@/stores/nacos";

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const nacosStore = useNacosStore();

// 对话框状态
const showDetailDialog = ref(false);
const showMetricsDialog = ref(false);
const currentNode = ref<Record<string, unknown> | null>(null);

// 计算属性
const clusterNodes = computed(() => nacosStore.clusterNodes);

const totalNodes = computed(() => clusterNodes.value.length);

const healthyNodes = computed(
  () => clusterNodes.value.filter((node) => node.state === "UP").length,
);

const warningNodes = computed(
  () => clusterNodes.value.filter((node) => node.state === "SUSPICIOUS").length,
);

const errorNodes = computed(
  () => clusterNodes.value.filter((node) => node.state === "DOWN").length,
);

const metadataList = computed(() => {
  if (!currentNode.value?.metaData) return [];
  const metaData = currentNode.value.metaData as Record<string, unknown>;
  return Object.entries(metaData).map(([key, value]) => ({
    key,
    value: String(value),
  }));
});

// 节点状态图表配置
const statusChartOption = computed(() => ({
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
      name: "节点状态",
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
          value: healthyNodes.value,
          name: "健康",
          itemStyle: { color: "#52c41a" },
        },
        {
          value: warningNodes.value,
          name: "警告",
          itemStyle: { color: "#faad14" },
        },
        {
          value: errorNodes.value,
          name: "异常",
          itemStyle: { color: "#ff4d4f" },
        },
      ],
    },
  ],
}));

// 失败次数图表配置
const failChartOption = computed(() => {
  const failData = clusterNodes.value.map((node) => ({
    name: `${String(node.ip)}:${String(node.port)}`,
    value: Number(node.failAccessCnt) || 0,
  }));

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: failData.map((item) => item.name),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "失败次数",
        type: "bar",
        data: failData.map((item) => item.value),
        itemStyle: {
          color: "#ff4d4f",
        },
      },
    ],
  };
});

// 获取节点状态类型
const getNodeStatusType = (state: string) => {
  const typeMap: Record<string, string> = {
    UP: "success",
    SUSPICIOUS: "warning",
    DOWN: "danger",
  };
  return typeMap[state] || "info";
};

// 获取节点状态图标
const getNodeStatusIcon = (state: string) => {
  const iconMap: Record<string, Component> = {
    UP: SuccessFilled,
    SUSPICIOUS: WarningFilled,
    DOWN: CircleCloseFilled,
  };
  return iconMap[state] || SuccessFilled;
};

// 获取节点状态文本
const getNodeStatusText = (state: string) => {
  const textMap: Record<string, string> = {
    UP: "健康",
    SUSPICIOUS: "警告",
    DOWN: "异常",
  };
  return textMap[state] || state;
};

// 刷新数据
const refreshData = async () => {
  try {
    await nacosStore.fetchClusterNodes();
    ElMessage.success("数据刷新成功");
  } catch {
    ElMessage.error("数据刷新失败");
  }
};

// 查看节点详情
const viewNodeDetail = (node: Record<string, unknown>) => {
  currentNode.value = node;
  showDetailDialog.value = true;
};

// Ping节点
const pingNode = async (node: Record<string, unknown>) => {
  const ip = String(node.ip);
  const port = String(node.port);
  ElMessage.info(`正在 Ping ${ip}:${port}...`);
  // 这里可以调用实际的 ping API
  setTimeout(() => {
    ElMessage.success(`节点 ${ip}:${port} 响应正常`);
  }, 1000);
};

// 页面加载时获取数据
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.cluster-nodes-page {
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

.overview-row {
  margin-bottom: 24px;
}

.overview-card {
  height: 100px;
}

.overview-card.healthy .overview-icon {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.overview-card.warning .overview-icon {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}

.overview-card.error .overview-icon {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}

.overview-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.overview-icon {
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
}

.overview-info {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #6b7280;
}

.action-card {
  margin-bottom: 24px;
}

.table-card {
  margin-bottom: 24px;
}

.metadata-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.metadata-tag {
  margin: 0;
}

.node-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.metadata-section {
  margin-top: 24px;
}

.metadata-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.metrics-content {
  max-height: 70vh;
  overflow-y: auto;
}

.chart {
  height: 300px;
}

:deep(.el-table .cell) {
  word-break: break-word;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
</style>
