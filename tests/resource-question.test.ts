// @vitest-environment jsdom
import Vue, { nextTick, type VNodeData } from 'vue'
import { mount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArticleContentRenderer, { getVisibleContent, validateArticleDocument, type ArticleDocument, type ArticleRendererRuntime, type ResourceQuestionSelectEvent, type ResourceQuestionNavigationRequest } from '../src'
import { article, freezeDeep, paragraph, question } from './resource-fixtures'

const wrappers: Wrapper<Vue>[] = []
function render(document: unknown = article(), props: Record<string, unknown> = {}, listeners: VNodeData['on'] = {}, slots?: VNodeData['scopedSlots']) {
  const state = Vue.observable({ props: { document, ...props } })
  let runtime: ArticleRendererRuntime | undefined
  const selected = vi.fn()
  const errors = vi.fn()
  const wrapper = mount(Vue.extend({ render(h) {
    return h('article', [h(ArticleContentRenderer, {
      props: state.props,
      on: { 'option-select': selected, 'render-error': errors, 'renderer-ready': (api: ArticleRendererRuntime) => { runtime = api }, ...listeners },
      scopedSlots: slots,
    })])
  } }), { attachTo: documentBody() })
  wrappers.push(wrapper)
  return { wrapper, selected, errors, cancel: () => runtime!.cancelPendingNavigation(),
    async update(props: Record<string, unknown>) { Object.entries(props).forEach(([key, value]) => Vue.set(state.props, key, value)); await nextTick() },
  }
}
function documentBody() { return document.body }
async function layout() { await nextTick(); await nextTick(); vi.advanceTimersByTime(20); await nextTick() }

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => window.setTimeout(() => fn(0), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
})
afterEach(() => { wrappers.splice(0).forEach((w) => w.destroy()); document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('option selection payload', () => {
  it.each([undefined, 'last', 'deleted'])('returns the option attributes on every click with target %s', async (target) => {
    const q = question('one', target)
    q.attrs.options[0].label = '<b>Saved option</b>'
    const result = render(freezeDeep({ type: 'doc', content: [q, paragraph('last')] }))
    await result.wrapper.find('button').trigger('click')
    await result.wrapper.find('button').trigger('click')
    expect(result.selected).toHaveBeenCalledTimes(2)
    const event: ResourceQuestionSelectEvent = result.selected.mock.lastCall![0]
    expect(event.option).toEqual(q.attrs.options[0])
    expect(event.option.id).toBe(event.optionId)
    expect(event.option.targetAnchorId).toBe(event.targetAnchorId)
    expect(result.wrapper.find('b').exists()).toBe(false)
    await result.update({ scrollOffset: 12 }); await layout()
    expect(result.selected).toHaveBeenCalledTimes(2)
    expect(result.wrapper.find('[data-anchor-id="last"]').exists()).toBe(false)
  })

  it('keeps returned attributes immutable and detached from later document edits', async () => {
    const q = question('one', 'last')
    const result = render({ type: 'doc', content: [q, paragraph('last')] })
    await result.wrapper.find('[data-option-id="stable-a"]').trigger('click')
    const event: ResourceQuestionSelectEvent = result.selected.mock.lastCall![0]
    expect(event.option).not.toBe(q.attrs.options[0])
    expect(Object.isFrozen(event)).toBe(true)
    expect(Object.isFrozen(event.option)).toBe(true)
    expect(Reflect.set(event.option, 'label', 'Attempted mutation')).toBe(false)
    expect(q.attrs.options[0].label).toBe('Same label')
    q.attrs.options[0].label = 'Updated label'
    q.attrs.options.reverse()
    await nextTick()
    expect(event.option.label).toBe('Same label')
    await result.wrapper.find('[data-option-id="stable-a"]').trigger('click')
    expect(result.selected.mock.lastCall![0].option).toEqual({ id: 'stable-a', label: 'Updated label', targetAnchorId: 'last' })
  })
})

describe('host-controlled anchor navigation', () => {
  it('waits for scrollToAnchor even after the target is visible and unrelated rerenders occur', async () => {
    let request!: ResourceQuestionNavigationRequest
    const callback = vi.fn((value: ResourceQuestionNavigationRequest) => { request = value })
    const result = render(freezeDeep(article()), { onAnchorNavigate: callback })
    await result.wrapper.find('button').trigger('click')
    expect(result.selected).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(request).toEqual(expect.objectContaining({ questionId: 'one', resourceId: 'shared-resource', optionId: 'stable-a', revealKey: 'reveal-one', targetAnchorId: 'last', option: { id: 'stable-a', label: 'Same label', targetAnchorId: 'last' } }))
    expect(Object.isFrozen(request)).toBe(true)
    await result.update({ revealedKeys: ['reveal-one', 'reveal-two'] }); await layout()
    await result.update({ scrollOffset: 10 }); await layout()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).not.toHaveBeenCalled()
    request.scrollToAnchor(); request.scrollToAnchor(); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(result.wrapper.find('[data-anchor-id="last"]').element)
    request.scrollToAnchor(); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('supports an immediate callback and waits for all hidden boundaries without auto-revealing', async () => {
    const result = render(article(), { onAnchorNavigate: (request: ResourceQuestionNavigationRequest) => request.scrollToAnchor() })
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(result.wrapper.find('[data-anchor-id="middle"]').exists()).toBe(false)
    expect(window.scrollTo).not.toHaveBeenCalled()
    await result.update({ revealedKeys: ['reveal-one'] }); await layout()
    expect(window.scrollTo).not.toHaveBeenCalled()
    await result.update({ revealedKeys: ['reveal-one', 'reveal-two'] }); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('does not interpret an async callback completing as permission to scroll', async () => {
    const callback = vi.fn(async () => {})
    const result = render(article(), { onAnchorNavigate: callback, revealedKeys: ['reveal-one', 'reveal-two'] })
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('lets an asynchronous callback start navigation later and uses defaults for subsequent clicks when removed', async () => {
    let continueNavigation!: () => void
    const callback = vi.fn(async (request: ResourceQuestionNavigationRequest) => {
      await new Promise<void>((resolve) => { continueNavigation = resolve })
      request.scrollToAnchor()
    })
    const result = render(article(), { onAnchorNavigate: callback, revealedKeys: ['reveal-one', 'reveal-two'] })
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(window.scrollTo).not.toHaveBeenCalled()
    continueNavigation(); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    await result.update({ onAnchorNavigate: undefined })
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).toHaveBeenCalledTimes(2)
  })

  it('does not dispatch the navigation callback after synchronous cancellation in option-select', async () => {
    const callback = vi.fn()
    const result = render(article(), { onAnchorNavigate: callback }, { 'option-select': () => result.cancel() })
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(callback).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('keeps the newest request isolated from older asynchronous callbacks and cancellation handles', async () => {
    const requests: ResourceQuestionNavigationRequest[] = []
    let finish!: () => void
    const callback = vi.fn(async (request: ResourceQuestionNavigationRequest) => {
      requests.push(request)
      if (requests.length === 1) {
        await new Promise<void>((resolve) => { finish = resolve })
        request.scrollToAnchor()
        request.cancel()
      }
    })
    const result = render(article(), { onAnchorNavigate: callback, revealedKeys: ['reveal-one', 'reveal-two'] })
    await result.wrapper.find('button').trigger('click')
    await result.wrapper.find('button').trigger('click')
    finish(); await layout()
    expect(window.scrollTo).not.toHaveBeenCalled()
    requests[1].scrollToAnchor(); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })

  it.each(['request-cancel', 'runtime-cancel', 'article', 'article-key', 'relock', 'unbound', 'destroy'] as const)('invalidates a saved callback after %s', async (reason) => {
    let request!: ResourceQuestionNavigationRequest
    const result = render(article(), { onAnchorNavigate: (value: ResourceQuestionNavigationRequest) => { request = value }, revealedKeys: ['reveal-one', 'reveal-two'] })
    await result.wrapper.find('button').trigger('click')
    if (reason === 'request-cancel') request.cancel()
    if (reason === 'runtime-cancel') result.cancel()
    if (reason === 'article') await result.update({ document: article() })
    if (reason === 'article-key') await result.update({ articleKey: 'new' })
    if (reason === 'relock') { await result.update({ revealedKeys: [] }); await result.update({ revealedKeys: ['reveal-one', 'reveal-two'] }) }
    if (reason === 'unbound') await result.wrapper.findAll('button').at(1).trigger('click')
    if (reason === 'destroy') result.wrapper.destroy()
    request.scrollToAnchor(); await layout()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('only invokes the navigation callback for bound targets present in the full article', async () => {
    const q = question('a', 'deleted')
    const callback = vi.fn()
    const result = render({ type: 'doc', content: [q] }, { onAnchorNavigate: callback })
    await result.wrapper.findAll('button').at(0).trigger('click')
    await result.wrapper.findAll('button').at(1).trigger('click'); await layout()
    expect(result.selected).toHaveBeenCalledTimes(2)
    expect(callback).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it.each(['throw', 'reject'] as const)('reports callback %s failures without falling back to automatic scrolling', async (kind) => {
    const callback = () => {
      if (kind === 'throw') throw new Error('denied')
      return Promise.reject(new Error('denied'))
    }
    const result = render(article(), { onAnchorNavigate: callback, revealedKeys: ['reveal-one', 'reveal-two'] })
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(result.errors).toHaveBeenCalledWith(expect.objectContaining({ code: 'NAVIGATION_CALLBACK_FAILED' }))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('ignores stale callback rejection and respects current-instance scroll containers', async () => {
    let reject!: (error: Error) => void
    const requests: ResourceQuestionNavigationRequest[] = []
    const result = render(article(), { onAnchorNavigate: (request: ResourceQuestionNavigationRequest) => {
      requests.push(request)
      if (requests.length === 1) return new Promise<void>((_resolve, rejectRequest) => { reject = rejectRequest })
    }, revealedKeys: ['reveal-one', 'reveal-two'] })
    const container = result.wrapper.element as HTMLElement
    container.scrollTo = vi.fn()
    await result.update({ scrollContainer: container })
    await result.wrapper.find('button').trigger('click')
    await result.wrapper.find('button').trigger('click')
    reject(new Error('old failure')); requests[1].scrollToAnchor(); await layout()
    expect(result.errors).not.toHaveBeenCalled()
    expect(container.scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})

describe('resource question protocol validation', () => {
  it('validates frozen snapshots and allows repeated resource and cross-question option IDs', () => {
    const doc = freezeDeep(article())
    expect(validateArticleDocument(doc)).toEqual({ valid: true, issues: [] })
  })
  it.each(['id', 'revealKey'] as const)('rejects duplicate question %s even without hiding', (field) => {
    const a = question('a'); const b = question('b'); b.attrs[field] = a.attrs[field]; b.attrs.hideFollowing = false
    expect(validateArticleDocument({ type: 'doc', content: [a, b] }).issues).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_IDENTITY', path: `/content/1/attrs/${field}` }))
  })
  it('detects duplicate anchors in nested content and duplicate stable option IDs', () => {
    const q = question('a'); q.attrs.options[1].id = q.attrs.options[0].id
    const result = validateArticleDocument({ type: 'doc', content: [q, paragraph('anchor'), { type: 'blockquote', content: [paragraph('anchor')] }] })
    expect(result.issues.filter((issue) => issue.code === 'DUPLICATE_IDENTITY')).toHaveLength(2)
  })
  it.each(['blockquote', 'listItem', 'tableCell'])('forbids questions inside %s', (container) => {
    const inner = container === 'blockquote' ? { type: container, content: [question('nested')] }
      : container === 'listItem' ? { type: 'bulletList', content: [{ type: container, content: [question('nested')] }] }
        : { type: 'table', content: [{ type: 'tableRow', content: [{ type: container, content: [question('nested')] }] }] }
    expect(validateArticleDocument({ type: 'doc', content: [inner] }).issues).toContainEqual(expect.objectContaining({ code: 'INVALID_CONTENT', nodeType: 'resourceQuestion' }))
  })
  it('warns about a deleted target without invalidating the article', () => {
    const result = validateArticleDocument({ type: 'doc', content: [question('a', 'deleted')] })
    expect(result.valid).toBe(true)
    expect(result.issues).toEqual([expect.objectContaining({ code: 'MISSING_ANCHOR', severity: 'warning' })])
  })
  it.each([
    { id: ' ' }, { revealKey: '' }, { resourceId: ' ' }, { title: ' ' }, { hideFollowing: 'true' },
    { options: [] }, { options: [{ id: ' ', label: 'x' }] }, { options: [{ id: 'x', label: ' ' }] },
    { options: [{ id: 'x', label: 'x', targetAnchorId: '' }] }, { unknown: 1 },
    { resourceId: '', title: 'configured' }, { description: null },
  ])('rejects malformed question attrs %j', (attrs) => {
    const q = question('a'); Object.assign(q.attrs, attrs)
    expect(validateArticleDocument({ type: 'doc', content: [q] }).valid).toBe(false)
  })
})

describe('controlled visibility and snapshot rendering', () => {
  it.each([
    [[], ['intro', 'one']], [['reveal-one'], ['intro', 'one', 'middle', 'two']],
    [['reveal-two'], ['intro', 'one']], [['reveal-one', 'reveal-two'], ['intro', 'one', 'middle', 'two', 'last']],
    [['unknown'], ['intro', 'one']],
  ])('follows ordered boundaries for %j', (keys, expected) => {
    const doc = freezeDeep(article())
    expect(getVisibleContent(doc, keys).map((node) => node.type === 'resourceQuestion' ? node.attrs.id : node.type === 'paragraph' ? node.attrs?.anchorId : '')).toEqual(expected)
    const { wrapper } = render(doc, { revealedKeys: keys })
    expect(wrapper.element.children.length).toBe(expected.length)
  })
  it('notifies stable IDs without auto-reveal and restores hiding when keys are removed', async () => {
    const doc = freezeDeep(article()); const original = JSON.stringify(doc)
    const { wrapper, selected, update } = render(doc)
    await wrapper.findAll('button').at(0).trigger('click'); await layout()
    expect(selected).toHaveBeenLastCalledWith({ questionId: 'one', resourceId: 'shared-resource', optionId: 'stable-a', revealKey: 'reveal-one', targetAnchorId: 'last', option: { id: 'stable-a', label: 'Same label', targetAnchorId: 'last' } })
    expect(wrapper.text()).not.toContain('middle')
    expect(window.scrollTo).not.toHaveBeenCalled()
    await wrapper.findAll('button').at(1).trigger('click')
    expect(selected.mock.lastCall?.[0]).toEqual(expect.objectContaining({ optionId: 'stable-b', option: { id: 'stable-b', label: 'Same label' } }))
    expect(selected.mock.lastCall?.[0]).not.toHaveProperty('targetAnchorId')
    await update({ revealedKeys: ['reveal-one', 'reveal-two'] }); expect(wrapper.text()).toContain('last')
    await update({ revealedKeys: [] }); expect(wrapper.text()).not.toContain('middle')
    expect(JSON.stringify(doc)).toBe(original)
  })
  it('renders an empty placeholder and keeps its following content hidden', () => {
    const q = question('draft'); Object.assign(q.attrs, { resourceId: '', title: '', description: '', options: [] })
    expect(validateArticleDocument({ type: 'doc', content: [q] }).valid).toBe(true)
    const { wrapper } = render({ type: 'doc', content: [q, paragraph('hidden')] })
    expect(wrapper.text()).toBe('暂无问题内容'); expect(wrapper.find('button').exists()).toBe(false)
  })
  it('uses plain snapshot text and renders all content if hideFollowing is false', () => {
    const q = question('a'); q.attrs.hideFollowing = false; q.attrs.title = '<img src=x onerror=alert(1)>'
    q.attrs.description = '<script>bad()</script>'; q.attrs.options[0].label = '<b>literal</b>'
    const { wrapper } = render({ type: 'doc', content: [q, paragraph('after')] })
    expect(wrapper.find('img,script,b').exists()).toBe(false)
    expect(wrapper.text()).toContain(q.attrs.title); expect(wrapper.text()).toContain('after')
  })
  it('does not mount slots past the visibility boundary', async () => {
    const mounted = vi.fn()
    const Slot = Vue.extend({ mounted, render: (h) => h('aside', 'slot') })
    const result = render(article(), { customSlots: [{ id: 'ad', location: 3 }] }, {}, { ad: () => [new Vue().$createElement(Slot)] })
    expect(mounted).not.toHaveBeenCalled()
    await result.update({ revealedKeys: ['reveal-one'] }); expect(mounted).toHaveBeenCalledTimes(1)
    await result.update({ revealedKeys: [] }); expect(result.wrapper.find('aside').exists()).toBe(false)
  })
  it('reports identity errors even in tolerant mode, but preserves strict documents with stale bindings', async () => {
    const bad = render({ type: 'doc', content: [question('a'), question('a')] })
    expect(bad.wrapper.find('[role=alert]').exists()).toBe(true)
    await layout(); expect(bad.errors).toHaveBeenCalledWith(expect.objectContaining({ code: 'DUPLICATE_IDENTITY' }))
    const warning = render({ type: 'doc', content: [question('a', 'deleted')] }, { strict: true })
    expect(warning.wrapper.find('fieldset').exists()).toBe(true)
    await warning.wrapper.find('button').trigger('click'); await layout()
    expect(warning.selected).toHaveBeenCalledTimes(1); expect(window.scrollTo).not.toHaveBeenCalled()
  })
})

describe('resource question navigation lifecycle', () => {
  it('retains a hidden target across multiple boundaries, scrolls once after layout and focuses it', async () => {
    const { wrapper, update } = render()
    await wrapper.find('button').trigger('click')
    await update({ revealedKeys: ['reveal-one'] }); await layout(); expect(window.scrollTo).not.toHaveBeenCalled()
    await update({ revealedKeys: ['reveal-one', 'reveal-two'] }); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    expect(document.activeElement).toBe(wrapper.find('[data-anchor-id="last"]').element)
    await update({ scrollOffset: 20 }); await layout(); expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })
  it('handles synchronous host reveal and synchronous host cancellation', async () => {
    let unlock: (props: Record<string, unknown>) => Promise<void>
    const result = render(article(), {}, { 'option-select': () => { void unlock({ revealedKeys: ['reveal-one', 'reveal-two'] }) } })
    unlock = result.update
    await result.wrapper.find('button').trigger('click'); await layout()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    vi.mocked(window.scrollTo).mockClear()
    const cancelled = render(article(), {}, { 'option-select': () => cancelled.cancel() })
    await cancelled.wrapper.find('button').trigger('click'); await cancelled.update({ revealedKeys: ['reveal-one', 'reveal-two'] }); await layout()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
  it.each(['cancel', 'unbound', 'missing', 'article', 'article-key', 'destroy', 'relock'] as const)('cancels obsolete work after %s', async (reason) => {
    const doc = article()
    if (reason === 'missing') (doc.content[1] as ReturnType<typeof question>).attrs.options[1].targetAnchorId = 'deleted'
    const result = render(doc)
    await result.wrapper.find('button').trigger('click')
    if (reason === 'cancel') result.cancel()
    if (reason === 'unbound' || reason === 'missing') await result.wrapper.findAll('button').at(1).trigger('click')
    if (reason === 'article') await result.update({ document: article(), revealedKeys: [] })
    if (reason === 'article-key') await result.update({ articleKey: 'next-version' })
    if (reason === 'destroy') result.wrapper.destroy()
    if (reason === 'relock') { await result.update({ revealedKeys: ['reveal-one'] }); await result.update({ revealedKeys: [] }) }
    await result.update({ revealedKeys: ['reveal-one', 'reveal-two'] }); await layout()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
  it('replaces the latest target, scopes identical unusual anchors to each instance, and uses container offset', async () => {
    const id = 'anchor["#中文]'
    const q = question('a', id); q.attrs.hideFollowing = false; q.attrs.options[1].targetAnchorId = 'second'
    const doc: ArticleDocument = { type: 'doc', content: [q, { type: 'blockquote', content: [paragraph(id), { type: 'heading', attrs: { level: 2, anchorId: 'second' }, content: [{ type: 'text', text: 'Target heading' }] }] }] }
    const other = render(doc)
    const current = render(doc, { scrollOffset: 25 })
    const container = current.wrapper.element as HTMLElement
    container.scrollTo = vi.fn(); container.scrollTop = 100
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 20 } as DOMRect)
    await current.update({ scrollContainer: () => container })
    const target = current.wrapper.find('h2').element as HTMLElement
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 200 } as DOMRect)
    await current.wrapper.findAll('button').at(0).trigger('click')
    await current.wrapper.findAll('button').at(1).trigger('click'); await layout()
    expect(container.scrollTo).toHaveBeenCalledTimes(1)
    expect(container.scrollTo).toHaveBeenCalledWith({ top: 255, behavior: 'auto' })
    expect(document.activeElement).toBe(target)
    expect(other.selected).not.toHaveBeenCalled(); expect(window.scrollTo).not.toHaveBeenCalled()
  })
  it('keeps runtime reveal keys local to each renderer', async () => {
    const first = render(); const second = render()
    await first.update({ revealedKeys: ['reveal-one', 'reveal-two'] })
    expect(first.wrapper.text()).toContain('last'); expect(second.wrapper.text()).not.toContain('middle')
  })
})
