// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BotPanel from '../../app/components/BotPanel.vue'

describe('personal bot panel', () => {
  it('offers creation and then controls for a simulated bot', async () => {
    const wrapper = mount(BotPanel)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
    await wrapper.setProps({ bot: { active: true, token: 'demo_example' } })
    expect(wrapper.text()).toContain('Включён')
    expect(wrapper.text()).toContain('вымышленный токен')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })
})
