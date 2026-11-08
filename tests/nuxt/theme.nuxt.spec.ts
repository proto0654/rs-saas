import { describe, expect, it, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppShell from '../../app/components/AppShell.vue'

afterEach(() => {
  localStorage.removeItem('lokal-theme')
  document.documentElement.style.colorScheme = ''
  document.body.style.background = ''
})

describe('theme switcher', () => {
  it('switches themes on the shell wrapper and restores the saved choice on remount', async () => {
    localStorage.removeItem('lokal-theme')
    const shell = await mountSuspended(AppShell, { route: '/search' })
    expect(shell.get('.app-shell').classes()).toContain('theme-dark')
    expect(shell.get('.app-shell').attributes('data-theme')).toBe('mesto')
    await shell.get('button[aria-label="Включить светлую тему"]').trigger('click')
    expect(shell.get('.app-shell').classes()).toContain('theme-light')
    expect(shell.get('.app-shell').attributes('data-theme')).toBe('mesto-light')
    expect(localStorage.getItem('lokal-theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
    shell.unmount()

    const restored = await mountSuspended(AppShell, { route: '/search' })
    expect(restored.find('button[aria-label="Включить тёмную тему"]').exists()).toBe(true)
    expect(restored.get('.app-shell').classes()).toContain('theme-light')
    await restored.get('button[aria-label="Включить тёмную тему"]').trigger('click')
    expect(localStorage.getItem('lokal-theme')).toBe('dark')
    expect(restored.get('.app-shell').classes()).toContain('theme-dark')
    expect(restored.get('.app-shell').attributes('data-theme')).toBe('mesto')
    restored.unmount()
  })
})
