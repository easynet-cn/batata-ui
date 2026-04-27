<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex items-center gap-1 text-sm">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1">
        <!-- Separator (not for the first item) -->
        <ChevronRight
          v-if="index > 0"
          :size="14"
          class="text-gray-400 dark:text-gray-600 shrink-0"
        />

        <!-- Link item (not the last one) -->
        <router-link
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium transition-colors"
        >
          <component :is="item.icon" v-if="item.icon" :size="14" class="shrink-0" />
          <span>{{ item.label }}</span>
        </router-link>

        <!-- Current page (last item, not a link) -->
        <span
          v-else
          class="inline-flex items-center gap-1.5 font-bold"
          :class="
            index < items.length - 1
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-gray-100'
          "
        >
          <component :is="item.icon" v-if="item.icon" :size="14" class="shrink-0" />
          <span>{{ item.label }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { type Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

defineProps<{
  items: Array<{
    label: string
    to?: string
    icon?: Component
  }>
}>()
</script>
