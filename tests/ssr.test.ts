import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'
import { describe, expect, it } from 'vitest'
import ArticleContentRenderer from '../src'
import { article, question } from './resource-fixtures'

describe('server-side rendering', () => {
  it('renders question images before the title without browser globals', async () => {
    const q = question('with-image')
    q.attrs.image = { src: '/question.png', alt: 'Question image', width: 800, height: 400 }
    const app = new Vue({ render: (h) => h('main', [h(ArticleContentRenderer, { props: {
      document: { type: 'doc', content: [q] }, strict: true, resourceQuestionFooterText: 'Host footer',
    } })]) })
    const html = await createRenderer().renderToString(app)
    expect(html).toContain('src="/question.png"')
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('class="acp-resource-question__title"'))
    expect(html).not.toMatch(/<(fieldset|legend)/)
    expect(html).toContain('Saved description')
    expect(html).toContain('Host footer')
    expect(html).toContain('width="800" height="400"')
  })
  it('respects controlled resource boundaries without browser globals', async () => {
    for (const keys of [[], ['reveal-one', 'reveal-two']]) {
      const app = new Vue({ render: (h) => h('main', [h(ArticleContentRenderer, { props: { document: article(), revealedKeys: keys } })]) })
      const html = await createRenderer().renderToString(app)
      expect(html).toContain('Question one')
      expect(html.includes('data-anchor-id="last"')).toBe(keys.length > 0)
      expect(html).not.toContain('acp-document')
    }
  })
  it('renders protocol content without browser globals', async () => {
    const app = new Vue({
      render: (createElement) =>
        createElement('main', { attrs: { 'data-ssr-host': 'true' } }, [
          createElement(ArticleContentRenderer, {
            props: {
              document: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Vue 2 SSR' }],
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Ready' }],
                  },
                ],
              },
              customSlots: [{ id: 'ssr-slot', location: 1 }],
            },
            scopedSlots: {
              'ssr-slot': () => [
                createElement(
                  'aside',
                  { attrs: { 'data-custom-slot': 'ssr-slot' } },
                  'SSR custom slot',
                ),
              ],
            },
          }),
        ]),
    })

    const html = await createRenderer().renderToString(app)
    expect(html).toContain('data-ssr-host="true"')
    expect(html).not.toContain('data-node-type="doc"')
    expect(html).not.toContain('data-protocol-version')
    expect(html).not.toContain('acp-document')
    expect(html).toContain('data-custom-slot="ssr-slot"')
    expect(html).toContain('SSR custom slot')
    expect(html).toContain('<h1')
    expect(html).toContain('Vue 2 SSR')
    expect(html).toContain('<p')
  })
})
