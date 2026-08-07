import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'
import { describe, expect, it } from 'vitest'
import ArticleContentRenderer from '../src'

describe('server-side rendering', () => {
  it('renders protocol content without browser globals', async () => {
    const app = new Vue({
      render: (createElement) =>
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
          },
        }),
    })

    const html = await createRenderer().renderToString(app)
    expect(html).toContain('data-node-type="doc"')
    expect(html).toContain('<h1')
    expect(html).toContain('Vue 2 SSR')
    expect(html).toContain('<p')
  })
})
