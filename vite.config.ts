import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
      minify: 'terser',
      cssMinify: 'lightningcss',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunk splitting
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
                return 'vue-vendor'
              }
              if (id.includes('lucide')) {
                return 'icons'
              }
              if (id.includes('axios')) {
                return 'http'
              }
              return 'vendor'
            }
          },
          // Asset file naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/nacos': {
          target: 'http://localhost:8848',
          changeOrigin: true,
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
      include: ['vue', 'vue-router', 'pinia', 'axios', 'lucide-vue-next'],
    },
  }
})
