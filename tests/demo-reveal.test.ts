// @vitest-environment jsdom
import { mount, type Wrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Demo from '../demo/App.vue'
import example from '../examples/resource-question.json'

let wrapper: Wrapper<InstanceType<typeof Demo>>
beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  wrapper = mount(Demo, { attachTo: document.body })
})
afterEach(() => { wrapper.destroy(); document.body.innerHTML = ''; vi.restoreAllMocks(); vi.useRealTimers() })

describe('main demo reveal example', () => {
  it('reveals immediately but waits for the manual scroll button when the callback is enabled', async () => {
    const controls = wrapper.findComponent({ name: 'RevealControls' })
    await controls.find('button').trigger('click')
    await controls.find('input[type="checkbox"]').setChecked(true)
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    await nextTick(); vi.advanceTimersByTime(100); await nextTick()
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1'])
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(true)
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(wrapper.vm.pendingNavigation?.targetAnchorId).toBe('basics')
    const navigate = controls.findAll('button').wrappers.find((button) => button.text() === '滚动到所选锚点')!
    await navigate.trigger('click'); await nextTick(); vi.advanceTimersByTime(100); await nextTick()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.pendingNavigation).toBeNull()
  })
  it('loads the example, reveals on a real option click, and can hide each boundary again', async () => {
    const controls = wrapper.findComponent({ name: 'RevealControls' })
    await controls.find('button').trigger('click')
    const original = JSON.stringify(wrapper.vm.article)
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(false)
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1'])
    expect(controls.find('[data-last-reveal-key]').text()).toBe('reading-step-1')
    expect(JSON.parse(controls.find('[aria-label="最近点击的选项属性"]').text())).toEqual({
      id: 'basics', label: '先了解基础', targetAnchorId: 'basics',
    })
    expect(controls.find('[aria-label="当前 revealedKeys"]').text()).toContain('reading-step-1')
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(true)
    expect(wrapper.find('[data-anchor-id="summary"]').exists()).toBe(false)
    await controls.find('[data-reveal-key="reading-step-2"]').trigger('click')
    expect(wrapper.find('[data-anchor-id="summary"]').exists()).toBe(true)
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1', 'reading-step-2'])
    await controls.find('[data-relock-key="reading-step-1"]').trigger('click')
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-2'])
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(false)
    expect(wrapper.find('[data-anchor-id="summary"]').exists()).toBe(false)
    expect(JSON.stringify(wrapper.vm.article)).toBe(original)
  })

  it('supports imported question JSON and clears reveal state when another article is applied', async () => {
    const input = wrapper.findComponent({ name: 'JsonDocumentInput' })
    await input.find('textarea').setValue(JSON.stringify(example))
    await input.find('button').trigger('click')
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1'])
    await input.find('textarea').setValue(JSON.stringify(example))
    await input.find('button').trigger('click')
    await nextTick()
    expect(wrapper.vm.revealedKeys).toEqual([])
    expect(wrapper.vm.lastOption).toBeNull()
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(false)
  })
})
