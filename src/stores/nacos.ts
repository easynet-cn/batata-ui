import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  ServiceInfo,
  ServiceInstance,
  ConfigItem,
  Namespace,
} from "@/api/nacos";
import nacosApi from "@/api/nacos";

export const useNacosStore = defineStore("nacos", () => {
  // 状态
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentUser = ref<{ username: string; token: string } | null>(null);

  // 服务管理状态
  const services = ref<ServiceInfo[]>([]);
  const serviceTotal = ref(0);
  const currentService = ref<ServiceInfo | null>(null);
  const serviceInstances = ref<ServiceInstance[]>([]);

  // 配置管理状态
  const configs = ref<ConfigItem[]>([]);
  const configTotal = ref(0);
  const currentConfig = ref<ConfigItem | null>(null);

  // 命名空间状态
  const namespaces = ref<Namespace[]>([]);
  const currentNamespace = ref<string>("public");

  // 集群状态
  const clusterNodes = ref<Record<string, unknown>[]>([]);
  const clusterHealth = ref<Record<string, unknown> | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!currentUser.value);
  const healthyServicesCount = computed(
    () => services.value.filter((s) => s.healthyInstanceCount > 0).length,
  );
  const totalInstancesCount = computed(() =>
    services.value.reduce((sum, s) => sum + s.ipCount, 0),
  );

  // Actions
  async function login(username: string, password: string) {
    try {
      loading.value = true;
      error.value = null;

      const response = await nacosApi.login(username, password);
      const { accessToken } = response.data.data;

      currentUser.value = { username, token: accessToken };
      localStorage.setItem("nacos-token", accessToken);

      return true;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "登录失败";
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    currentUser.value = null;
    localStorage.removeItem("nacos-token");
    // 清空所有数据
    services.value = [];
    configs.value = [];
    namespaces.value = [];
    serviceInstances.value = [];
  }

  async function fetchServices(pageNo = 1, pageSize = 20, groupName?: string) {
    try {
      loading.value = true;
      error.value = null;

      const response = await nacosApi.getServiceList(
        pageNo,
        pageSize,
        groupName,
      );
      services.value = response.data.data.doms;
      serviceTotal.value = response.data.data.count;

      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取服务列表失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchServiceInstances(
    serviceName: string,
    groupName?: string,
  ) {
    try {
      loading.value = true;
      error.value = null;

      const response = await nacosApi.getServiceDetail(serviceName, groupName);
      serviceInstances.value = response.data.data;

      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取服务实例失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchConfigs(
    pageNo = 1,
    pageSize = 20,
    dataId?: string,
    group?: string,
    tenant?: string,
  ) {
    try {
      loading.value = true;
      error.value = null;

      const response = await nacosApi.getConfigList(
        pageNo,
        pageSize,
        dataId,
        group,
        tenant,
      );
      configs.value = response.data.data.pageItems;
      configTotal.value = response.data.data.totalCount;

      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取配置列表失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchConfigContent(
    dataId: string,
    group: string,
    tenant?: string,
  ) {
    try {
      loading.value = true;
      error.value = null;

      const content = await nacosApi.getConfig(dataId, group, tenant);
      return content;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取配置内容失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchNamespaces() {
    try {
      loading.value = true;
      error.value = null;

      const response = await nacosApi.getNamespaceList();
      namespaces.value = response.data.data;

      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取命名空间失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchClusterNodes() {
    try {
      loading.value = true;
      error.value = null;

      const response = await nacosApi.getNodeList();
      clusterNodes.value = response.data.data;

      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "获取集群节点失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteService(serviceName: string, groupName?: string) {
    try {
      loading.value = true;
      error.value = null;

      await nacosApi.deleteService(serviceName, groupName);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "删除服务失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createService(
    serviceName: string,
    groupName?: string,
    metadata?: Record<string, string>,
  ) {
    try {
      loading.value = true;
      error.value = null;

      await nacosApi.createService(serviceName, groupName, metadata);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "创建服务失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteConfig(dataId: string, group: string, tenant?: string) {
    try {
      loading.value = true;
      error.value = null;

      await nacosApi.deleteConfig(dataId, group, tenant);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "删除配置失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function publishConfig(
    dataId: string,
    group: string,
    content: string,
    type?: string,
    tenant?: string,
  ) {
    try {
      loading.value = true;
      error.value = null;

      await nacosApi.publishConfig(dataId, group, content, type, tenant);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "发布配置失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteNamespace(namespaceId: string) {
    try {
      loading.value = true;
      error.value = null;

      await nacosApi.deleteNamespace(namespaceId);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "删除命名空间失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNamespace(
    namespaceId: string,
    namespaceName: string,
    namespaceDesc?: string,
  ) {
    try {
      loading.value = true;
      error.value = null;

      await nacosApi.createNamespace(namespaceId, namespaceName, namespaceDesc);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "创建命名空间失败";
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    // 状态
    loading,
    error,
    currentUser,
    services,
    serviceTotal,
    currentService,
    serviceInstances,
    configs,
    configTotal,
    currentConfig,
    namespaces,
    currentNamespace,
    clusterNodes,
    clusterHealth,

    // 计算属性
    isAuthenticated,
    healthyServicesCount,
    totalInstancesCount,

    // 方法
    login,
    logout,
    fetchServices,
    fetchServiceInstances,
    fetchConfigs,
    fetchConfigContent,
    fetchNamespaces,
    fetchClusterNodes,
    deleteService,
    createService,
    deleteConfig,
    publishConfig,
    deleteNamespace,
    createNamespace,
    clearError,
  };
});
