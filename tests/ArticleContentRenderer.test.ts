// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import ArticleContentRenderer, {
  type ArticleButtonClickPayload,
  type ArticleButtonNode,
  type ArticleDocument,
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

describe('ArticleContentRenderer', () => {
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
