import { describe, expect, it, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppShell from '../../app/components/AppShell.vue'

afterEach(() => {
  localStorage.removeItem('lokal-theme')
  document.documentElement.dataset.theme = 'mesto'
})

describe('theme switcher', () => {
  it('switches themes and restores the saved choice on remount', async () => {
    localStorage.removeItem('lokal-theme')
    const shell = await mountSuspended(AppShell, { route: '/search' })
    expect(document.documentElement.dataset.theme).toBe('mesto')
    await shell.get('button[aria-label="Включить светлую тему"]').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('mesto-light')
    expect(localStorage.getItem('lokal-theme')).toBe('light')
    shell.unmount()

    const restored = await mountSuspended(AppShell, { route: '/search' })
    expect(restored.find('button[aria-label="Включить тёмную тему"]').exists()).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('mesto-light')
    await restored.get('button[aria-label="Включить тёмную тему"]').trigger('click')
    expect(localStorage.getItem('lokal-theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('mesto')
    restored.unmount()
  })
})
