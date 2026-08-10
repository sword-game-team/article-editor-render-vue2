// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArticleContentRenderer, {
  type ArticleButtonClickPayload,
  type ArticleButtonNode,
  type ArticleDocument,
  type RenderIssue,
} from '../src'

const completeDocument: ArticleDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [
        {
          type: 'text',
          text: 'formatted',
          marks: [
            { type: 'bold' },
            { type: 'italic' },
            { type: 'strike' },
            { type: 'underline' },
            { type: 'code' },
            { type: 'link', attrs: { href: '/relative' } },
          ],
        },
      ],
    },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Heading' }] },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote' }] }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet' }] }],
        },
      ],
    },
    {
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ordered' }] }],
        },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'ts' },
      content: [{ type: 'text', text: 'const value = 1' }],
    },
    { type: 'horizontalRule' },
    {
      type: 'image',
      attrs: {
        src: 'https://cdn.example.com/image.png',
        alt: 'Example',
        width: 640,
        height: 360,
        imageAlign: 'right',
      },
    },
    {
      type: 'articleButton',
      attrs: { id: 'primary', text: 'Primary', title: 'Open primary', style: 'button' },
    },
    {
      type: 'articleButton',
      attrs: { id: 'secondary', text: 'Secondary', style: 'text' },
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }],
            },
          ],
        },
      ],
    },
  ],
}

interface MockGoogleTagSlot {
  addService: ReturnType<typeof vi.fn>
}

interface MockSlotRenderEndedEvent {
  slot: MockGoogleTagSlot
  isEmpty: boolean
}

function installGoogleTagMock() {
  let slotRenderEnded: ((event: MockSlotRenderEndedEvent) => void) | undefined
  const slot = {} as MockGoogleTagSlot
  const pubAds = {
    addEventListener: vi.fn(
      (_eventName: string, listener: (event: MockSlotRenderEndedEvent) => void) => {
        slotRenderEnded = listener
      },
    ),
    removeEventListener: vi.fn(),
  }
  slot.addService = vi.fn(() => slot)

  const googletag = {
    cmd: {
      push: vi.fn((callback: () => void) => {
        callback()
        return 1
      }),
    },
    defineSlot: vi.fn(() => slot),
    pubads: vi.fn(() => pubAds),
    enableServices: vi.fn(),
    display: vi.fn(),
    destroySlots: vi.fn(() => true),
  }

  ;(window as Window & { googletag?: unknown }).googletag = googletag

  return {
    googletag,
    slot,
    emitSlotRenderEnded(isEmpty: boolean) {
      slotRenderEnded?.({ slot, isEmpty })
    },
  }
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  delete (window as Window & { googletag?: unknown }).googletag
  delete (window as Window & { adsbygoogle?: unknown }).adsbygoogle
  vi.restoreAllMocks()
})

