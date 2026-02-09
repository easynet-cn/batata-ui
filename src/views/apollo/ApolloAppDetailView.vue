<template>
  <div class="space-y-6">
    <!-- Breadcrumb / Back -->
    <div class="flex items-center gap-2 text-sm">
      <RouterLink
        to="/apps"
        class="text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1"
      >
        <ArrowLeft :size="14" />
        {{ t('apolloBackToApps') }}
      </RouterLink>
    </div>

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ currentApp?.name || appId }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloAppId') }}: {{ appId }}
          <template v-if="currentApp?.orgName"> &middot; {{ currentApp.orgName }} </template>
          <template v-if="currentApp?.ownerName"> &middot; {{ currentApp.ownerName }} </template>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="refreshData"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button
          @click="showCreateClusterModal = true"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloCreateCluster') }}
        </button>
        <button
          @click="showCreateNamespaceModal = true"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloCreateNamespace') }}
        </button>
      </div>
    </div>

    <!-- Tab Bar -->
    <div
      class="flex items-center gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 inline-flex"
    >
      <button
        @click="activeTab = 'environments'"
        :class="[
          'px-4 py-2 text-sm font-bold rounded-xl transition-all',
          activeTab === 'environments'
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
      >
        {{ t('apolloEnvClusters') }}
      </button>
      <button
        @click="activeTab = 'permissions'"
        :class="[
          'px-4 py-2 text-sm font-bold rounded-xl transition-all',
          activeTab === 'permissions'
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
      >
        {{ t('apolloPermissions') }}
      </button>
      <button
        @click="activeTab = 'accesskeys'"
        :class="[
          'px-4 py-2 text-sm font-bold rounded-xl transition-all',
          activeTab === 'accesskeys'
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
      >
        {{ t('apolloAccessKeys') }}
      </button>
    </div>

    <!-- Permissions Tab -->
    <div
      v-if="activeTab === 'permissions'"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('apolloAppPermissions') }}
      </h3>

      <div
        v-if="!portalStore.appRoleUsers && !permLoading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Shield :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('noData') }}</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Master Users -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('apolloMasterUsers') }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="user in portalStore.appRoleUsers?.masterUsers || []"
              :key="`master-${user}`"
              class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ user }}</span>
              <button
                @click="handleRemoveRole(user, 'master')"
                class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <X :size="12" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="addMasterUser"
              :placeholder="t('apolloAddUserPlaceholder')"
              class="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              @keyup.enter="
                handleAssignRole(addMasterUser, 'master')
                addMasterUser = ''
              "
            />
            <button
              @click="
                handleAssignRole(addMasterUser, 'master')
                addMasterUser = ''
              "
              class="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
            >
              <Plus :size="14" />
            </button>
          </div>
        </div>

        <!-- Modify Users -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('apolloModifyUsers') }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="user in portalStore.appRoleUsers?.modifyUsers || []"
              :key="`modify-${user}`"
              class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ user }}</span>
              <button
                @click="handleRemoveRole(user, 'modify')"
                class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <X :size="12" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="addModifyUser"
              :placeholder="t('apolloAddUserPlaceholder')"
              class="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              @keyup.enter="
                handleAssignRole(addModifyUser, 'modify')
                addModifyUser = ''
              "
            />
            <button
              @click="
                handleAssignRole(addModifyUser, 'modify')
                addModifyUser = ''
              "
              class="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
            >
              <Plus :size="14" />
            </button>
          </div>
        </div>

        <!-- Release Users -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('apolloReleaseUsers') }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="user in portalStore.appRoleUsers?.releaseUsers || []"
              :key="`release-${user}`"
              class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ user }}</span>
              <button
                @click="handleRemoveRole(user, 'release')"
                class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <X :size="12" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="addReleaseUser"
              :placeholder="t('apolloAddUserPlaceholder')"
              class="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              @keyup.enter="
                handleAssignRole(addReleaseUser, 'release')
                addReleaseUser = ''
              "
            />
            <button
              @click="
                handleAssignRole(addReleaseUser, 'release')
                addReleaseUser = ''
              "
              class="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
            >
              <Plus :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Access Keys Tab -->
    <div
      v-if="activeTab === 'accesskeys'"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ t('apolloAccessKeys') }}
        </h3>
        <div class="flex items-center gap-3">
          <select
            v-model="akEnv"
            @change="refreshAccessKeys"
            class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            <option v-for="ec in apolloStore.envClusters" :key="ec.env" :value="ec.env">
              {{ ec.env }}
            </option>
          </select>
          <button
            @click="handleCreateAccessKey"
            class="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus :size="12" />
            {{ t('apolloCreateAccessKey') }}
          </button>
        </div>
      </div>

      <div
        v-if="portalStore.accessKeys.length === 0 && !akLoading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <KeyRound :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('apolloNoAccessKeys') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloKey') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloAccessKeySecret') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('status') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ak in portalStore.accessKeys" :key="ak.id">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-mono text-gray-900 dark:text-gray-100"
              >
                {{ ak.key || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-mono text-gray-600 dark:text-gray-400"
              >
                {{ ak.secret ? '••••••••' : '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <span
                  :class="[
                    'px-2.5 py-1 text-xs font-bold rounded-lg',
                    ak.enabled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
                  ]"
                >
                  {{ ak.enabled ? t('enabled') : t('disabled') }}
                </span>
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <button
                    @click="toggleAccessKey(ak)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                    :class="
                      ak.enabled
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    "
                  >
                    {{ ak.enabled ? t('disable') : t('enable') }}
                  </button>
                  <button
                    @click="handleDeleteAccessKey(ak)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Environments & Clusters -->
    <div
      v-if="activeTab === 'environments'"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('apolloEnvClusters') }}
      </h3>

      <div
        v-if="apolloStore.envClusters.length === 0 && !loading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Layers :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('noData') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="ec in apolloStore.envClusters"
          :key="ec.env"
          class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
        >
          <!-- Env Header -->
          <div
            class="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between cursor-pointer"
            @click="toggleEnv(ec.env)"
          >
            <div class="flex items-center gap-2">
              <ChevronRight
                :size="16"
                :class="[
                  'text-gray-400 transition-transform',
                  expandedEnvs.has(ec.env) && 'rotate-90',
                ]"
              />
              <span
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
              >
                {{ ec.env }}
              </span>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ ec.clusters.length }} {{ t('apolloClusters').toLowerCase() }}
              </span>
            </div>
          </div>

          <!-- Clusters -->
          <div
            v-if="expandedEnvs.has(ec.env)"
            class="divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div
              v-for="cluster in ec.clusters"
              :key="`${ec.env}-${cluster}`"
              class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
                >
                  <Server :size="14" class="text-orange-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ cluster }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ec.env }} / {{ cluster }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="viewNamespaces(ec.env, cluster)"
                  class="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                >
                  {{ t('apolloViewNamespace') }}
                </button>
                <button
                  v-if="cluster !== 'default'"
                  @click="confirmDeleteCluster(ec.env, cluster)"
                  class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  :title="t('apolloDeleteCluster')"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Namespaces (shown when env/cluster is selected) -->
    <div
      v-if="activeTab === 'environments' && selectedEnv && selectedCluster"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ t('apolloNamespaces') }} — {{ selectedEnv }} / {{ selectedCluster }}
        </h3>
      </div>

      <div
        v-if="apolloStore.namespaces.length === 0 && !nsLoading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Layers :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('apolloNoNamespaces') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloNamespace') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloFormat') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('type') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ns in apolloStore.namespaces" :key="ns.namespaceName">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <RouterLink
                  :to="`/namespace/${appId}/${selectedEnv}/${selectedCluster}/${ns.namespaceName}`"
                  class="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {{ ns.namespaceName }}
                </RouterLink>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                <span
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  {{ ns.format }}
                </span>
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <span
                  :class="[
                    'px-2.5 py-1 text-xs font-bold rounded-lg',
                    ns.isPublic
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  ]"
                >
                  {{ ns.isPublic ? t('apolloPublic') : t('apolloPrivate') }}
                </span>
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <RouterLink
                    :to="`/namespace/${appId}/${selectedEnv}/${selectedCluster}/${ns.namespaceName}`"
                    class="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                  >
                    {{ t('viewDetails') }}
                  </RouterLink>
                  <button
                    @click="confirmDeleteNamespace(ns.namespaceName)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('apolloDeleteNamespace')"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Cluster Modal -->
    <template v-if="showCreateClusterModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showCreateClusterModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateClusterModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloCreateCluster') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloEnvironment') }}
              </label>
              <input
                v-model="clusterForm.env"
                placeholder="DEV"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('name') }}
              </label>
              <input
                v-model="clusterForm.name"
                :placeholder="t('apolloClusterNamePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showCreateClusterModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleCreateCluster"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Cluster Modal -->
    <template v-if="showDeleteClusterModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteClusterModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteClusterModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloDeleteCluster') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmDeleteCluster') }}
            </p>
            <p class="text-xs text-red-600 dark:text-red-400 mt-2">
              {{ t('apolloDeleteClusterWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteClusterModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDeleteCluster"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Namespace Modal -->
    <template v-if="showDeleteNamespaceModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteNamespaceModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteNamespaceModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloDeleteNamespace') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmDeleteNamespace') }}
            </p>
            <p class="text-xs text-red-600 dark:text-red-400 mt-2">
              {{ t('apolloDeleteNamespaceWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteNamespaceModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDeleteNamespace"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Namespace Modal -->
    <template v-if="showCreateNamespaceModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showCreateNamespaceModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateNamespaceModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloCreateNamespace') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('name') }}
              </label>
              <input
                v-model="nsForm.name"
                :placeholder="t('apolloNamespaceNamePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloFormat') }}
              </label>
              <select
                v-model="nsForm.format"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="properties">properties</option>
                <option value="yaml">yaml</option>
                <option value="json">json</option>
                <option value="xml">xml</option>
                <option value="yml">yml</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                v-model="nsForm.isPublic"
                class="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
              />
              <label for="isPublic" class="text-sm text-gray-700 dark:text-gray-300">
                {{ t('apolloPublic') }}
              </label>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showCreateNamespaceModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleCreateNamespace"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Layers,
  Server,
  ChevronRight,
  Trash2,
  X,
  Shield,
  KeyRound,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import { useApolloPortalStore } from '@/stores/apollo-portal'
import type { ApolloNamespaceFormat, ApolloRoleType, ApolloAccessKey } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const route = useRoute()
const apolloStore = useApolloStore()
const portalStore = useApolloPortalStore()

const appId = route.params.appId as string
const currentApp = ref(apolloStore.currentApp)
const loading = ref(false)
const nsLoading = ref(false)
const permLoading = ref(false)
const akLoading = ref(false)

const activeTab = ref<'environments' | 'permissions' | 'accesskeys'>('environments')
const addMasterUser = ref('')
const addModifyUser = ref('')
const addReleaseUser = ref('')
const akEnv = ref('')

watch(activeTab, async (tab) => {
  if (tab === 'permissions') {
    permLoading.value = true
    try {
      await portalStore.fetchAppRoleUsers(appId)
    } catch (err) {
      logger.error('Failed to fetch role users:', err)
    } finally {
      permLoading.value = false
    }
  } else if (tab === 'accesskeys') {
    const firstCluster = apolloStore.envClusters[0]
    if (!akEnv.value && firstCluster) {
      akEnv.value = firstCluster.env
    }
    if (akEnv.value) {
      await refreshAccessKeys()
    }
  }
})

async function handleAssignRole(userId: string, roleType: ApolloRoleType) {
  if (!userId.trim()) return
  try {
    await portalStore.assignAppRole(appId, userId.trim(), roleType)
    await portalStore.fetchAppRoleUsers(appId)
  } catch (err) {
    logger.error('Failed to assign role:', err)
  }
}

async function handleRemoveRole(userId: string, roleType: ApolloRoleType) {
  try {
    await portalStore.removeAppRole(appId, userId, roleType)
    await portalStore.fetchAppRoleUsers(appId)
  } catch (err) {
    logger.error('Failed to remove role:', err)
  }
}

async function refreshAccessKeys() {
  if (!akEnv.value) return
  akLoading.value = true
  try {
    await portalStore.fetchAccessKeys(appId, akEnv.value)
  } catch (err) {
    logger.error('Failed to fetch access keys:', err)
  } finally {
    akLoading.value = false
  }
}

async function handleCreateAccessKey() {
  if (!akEnv.value) return
  try {
    await portalStore.createAccessKey(appId, akEnv.value)
    await refreshAccessKeys()
  } catch (err) {
    logger.error('Failed to create access key:', err)
  }
}

async function toggleAccessKey(ak: ApolloAccessKey) {
  if (!ak.id || !akEnv.value) return
  try {
    if (ak.enabled) {
      await portalStore.disableAccessKey(appId, akEnv.value, ak.id)
    } else {
      await portalStore.enableAccessKey(appId, akEnv.value, ak.id)
    }
    await refreshAccessKeys()
  } catch (err) {
    logger.error('Failed to toggle access key:', err)
  }
}

async function handleDeleteAccessKey(ak: ApolloAccessKey) {
  if (!ak.id || !akEnv.value) return
  try {
    await portalStore.deleteAccessKey(appId, akEnv.value, ak.id)
    await refreshAccessKeys()
  } catch (err) {
    logger.error('Failed to delete access key:', err)
  }
}

const expandedEnvs = ref<Set<string>>(new Set())
const selectedEnv = ref('')
const selectedCluster = ref('')

const showCreateClusterModal = ref(false)
const showCreateNamespaceModal = ref(false)
const showDeleteClusterModal = ref(false)
const showDeleteNamespaceModal = ref(false)
const deleteClusterTarget = ref<{ env: string; name: string } | null>(null)
const deleteNamespaceTarget = ref<string | null>(null)

const clusterForm = ref({ env: '', name: '' })
const nsForm = ref<{ name: string; format: ApolloNamespaceFormat; isPublic: boolean }>({
  name: '',
  format: 'properties',
  isPublic: false,
})

function toggleEnv(env: string) {
  if (expandedEnvs.value.has(env)) {
    expandedEnvs.value.delete(env)
  } else {
    expandedEnvs.value.add(env)
  }
}

async function viewNamespaces(env: string, cluster: string) {
  selectedEnv.value = env
  selectedCluster.value = cluster
  nsLoading.value = true
  try {
    await apolloStore.fetchNamespaces(env, appId, cluster)
  } catch (err) {
    logger.error('Failed to fetch namespaces:', err)
  } finally {
    nsLoading.value = false
  }
}

async function refreshData() {
  loading.value = true
  try {
    await Promise.allSettled([apolloStore.fetchApp(appId), apolloStore.fetchEnvClusters(appId)])
    currentApp.value = apolloStore.currentApp
    // Expand all envs by default
    apolloStore.envClusters.forEach((ec) => expandedEnvs.value.add(ec.env))
  } catch (err) {
    logger.error('Failed to fetch app detail:', err)
  } finally {
    loading.value = false
  }
}

async function handleCreateCluster() {
  try {
    await apolloStore.createCluster(appId, clusterForm.value.env, {
      name: clusterForm.value.name,
    })
    await apolloStore.fetchEnvClusters(appId)
    showCreateClusterModal.value = false
    clusterForm.value = { env: '', name: '' }
  } catch (err) {
    logger.error('Failed to create cluster:', err)
  }
}

function confirmDeleteCluster(env: string, clusterName: string) {
  deleteClusterTarget.value = { env, name: clusterName }
  showDeleteClusterModal.value = true
}

async function handleDeleteCluster() {
  if (!deleteClusterTarget.value) return
  try {
    await apolloStore.deleteCluster(
      deleteClusterTarget.value.env,
      appId,
      deleteClusterTarget.value.name,
      'admin',
    )
    await apolloStore.fetchEnvClusters(appId)
    showDeleteClusterModal.value = false
    deleteClusterTarget.value = null
  } catch (err) {
    logger.error('Failed to delete cluster:', err)
  }
}

function confirmDeleteNamespace(namespaceName: string) {
  deleteNamespaceTarget.value = namespaceName
  showDeleteNamespaceModal.value = true
}

async function handleDeleteNamespace() {
  if (!deleteNamespaceTarget.value || !selectedEnv.value || !selectedCluster.value) return
  try {
    await apolloStore.deleteNamespace(
      appId,
      selectedEnv.value,
      selectedCluster.value,
      deleteNamespaceTarget.value,
      'admin',
    )
    await apolloStore.fetchNamespaces(selectedEnv.value, appId, selectedCluster.value)
    showDeleteNamespaceModal.value = false
    deleteNamespaceTarget.value = null
  } catch (err) {
    logger.error('Failed to delete namespace:', err)
  }
}

async function handleCreateNamespace() {
  try {
    await apolloStore.createNamespace(appId, {
      name: nsForm.value.name,
      appId,
      format: nsForm.value.format,
      isPublic: nsForm.value.isPublic,
    })
    // Refresh namespaces if viewing a cluster
    if (selectedEnv.value && selectedCluster.value) {
      await apolloStore.fetchNamespaces(selectedEnv.value, appId, selectedCluster.value)
    }
    showCreateNamespaceModal.value = false
    nsForm.value = { name: '', format: 'properties', isPublic: false }
  } catch (err) {
    logger.error('Failed to create namespace:', err)
  }
}

onMounted(() => {
  refreshData()
})
</script>
