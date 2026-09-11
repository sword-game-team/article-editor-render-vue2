// @vitest-environment jsdom
import { mount, type Wrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Demo from '../demo/ResourceQuestionDemo.vue'

let wrapper: Wrapper<InstanceType<typeof Demo>>
async function settle() { await nextTick(); await nextTick(); vi.advanceTimersByTime(20); await nextTick() }
beforeEach(() => {
  vi.useFakeTimers()
  wrapper = mount(Demo, { attachTo: document.body })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => window.setTimeout(() => fn(0), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
})
afterEach(() => { wrapper.destroy(); document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Vue 2 host example', () => {
  it('separates delayed business approval from manually requested navigation', async () => {
    const controls = wrapper.findComponent({ name: 'RevealControls' })
    await controls.find('input[type="checkbox"]').setChecked(true)
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    expect(wrapper.vm.pendingNavigation?.targetAnchorId).toBe('basics')
    expect(JSON.parse(controls.find('[aria-label="最近点击的选项属性"]').text())).toEqual({
      id: 'basics', label: '先了解基础', targetAnchorId: 'basics',
    })
    vi.advanceTimersByTime(800); await settle()
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1'])
    expect(document.activeElement?.getAttribute('data-anchor-id')).not.toBe('basics')
    const navigate = controls.findAll('button').wrappers.find((button) => button.text() === '滚动到所选锚点')!
    await navigate.trigger('click'); await settle()
    expect(document.activeElement?.getAttribute('data-anchor-id')).toBe('basics')
  })
  it('lets the host reveal an individual boundary and cancels delayed work when relocking it', async () => {
    const controls = wrapper.findComponent({ name: 'RevealControls' })
    await controls.find('[data-reveal-key="reading-step-1"]').trigger('click')
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(true)
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    await controls.find('[data-relock-key="reading-step-1"]').trigger('click')
    vi.advanceTimersByTime(1000); await settle()
    expect(wrapper.vm.revealedKeys).toEqual([])
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(false)
  })
  it('applies pasted JSON and clears prior progress and pending business work', async () => {
    wrapper.vm.unlockAll()
    await nextTick()
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    const nextArticle = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '导入的新文章' }] }] }
    await wrapper.find('textarea[aria-label="文章 JSON"]').setValue(JSON.stringify(nextArticle))
    await wrapper.findComponent({ name: 'JsonDocumentInput' }).find('button').trigger('click')
    vi.advanceTimersByTime(1000); await settle()
    expect(wrapper.find('article').text()).toBe('导入的新文章')
    expect(wrapper.vm.articleKey).toBe(2)
    expect(wrapper.vm.revealedKeys).toEqual([])
    expect(wrapper.vm.lastEvent).toBe(null)
    expect(wrapper.vm.issues).toEqual([])
  })
  it.each(['{invalid', '{"type":"doc","content":[{"type":"resourceQuestion"}]}'])('preserves the preview and current progress for invalid input %s', async (source) => {
    wrapper.vm.unlockAll(); await nextTick()
    const previousArticle = wrapper.vm.article
    await wrapper.find('textarea[aria-label="文章 JSON"]').setValue(source)
    await wrapper.findComponent({ name: 'JsonDocumentInput' }).find('button').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.vm.article).toBe(previousArticle)
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1', 'reading-step-2'])
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe(source)
  })
  it('restores the original example after importing another article', async () => {
    const input = wrapper.findComponent({ name: 'JsonDocumentInput' })
    await input.find('textarea').setValue('{"type":"doc","content":[]}')
    await input.findAll('button').at(0).trigger('click')
    expect(wrapper.find('article').text()).toBe('')
    await input.findAll('button').at(1).trigger('click')
    expect(wrapper.find('[data-option-id="basics"]').exists()).toBe(true)
    expect(wrapper.vm.revealedKeys).toEqual([])
  })
  it('synchronously reveals and retains the current navigation task', async () => {
    await wrapper.setData({ mode: 'allow' })
    await wrapper.find('[data-option-id="basics"]').trigger('click'); await settle()
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1'])
    expect(document.activeElement?.getAttribute('data-anchor-id')).toBe('basics')
  })
  it('allows only the most recent delayed selection and does not navigate its superseded target', async () => {
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    vi.advanceTimersByTime(400)
    await wrapper.find('[data-option-id="continue"]').trigger('click')
    vi.advanceTimersByTime(400); await settle()
    expect(wrapper.vm.revealedKeys).toEqual([])
    vi.advanceTimersByTime(400); await settle()
    expect(wrapper.vm.revealedKeys).toEqual(['reading-step-1'])
    expect(document.activeElement?.getAttribute('data-anchor-id')).not.toBe('basics')
  })
  it.each(['cancel', 'reset', 'switchArticle'] as const)('ignores delayed results after %s', async (action) => {
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    wrapper.vm[action]()
    vi.advanceTimersByTime(1000); await settle()
    expect(wrapper.vm.revealedKeys).toEqual([])
    expect(wrapper.find('[data-anchor-id="basics"]').exists()).toBe(false)
  })
  it('rejects a selection without revealing content', async () => {
    await wrapper.setData({ mode: 'reject' })
    await wrapper.find('[data-option-id="basics"]').trigger('click'); await settle()
    expect(wrapper.vm.revealedKeys).toEqual([])
    expect(wrapper.vm.status).toContain('拒绝')
  })
  it('clears outstanding business work on unmount', async () => {
    await wrapper.find('[data-option-id="basics"]').trigger('click')
    wrapper.destroy(); vi.advanceTimersByTime(1000); await settle()
    expect(wrapper.vm.revealedKeys).toEqual([])
  })
})