describe('ArticleContentRenderer', () => {
  it('validates aligned adConf arrays and inserts one-based ad slots', async () => {
    const document = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
      ],
    }
    const valid = mount(ArticleContentRenderer, {
      propsData: {
        document,
        adConf: { ads: ['123'], loc: [2] },
      },
    })

    const children = Array.from(valid.element.children)
    expect(children.map((element) => element.className)).toEqual([
      'acp-paragraph',
      'acp-ad-slot',
      'acp-paragraph',
    ])
    expect(valid.get('.acp-ad-slot').attributes()).toMatchObject({
      'data-ad-index': '1',
      'data-ad-location': '2',
      'data-ads': '123',
    })

    const invalid = mount(ArticleContentRenderer, {
      propsData: {
        document,
        adConf: { adm: ['one', 'two'], ads: ['123'], loc: [1, 2] },
      },
    })
    await nextTick()

    const issues = (invalid.emitted('render-error') ?? []).map(([issue]) => issue as RenderIssue)
    expect(issues).toContainEqual(
      expect.objectContaining({ code: 'AD_CONFIG_LENGTH_MISMATCH', path: '/adConf' }),
    )
    expect(invalid.find('.acp-ad-slot').exists()).toBe(false)
  })

  it('ignores ad locations beyond the document content length', () => {
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Only' }] }],
        },
        adConf: { ads: ['123'], loc: [5] },
      },
    })

    expect(wrapper.find('.acp-ad-slot').exists()).toBe(false)
  })

  it('renders AdSense with a configurable title and matching publisher and slot ids', () => {
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content' }] }],
        },
        adConf: { ads: ['123'], loc: [1] },
        pubid: { adm: '', ads: '3887371527059481' },
        adTitle: 'Sponsored',
      },
    })

    expect(wrapper.get('.article-ad-title').element.tagName).toBe('DIV')
    expect(wrapper.get('.article-ad-title').text()).toBe('Sponsored')
    expect(wrapper.get('ins.adsbygoogle').attributes()).toMatchObject({
      'data-ad-client': 'ca-pub-3887371527059481',
      'data-ad-slot': '123',
    })
    expect(wrapper.get('ins.adsbygoogle').attributes('style')).not.toContain('height')
  })

  it('prioritizes ADM and falls back to the matching AdSense slot only when ADM is empty', async () => {
    const { googletag, emitSlotRenderEnded } = installGoogleTagMock()
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content' }] }],
        },
        adConf: { adm: ['native-1'], ads: ['123'], loc: [1] },
        pubid: { adm: '/23054585162/newsflowly/', ads: '3887371527059481' },
      },
    })

    expect(wrapper.find('.article-adm-wrapper').exists()).toBe(true)
    expect(wrapper.find('ins.adsbygoogle').exists()).toBe(false)
    expect(googletag.defineSlot).toHaveBeenCalledWith(
      '/23054585162/newsflowly/native-1',
      'fluid',
      'native-1',
    )

    emitSlotRenderEnded(false)
    await nextTick()
    expect(wrapper.find('.article-adm-wrapper').exists()).toBe(true)

    emitSlotRenderEnded(true)
    await nextTick()
    await nextTick()
    expect(wrapper.find('.article-adm-wrapper').exists()).toBe(false)
    expect(wrapper.get('ins.adsbygoogle').attributes()).toMatchObject({
      'data-ad-client': 'ca-pub-3887371527059481',
      'data-ad-slot': '123',
    })
  })

  it('does not request AdSense when an ADM-only slot is empty', async () => {
    const { emitSlotRenderEnded } = installGoogleTagMock()
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content' }] }],
        },
        adConf: { adm: ['native-only'], loc: [1] },
        pubid: { adm: '/23054585162/newsflowly/', ads: '' },
      },
    })

    emitSlotRenderEnded(true)
    await nextTick()
    expect(wrapper.find('.article-adm-wrapper').exists()).toBe(true)
    expect(wrapper.find('ins.adsbygoogle').exists()).toBe(false)
  })

  it('replaces only the default image base URL', async () => {
    const document: ArticleDocument = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://www.doitme.link/uploads/article.png' } },
        { type: 'image', attrs: { src: 'https://external.example.com/image.png' } },
      ],
    }
    const wrapper = mount(ArticleContentRenderer, {
      propsData: { document },
    })

    expect(wrapper.findAll('img').at(0).attributes('src')).toBe(
      'https://www.doitme.link/uploads/article.png',
    )
    await wrapper.setProps({ imageBaseUrl: 'https://cdn.example.com/assets/' })
    expect(wrapper.findAll('img').at(0).attributes('src')).toBe(
      'https://cdn.example.com/assets/uploads/article.png',
    )
    expect(wrapper.findAll('img').at(1).attributes('src')).toBe(
      'https://external.example.com/image.png',
    )
  })

  it('renders every v1 node family and nested marks as semantic elements', () => {
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: completeDocument,
        resolveArticleButtonLink: (attrs: { id: string }) => `/actions/${attrs.id}`,
      },
    })

    expect(wrapper.find('p').attributes('style')).toContain('text-align: center')
    expect(wrapper.find('h2').text()).toBe('Heading')
    expect(wrapper.find('blockquote').text()).toBe('Quote')
    expect(wrapper.find('ul li').text()).toBe('Bullet')
    expect(wrapper.find('ol').attributes('start')).toBe('1')
    expect(wrapper.find('pre').attributes('data-language')).toBe('ts')
    expect(wrapper.find('pre code').text()).toBe('const value = 1')
    expect(wrapper.find('hr').exists()).toBe(true)
    expect(wrapper.find('.acp-image--right img').attributes()).toMatchObject({
      src: 'https://cdn.example.com/image.png',
      alt: 'Example',
      width: '640',
      height: '360',
      'data-image-align': 'right',
    })
    expect(wrapper.findAll('table tbody tr td')).toHaveLength(2)

    const nested = wrapper.find('p a code u s em strong')
    expect(nested.text()).toBe('formatted')
    expect(wrapper.find('p a').attributes()).toMatchObject({
      href: '/relative',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
  })

  it('resolves both articleButton styles to safe anchors and emits click details', async () => {
    const resolver = vi.fn((attrs: { id: string }, _node: Readonly<ArticleButtonNode>) =>
      attrs.id === 'primary'
        ? { href: `/actions/${attrs.id}`, target: '_blank' as const, rel: 'external' }
        : `/actions/${attrs.id}`,
    )
    const listener = vi.fn((payload: ArticleButtonClickPayload) => payload.event.preventDefault())
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: completeDocument,
        resolveArticleButtonLink: resolver,
      },
      listeners: {
        'article-button-click': listener,
      },
    })

    const links = wrapper.findAll('.acp-article-button')
    expect(links).toHaveLength(2)
    expect(links.at(0).element.tagName).toBe('A')
    expect(links.at(0).classes()).toContain('acp-article-button--button')
    expect(links.at(0).attributes()).toMatchObject({
      href: '/actions/primary',
      target: '_blank',
      rel: 'external noopener noreferrer',
      'data-article-button-id': 'primary',
    })
    expect(links.at(1).classes()).toContain('acp-article-button--text')
    expect(links.at(1).attributes('href')).toBe('/actions/secondary')
    expect(Object.isFrozen(resolver.mock.calls[0]?.[0])).toBe(true)
    expect(Object.isFrozen(resolver.mock.calls[0]?.[1])).toBe(true)

    await links.at(0).trigger('click')
    expect(listener).toHaveBeenCalledOnce()
    const payload = listener.mock.calls[0]?.[0]
    expect(payload).toMatchObject({ href: '/actions/primary' })
    expect(payload.event.defaultPrevented).toBe(true)
  })

  it('uses the exact safe href returned by the consumer without appending parameters', () => {
    const resolver = vi.fn((attrs: { id: string }) => `/detail/${attrs.id}`)
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: {
          type: 'doc',
          content: [
            {
              type: 'articleButton',
              attrs: { id: 'view-more', text: 'View more', style: 'text' },
            },
          ],
        },
        resolveArticleButtonLink: resolver,
      },
    })

    const link = wrapper.get('.acp-article-button')
    expect(resolver).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'view-more', text: 'View more', style: 'text' }),
      expect.objectContaining({ type: 'articleButton' }),
    )
    expect(link.attributes('href')).toBe('/detail/view-more')
    expect(link.attributes('href')).not.toContain('?')
    expect(link.attributes('href')).not.toContain('tenantId')
    expect(link.attributes('href')).not.toContain('articleId')
    expect(link.attributes('href')).not.toContain('style=')
  })

  it('skips unsafe URLs while preserving other valid content', async () => {
    const wrapper = mount(ArticleContentRenderer, {
      propsData: {
        document: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'safe text',
                  marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
                },
              ],
            },
            { type: 'image', attrs: { src: 'data:image/png;base64,abc' } },
            {
              type: 'articleButton',
              attrs: { id: 'bad', text: 'Bad link', style: 'button' },
            },
          ],
        },
        resolveArticleButtonLink: () => 'javascript:alert(1)',
      },
    })

    await nextTick()
    await Promise.resolve()
    expect(wrapper.find('p').text()).toBe('safe text')
    expect(wrapper.find('p a').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.acp-article-button').attributes('href')).toBeUndefined()
    expect(
      (wrapper.emitted('render-error') ?? []).some(([issue]) =>
        ['UNSAFE_URL', 'LINK_RESOLUTION_FAILED'].includes((issue as { code: string }).code),
      ),
    ).toBe(true)
  })

  it('renders an error placeholder in strict mode and partial content otherwise', async () => {
    const document = {
      type: 'doc',
      content: [
        { type: 'unknown' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Still visible' }] },
      ],
    }
    const strictWrapper = mount(ArticleContentRenderer, { propsData: { document, strict: true } })
    const tolerantWrapper = mount(ArticleContentRenderer, { propsData: { document } })

    await nextTick()
    expect(strictWrapper.find('[data-render-error="true"]').exists()).toBe(true)
    expect(strictWrapper.text()).toContain('Invalid article content')
    expect(tolerantWrapper.text()).toContain('Still visible')
    expect(tolerantWrapper.text()).not.toContain('unknown')
    expect(tolerantWrapper.emitted('render-error')?.[0]?.[0]).toMatchObject({
      code: 'UNKNOWN_NODE',
      path: '/content/0/type',
    })
  })
})
