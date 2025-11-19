<template>
  <el-container class="nacos-layout">
    <el-aside width="250px" class="sidebar">
      <div class="logo">
        <h2>Nacos 控制台</h2>
        <span class="version">v3.1.0</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="nacos-menu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#1890ff"
      >
        <el-sub-menu index="service">
          <template #title>
            <el-icon><Service /></el-icon>
            <span>服务管理</span>
          </template>
          <el-menu-item index="/services">
            <el-icon><List /></el-icon>
            <span>服务列表</span>
          </el-menu-item>
          <el-menu-item index="/service-detail">
            <el-icon><View /></el-icon>
            <span>服务详情</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="config">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>配置管理</span>
          </template>
          <el-menu-item index="/configs">
            <el-icon><Document /></el-icon>
            <span>配置列表</span>
          </el-menu-item>
          <el-menu-item index="/config-editor">
            <el-icon><Edit /></el-icon>
            <span>配置编辑</span>
          </el-menu-item>
          <el-menu-item index="/config-history">
            <el-icon><Clock /></el-icon>
            <span>历史版本</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="namespace">
          <template #title>
            <el-icon><Folder /></el-icon>
            <span>命名空间</span>
          </template>
          <el-menu-item index="/namespaces">
            <el-icon><Collection /></el-icon>
            <span>命名空间列表</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="cluster">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>集群管理</span>
          </template>
          <el-menu-item index="/cluster-nodes">
            <el-icon><Monitor /></el-icon>
            <span>节点列表</span>
          </el-menu-item>
          <el-menu-item index="/cluster-health">
            <el-icon><TrendCharts /></el-icon>
            <span>健康状态</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/permissions">
          <el-icon><Lock /></el-icon>
          <span>权限管理</span>
        </el-menu-item>

        <el-menu-item index="/system">
          <el-icon><Tools /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="breadcrumbItems.length > 0">
              {{ breadcrumbItems[0] }}
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="breadcrumbItems.length > 1">
              {{ breadcrumbItems[1] }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ nacosStore.currentUser?.username || "未登录" }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item divided command="logout"
                  >退出登录</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <div v-if="nacosStore.loading" class="loading-container">
          <el-loading-directive />
        </div>

        <el-alert
          v-if="nacosStore.error"
          :title="nacosStore.error"
          type="error"
          show-icon
          @close="nacosStore.clearError"
        />

        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNacosStore } from "@/stores/nacos";
import {
  Service,
  List,
  View,
  Setting,
  Document,
  Edit,
  Clock,
  Folder,
  Collection,
  Connection,
  Monitor,
  TrendCharts,
  Lock,
  Tools,
  User,
  ArrowDown,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const nacosStore = useNacosStore();

const activeMenu = computed(() => route.path);
const breadcrumbItems = ref<string[]>([]);

// 监听路由变化更新面包屑
watch(
  () => route.path,
  (newPath) => {
    const pathMap: Record<string, string[]> = {
      "/services": ["服务管理", "服务列表"],
      "/service-detail": ["服务管理", "服务详情"],
      "/configs": ["配置管理", "配置列表"],
      "/config-editor": ["配置管理", "配置编辑"],
      "/config-history": ["配置管理", "历史版本"],
      "/namespaces": ["命名空间", "命名空间列表"],
      "/cluster-nodes": ["集群管理", "节点列表"],
      "/cluster-health": ["集群管理", "健康状态"],
      "/permissions": ["权限管理"],
      "/system": ["系统设置"],
    };

    breadcrumbItems.value = pathMap[newPath] || [];
  },
  { immediate: true },
);

const handleCommand = (command: string) => {
  switch (command) {
    case "profile":
      // 跳转到个人信息页面
      break;
    case "settings":
      // 跳转到设置页面
      break;
    case "logout":
      nacosStore.logout();
      router.push("/login");
      break;
  }
};
</script>

<style scoped>
.nacos-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
}

.logo {
  padding: 16px;
  text-align: center;
  color: white;
  border-bottom: 1px solid #1f2937;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.version {
  font-size: 12px;
  color: #6b7280;
}

.nacos-menu {
  border-right: none;
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f3f4f6;
}

.main-content {
  background-color: #f5f5f5;
  padding: 24px;
  position: relative;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
}

:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}
</style>
