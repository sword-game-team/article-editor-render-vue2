// @vitest-environment jsdom
import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ArticleContentRenderer, { validateArticleDocument, type ArticleDocument, type ImageNode } from '../src'
import { freezeDeep, paragraph } from './resource-fixtures'

const image = (imageLayout?: 'two-column'): ImageNode => ({ type: 'image', attrs: { src: '/image.png', width: 800, height: 400, ...(imageLayout ? { imageLayout } : {}) } })
const render = (doc: unknown, strict = false) => mount(Vue.extend({ render: (h) => h('article', [h(ArticleContentRenderer, { props: { document: doc, strict } })]) }))

describe('latest protocol extensions', () => {
  it('validates and renders font size, safe colors and anchors without modifying the snapshot', () => {
    const doc: ArticleDocument = freezeDeep({ type: 'doc', content: [{
      type: 'paragraph', attrs: { fontSize: 24, textAlign: 'right', anchorId: 'paragraph' },
      content: [{ type: 'text', text: 'Colored text', marks: [
        { type: 'textStyle', attrs: { color: '#123AbC' } }, { type: 'highlight', attrs: { color: '#ffeedd' } },
      ] }],
    }] })
    expect(validateArticleDocument(doc)).toEqual({ valid: true, issues: [] })
    const wrapper = render(doc, true)
    expect((wrapper.find('p').element as HTMLElement).style.fontSize).toBe('24px')
    expect((wrapper.find('p').element as HTMLElement).style.textAlign).toBe('right')
    expect((wrapper.find('span').element as HTMLElement).style.color).toBe('rgb(18, 58, 188)')
    expect((wrapper.find('mark').element as HTMLElement).style.backgroundColor).toBe('rgb(255, 238, 221)')
    expect(wrapper.find('p').attributes('data-anchor-id')).toBe('paragraph')
    wrapper.destroy()
  })
  it.each([7, 97, 20.5, '24', null])('rejects out-of-protocol fontSize %s and omits it in tolerant mode', (fontSize) => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', attrs: { fontSize } }] }
    expect(validateArticleDocument(doc).valid).toBe(false)
    const wrapper = render(doc)
    expect((wrapper.find('p').element as HTMLElement).style.fontSize).toBe(''); wrapper.destroy()
  })
  it.each(['red', '#fff', '#11223344', 'url(javascript:alert(1))'])('rejects unsafe/unsupported color %s', (color) => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Text', marks: [{ type: 'textStyle', attrs: { color } }, { type: 'highlight', attrs: { color } }] }] }] }
    expect(validateArticleDocument(doc).valid).toBe(false)
    const wrapper = render(doc); expect(wrapper.find('[style]').exists()).toBe(false); expect(wrapper.text()).toBe('Text'); wrapper.destroy()
  })
  it('pairs adjacent images, retains a half-width odd image and breaks rows at other blocks', () => {
    const doc: ArticleDocument = freezeDeep({ type: 'doc', content: [image('two-column'), image('two-column'), image('two-column'), paragraph('break'), image('two-column'), image(), image('two-column')] })
    expect(validateArticleDocument(doc).valid).toBe(true)
    const wrapper = render(doc, true)
    expect(wrapper.findAll('.acp-image-row').wrappers.map((row) => row.findAll('img').length)).toEqual([2, 1, 1, 1])
    expect(wrapper.element.children[4].className).toContain('acp-image--center')
    expect(wrapper.find('img').attributes()).toEqual(expect.objectContaining({ width: '800', height: '400' }))
    expect(wrapper.find('img').attributes('style')).toBeUndefined()
    wrapper.destroy()
  })
  it('supports the same image flow inside nested blocks', () => {
    const wrapper = render({ type: 'doc', content: [{ type: 'blockquote', content: [image('two-column'), image('two-column')] }] })
    expect(wrapper.find('blockquote .acp-image-row').findAll('img').length).toBe(2); wrapper.destroy()
  })
  it('enforces the downloaded documentSchema for new attributes', () => {
    for (const node of [
      { type: 'heading', attrs: { level: 2, anchorId: ' ' } },
      { type: 'heading', attrs: { level: 2, fontSize: 20 } },
      { type: 'image', attrs: { src: '/image.png', imageLayout: 'three-column' } },
    ]) expect(validateArticleDocument({ type: 'doc', content: [node] }).valid).toBe(false)
  })
})
