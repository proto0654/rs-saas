import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BotPanel from '../../app/components/BotPanel.vue'

describe('owner bot controls', () => {
  it('offers a simulated token and emits the control action', async () => {
    const wrapper = await mountSuspended(BotPanel, { props: { bot: { active: false, token: 'demo_example' } } })
    expect(wrapper.text()).toContain('Остановлен')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })
})
