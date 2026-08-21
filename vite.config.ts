import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8848'
  const consulProxyTarget = env.VITE_CONSUL_PROXY_TARGET || 'http://localhost:8500'
  const apolloProxyTarget = env.VITE_APOLLO_PROXY_TARGET || 'http://localhost:8080'

  const plugins: PluginOption[] = [
    vue(),
    vueDevTools(),
    tailwindcss(),

    // Auto import Vue APIs
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          '@vueuse/core': ['useDebounceFn', 'useThrottleFn', 'useLocalStorage'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/utils'],
      vueTemplate: true,
    }),

    // Auto import components
    Components({
      dirs: ['src/components'],
      dts: 'src/components.d.ts',
      include: [/\.vue$/, /\.vue\?vue/],
    }),
  ]

  // Gzip compression for production
  if (mode === 'production') {
    plugins.push(
      compression({
        include: /\.(js|css|html|svg|json)$/,
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
    )
  }

  // Bundle analyzer (only when ANALYZE env is set)
  if (process.env.ANALYZE) {
    plugins.push(
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    )
  }

  return {
    plugins,

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    build: {
      target: 'esnext',
      sourcemap: mode !== 'production',
      rolldownOptions: {
        output: {
          // Vite 8 uses codeSplitting (Rolldown) instead of manualChunks (Rollup)
          codeSplitting: {
            groups: [
              {
                name: 'vue-vendor',
                test: /node_modules[\\/](vue|pinia|vue-router)/,
                priority: 20,
              },
              {
                name: 'echarts',
                test: /node_modules[\\/](echarts|zrender)/,
                priority: 15,
              },
              {
                name: 'codemirror',
                test: /node_modules[\\/](@codemirror|codemirror|@lezer)/,
                priority: 15,
              },
              {
                name: 'icons',
                test: /node_modules[\\/](@lucide|lucide)/,
                priority: 15,
              },
              {
                name: 'http',
                test: /node_modules[\\/]axios/,
                priority: 15,
              },
              {
                name: 'validation',
                test: /node_modules[\\/]zod/,
                priority: 15,
              },
              {
                name: 'vendor',
                test: /node_modules/,
                priority: 10,
              },
            ],
          },
          // Asset file naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 500,
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/v3': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/consul-api': {
          target: consulProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/consul-api/, ''),
        },
        '/apollo-api': {
          target: apolloProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/apollo-api/, ''),
        },
      },
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', '@lucide/vue'],
    },
  }
})
