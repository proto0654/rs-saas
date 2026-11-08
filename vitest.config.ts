import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ test: { projects: [
  { plugins: [vue()], resolve: { alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) } }, test: { name: 'unit', environment: 'node', include: ['demo/**/*.test.mjs', 'tests/unit/**/*.test.ts'] } },
  await defineVitestProject({ test: { name: 'nuxt', environment: 'nuxt', hookTimeout: 60000, include: ['tests/nuxt/**/*.nuxt.spec.ts'] } }),
] } })
