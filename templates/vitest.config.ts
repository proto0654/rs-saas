import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      { test: {
        name: 'unit', environment: 'node',
        include: ['demo/**/*.test.mjs', 'tests/unit/**/*.test.ts'],
      } },
      await defineVitestProject({ test: {
        name: 'nuxt', environment: 'nuxt',
        include: ['tests/nuxt/**/*.nuxt.spec.ts'],
      } }),
    ],
  },
})
