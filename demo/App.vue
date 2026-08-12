<script lang="ts">
import Vue from 'vue'
import {
  ArticleContentRenderer,
  type ArticleButtonAttrs,
  type ArticleButtonClickPayload,
  type ArticleButtonLink,
  type ArticleButtonNode,
  type ArticleDocument,
  type CustomSlot,
  type RenderIssue,
} from '../src'

const DEFAULT_RESOLVER_CODE = [
  'const { id, title, text, style } = attrs',
  '',
  '// href 完全由使用者拼接，组件不会自动追加参数',
  'return `/detail/${id}`',
].join('\n')

type ExecutableResolver = (
  attrs: Readonly<ArticleButtonAttrs>,
  node: Readonly<ArticleButtonNode>,
) => ArticleButtonLink

function compileResolver(source: string): ExecutableResolver {
  return new Function('attrs', 'node', `"use strict";\n${source}`) as ExecutableResolver
}

const article: ArticleDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1, textAlign: 'center' },
      content: [{ type: 'text', text: 'Article Content Protocol v1' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '这个 Demo 展示 ' },
        { type: 'text', text: '粗体', marks: [{ type: 'bold' }] },
        { type: 'text', text: '、' },
        { type: 'text', text: '斜体', marks: [{ type: 'italic' }] },
        { type: 'text', text: '、' },
        { type: 'text', text: '删除线', marks: [{ type: 'strike' }] },
        { type: 'text', text: '、' },
        { type: 'text', text: '下划线', marks: [{ type: 'underline' }] },
        { type: 'text', text: '、' },
        { type: 'text', text: 'inlineCode()', marks: [{ type: 'code' }] },
        { type: 'text', text: ' 和 ' },
        {
          type: 'text',
          text: '安全链接',
          marks: [
            {
              type: 'link',
              attrs: { href: 'https://example.com', target: '_blank' },
            },
          ],
        },
        { type: 'text', text: '。' },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '协议数据只描述内容；渲染、安全和业务链接由组件负责。',
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '列表与代码块' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '无序列表支持嵌套块节点。' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '每个节点都会经过协议校验。' }],
            },
          ],
        },
      ],
    },
    {
      type: 'orderedList',
      attrs: { start: 3 },
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '有序列表可以指定起始序号。' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '省略时默认从 1 开始。' }],
            },
          ],
        },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'ts' },
      content: [
        {
          type: 'text',
          text: "const resolver = (attrs) => `/action/${attrs.id}`",
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '图片、操作链接与表格' }],
    },
    {
      type: 'image',
      attrs: {
        src: '/demo-image.svg',
        alt: 'Article Content Renderer illustration',
        width: 960,
        height: 360,
        imageAlign: 'center',
      },
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '下面两个 articleButton 使用同一个闭包 resolver，只改变视觉样式：',
        },
      ],
    },
    {
      type: 'articleButton',
      attrs: {
        id: 'view-product',
        title: '查看商品详情',
        text: '按钮样式链接',
        style: 'button',
      },
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '也可以渲染成更轻量的文本操作：' }],
    },
    {
      type: 'articleButton',
      attrs: {
        id: '1',
        title: '查看更多内容',
        text: '文本样式链接',
        style: 'text',
      },
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'link 类型直接使用协议节点中的 href，不经过 resolver：' }],
    },
    {
      type: 'articleButton',
      attrs: {
        title: '直接使用节点 href',
        text: 'Link 样式链接',
        style: 'link',
        href: '/docs/article-content-protocol#article-button-link',
      },
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '节点' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'DOM' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '说明' }] }],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'articleButton' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '<a>' }] }],
            },
            {
              type: 'tableCell',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: '外部生成安全链接' }] },
              ],
            },
          ],
        },
      ],
    },
    { type: 'horizontalRule' },
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [{ type: 'text', text: 'Demo end' }],
    },
  ],
}

export default Vue.extend({
  name: 'DemoApp',
  components: {
    ArticleContentRenderer,
  },
  data() {
    return {
      article,
      customSlots: [
        { id: 'demo-promo', location: 5 },
      ] as CustomSlot[],
      strict: false,
      allowNavigation: false,
      openInNewTab: false,
      resolverCode: DEFAULT_RESOLVER_CODE,
      appliedResolverCode: DEFAULT_RESOLVER_CODE,
      resolverCodeError: '',
      activeResolver: compileResolver(DEFAULT_RESOLVER_CODE),
      lastClick: null as ArticleButtonClickPayload | null,
      renderIssues: [] as RenderIssue[],
    }
  },
  computed: {
    formattedDocument(): string {
      return JSON.stringify(this.article, null, 2)
    },
    resolverHasChanges(): boolean {
      return this.resolverCode !== this.appliedResolverCode
    },
  },
  methods: {
    applyResolverCode(): void {
      try {
        const resolver = compileResolver(this.resolverCode)
        this.activeResolver = resolver
        this.appliedResolverCode = this.resolverCode
        this.resolverCodeError = ''
        this.lastClick = null
        this.renderIssues = []
      } catch (error) {
        this.resolverCodeError = error instanceof Error ? error.message : String(error)
      }
    },
    resetResolverCode(): void {
      this.resolverCode = DEFAULT_RESOLVER_CODE
      this.applyResolverCode()
    },
    resolveArticleButtonLink(
      attrs: Readonly<ArticleButtonAttrs>,
      node: Readonly<ArticleButtonNode>,
    ): ArticleButtonLink {
      const result = this.activeResolver(attrs, node)
      if (!this.openInNewTab || typeof result !== 'string') return result

      return { href: result, target: '_blank', rel: 'demo-link' }
    },
    handleArticleButtonClick(payload: ArticleButtonClickPayload): void {
      this.lastClick = payload
      if (!this.allowNavigation) payload.event.preventDefault()
    },
    handleRenderError(issue: RenderIssue): void {
      const key = `${issue.code}:${issue.path}:${issue.message}`
      if (
        !this.renderIssues.some(
          (existing) => `${existing.code}:${existing.path}:${existing.message}` === key,
        )
      ) {
        this.renderIssues.push(issue)
      }
    },
    clearRuntimeState(): void {
      this.lastClick = null
      this.renderIssues = []
    },
  },
})
</script>

<template>
  <main class="demo-shell">
    <header class="demo-hero">
      <p class="demo-eyebrow">Vue 2.7 component playground</p>
      <h1>Article Content Renderer</h1>
      <p>修改左侧控制项，直接观察协议内容、样式和使用者完整拼接的 articleButton 链接。</p>
    </header>

    <div class="demo-layout">
      <aside class="demo-panel demo-controls">
        <div class="demo-panel__header">
          <div>
            <p class="demo-panel__eyebrow">Runtime options</p>
            <h2>控制台</h2>
          </div>
          <button class="demo-reset" type="button" @click="clearRuntimeState">清空状态</button>
        </div>

        <section class="demo-resolver-editor">
          <div class="demo-resolver-editor__header">
            <div>
              <h3>articleButton resolver</h3>
              <p>使用 JavaScript 读取节点属性并返回完整链接。</p>
            </div>
            <span class="demo-code-state" :class="{ 'demo-code-state--pending': resolverHasChanges }">
              {{ resolverHasChanges ? '待应用' : '已应用' }}
            </span>
          </div>

          <div class="demo-code-reference" aria-label="可用回调参数">
            <code>attrs.id</code>
            <code>attrs.title</code>
            <code>attrs.text</code>
            <code>attrs.style</code>
            <code>仅处理 text/button</code>
            <code>node</code>
          </div>

          <label class="demo-code-field">
            <span>回调函数体</span>
            <textarea
              v-model="resolverCode"
              aria-label="articleButton resolver 代码"
              rows="8"
              spellcheck="false"
            ></textarea>
          </label>

          <p class="demo-code-example">
            默认示例读取全部 attrs，并返回 <code>/detail/${attrs.id}</code>。这里返回什么安全链接，最终 href 就是什么。
          </p>

          <p v-if="resolverCodeError" class="demo-code-error" role="alert">
            无法应用：{{ resolverCodeError }}
          </p>

          <div class="demo-code-actions">
            <button class="demo-apply" type="button" @click="applyResolverCode">应用回调</button>
            <button class="demo-secondary" type="button" @click="resetResolverCode">恢复示例</button>
          </div>
        </section>

        <label class="demo-check">
          <input v-model="strict" type="checkbox" />
          <span>严格模式</span>
        </label>

        <label class="demo-check">
          <input v-model="openInNewTab" type="checkbox" />
          <span>text/button 类型使用 _blank</span>
        </label>

        <label class="demo-check">
          <input v-model="allowNavigation" type="checkbox" />
          <span>允许链接实际跳转</span>
        </label>

        <p class="demo-hint">
          可编辑回调只用于本地开发 Demo。正式项目应在源码中传入 resolver。默认拦截跳转，方便在下方检查最终 href。
        </p>

        <section id="article-button-result" class="demo-runtime-card">
          <h3>最近一次点击</h3>
          <dl v-if="lastClick">
            <div>
              <dt>节点 ID</dt>
              <dd>{{ lastClick.attrs.id }}</dd>
            </div>
            <div>
              <dt>节点样式</dt>
              <dd>{{ lastClick.attrs.style }}</dd>
            </div>
            <div>
              <dt>生成链接</dt>
              <dd class="demo-break">{{ lastClick.href }}</dd>
            </div>
            <div>
              <dt>已阻止跳转</dt>
              <dd>{{ lastClick.event.defaultPrevented ? '是' : '否' }}</dd>
            </div>
          </dl>
          <p v-else>点击正文中的 button、text 或 link 操作后显示。</p>
        </section>

        <section class="demo-runtime-card">
          <h3>渲染问题（{{ renderIssues.length }}）</h3>
          <ul v-if="renderIssues.length" class="demo-issues">
            <li v-for="issue in renderIssues" :key="`${issue.code}:${issue.path}`">
              <strong>{{ issue.code }}</strong>
              <span>{{ issue.path || '/' }}</span>
              <small>{{ issue.message }}</small>
            </li>
          </ul>
          <p v-else>当前协议数据没有发现问题。</p>
        </section>
      </aside>

      <section class="demo-panel demo-preview">
        <div class="demo-panel__header demo-preview__header">
          <div>
            <p class="demo-panel__eyebrow">Rendered result</p>
            <h2>文章预览</h2>
          </div>
          <span class="demo-version">Protocol v1</span>
        </div>

        <article class="demo-render-surface">
          <ArticleContentRenderer
            :document="article"
            :strict="strict"
            :custom-slots="customSlots"
            :resolve-article-button-link="resolveArticleButtonLink"
            @article-button-click="handleArticleButtonClick"
            @render-error="handleRenderError"
          >
            <template #demo-promo>
              <aside class="demo-custom-slot">Custom slot before item 5</aside>
            </template>
          </ArticleContentRenderer>
        </article>

        <details class="demo-json">
          <summary>查看 ProseMirror JSON</summary>
          <pre>{{ formattedDocument }}</pre>
        </details>
      </section>
    </div>
  </main>
</template>
