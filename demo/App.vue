<script lang="ts">
import Vue from 'vue'
import {
  ArticleContentRenderer,
  type ArticleButtonAttrs,
  type ArticleButtonClickPayload,
  type ArticleButtonLink,
  type ArticleButtonNode,
  type ArticleDocument,
  type CustomLinkMarkAttrs,
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

const article: ArticleDocument = {"type": "doc", "content": [{"type": "paragraph", "content": [{"text": "What does your IQ score mean? Explore IQ score ranges, average IQ, high IQ scores, and what scores like 100, 120, 130, and 140 may indicate. Most modern IQ tests are designed around an average score of ", "type": "text"}, {"text": "100", "type": "text", "marks": [{"type": "bold"}]}, {"text": ", with many people scoring within a relatively broad range around the average.", "type": "text"}]}, {"type": "articleButton", "attrs": {"href": "/app/22114-iq-test-intelligence-test/", "text": "🧠Take the Challenge", "style": "link"}}, {"type": "articleButton", "attrs": {"href": "/app/22114-iq-test-intelligence-test/", "text": "❤️ Find Out", "style": "link"}}, {"type": "articleButton", "attrs": {"href": "/app/22114-iq-test-intelligence-test/", "text": "🧠Take the Challenge", "style": "link"}}, {"type": "paragraph", "content": [{"text": "Tired of wondering what your IQ score really means? Explore these IQ tips and guides, and discover more about your cognitive abilities.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "center"}, "content": [{"text": " IQ Score Chart: What Do Different Scores Mean?", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "center"}, "content": [{"text": "I Want to See！", "type": "text", "marks": [{"type": "link", "attrs": {"href": "/app/22114-iq-test-intelligence-test/", "target": "_self"}}]}]}, {"type": "paragraph", "attrs": {"textAlign": "center"}, "content": [{"text": " You will remain in the same website", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "The following chart provides a general guide to commonly used IQ score ranges.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "These categories are only general guidelines. The exact interpretation of an IQ score depends on the test, scoring system, age group, and other factors.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "What Does an IQ Score of 100 Mean?", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "An IQ score of 100 is generally considered average.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "It does not mean that someone is simply \"average at everything.\" Instead, a score around 100 indicates that the person's performance is close to the average performance of people in the same comparison group.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "For many standardized IQ tests, scores around 100 are positioned at the center of the distribution.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "What Does an IQ Score Above 100 Mean?", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "An IQ score above 100 generally indicates performance above the average of the comparison group.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "The higher the score, the more a person may have demonstrated strengths in the abilities measured by that particular test.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "However, an IQ score should be viewed as one measurement rather than a complete description of someone's intelligence.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "What Does an IQ Score of 120 Mean?", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "An IQ score of 120 is generally considered above average and indicates stronger performance than the average test taker.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "People scoring around this range may demonstrate good abilities in areas such as logical reasoning, identifying patterns, and solving unfamiliar problems.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "Keep in mind that an IQ score does not measure every type of intelligence or every skill that contributes to success.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "What Does an IQ Score of 150+ Mean?", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "An IQ score above 150 is extremely uncommon.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "At very high score levels, the interpretation can become more dependent on the specific test and its scoring method. Some tests have limited ability to distinguish accurately between extremely high scores.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "For this reason, a very high IQ score should be interpreted in the context of the test used rather than treated as an absolute measurement of intelligence.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "center"}, "content": [{"text": "🔥 Get the App", "type": "text", "marks": [{"type": "link", "attrs": {"href": "/app/22114-iq-test-intelligence-test/", "target": "_self"}}]}]}, {"type": "paragraph", "attrs": {"textAlign": "center"}, "content": [{"text": " Notice: You are about to leave our site and visit the official website.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "What Is a Good IQ Score?", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "There is no single IQ score that can be considered \"good\" for every situation.", "type": "text"}]}, {"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"text": "In general:", "type": "text"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Around 100: Average", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "110–119: Above average", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "120–129: High or above average", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "130+: Very high on many standardized scoring systems", "type": "text"}]}]}]}, {"type": "paragraph", "content": [{"text": "The important point is that an IQ score describes performance on specific cognitive tasks. It does not determine how intelligent, successful, creative, or capable someone will be in everyday life.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "Is 100 a Good IQ Score?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Yes. An IQ score of 100 is considered a typical average score on many standardized IQ tests.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Being in the average range does not mean that a person lacks strong abilities. Intelligence includes many different skills, and an individual may excel in areas that are not fully measured by a particular IQ test.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "Is 120 a High IQ?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "An IQ score of 120 is generally considered above average and is higher than the score of most people who perform around the test's average.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "It can indicate strong performance in several cognitive areas, depending on the assessment.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "Is 130 a High IQ?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Yes. An IQ score of 130 is generally considered very high on commonly used IQ scoring systems.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "However, whether a score qualifies for a particular category can depend on the test's scoring method and the organization interpreting the result.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "Does a Higher IQ Mean You Are More Intelligent?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Not necessarily.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "IQ tests primarily measure specific cognitive abilities. They generally do not capture every aspect of intelligence, including:", "type": "text"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Creativity", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Emotional intelligence", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Communication skills", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Practical intelligence", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Motivation", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Leadership", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Social skills", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Artistic ability", "type": "text"}]}]}]}, {"type": "paragraph", "content": [{"text": "A higher IQ may indicate stronger performance on the skills measured by an IQ test, but it should not be treated as a complete measurement of a person's intelligence.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2, "textAlign": "left"}, "content": [{"text": "Why Can My IQ Score Change?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Your IQ test result may change when you take different tests or take the same type of test at different times.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Several factors can influence your performance, including:", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Test type: Different IQ tests measure different combinations of cognitive abilities.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Practice: Familiarity with common question formats can improve performance.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Concentration: Distractions, stress, or fatigue may affect your results.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Testing conditions: Time limits, environment, and instructions can influence performance.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Scoring method: Different assessments may use different norms and scoring systems.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Because of these factors, a single online IQ test should generally be viewed as an estimate rather than a permanent label.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "How Accurate Are Online IQ Tests?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Online IQ tests can provide an interesting estimate of cognitive performance, but their accuracy varies considerably.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "A professionally administered standardized assessment may use controlled testing conditions, validated questions, and age-based norms. Some online tests are designed primarily for entertainment or general self-assessment.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "If you want to understand your cognitive abilities more reliably, consider the quality, methodology, and scoring system of the test rather than focusing only on the final number.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "How to Get a More Meaningful IQ Test Result", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "If you want to get the most useful result from an IQ test, try to:", "type": "text"}]}, {"type": "orderedList", "attrs": {"start": 1}, "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Take the test in a quiet environment.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Make sure you have enough time and are not overly tired.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Read each question carefully.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Avoid using outside assistance unless the test specifically allows it.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Focus on accuracy as well as speed.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Consider the test's scoring method when interpreting your result.", "type": "text"}]}]}]}, {"type": "paragraph", "content": [{"text": "Your score is most meaningful when you understand what the test actually measures.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "IQ Scores Are Only One Part of the Picture", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "An IQ score can give you insight into certain cognitive abilities, but it should not be used as a complete definition of intelligence.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Two people with the same IQ score can have very different strengths, personalities, interests, and abilities. Likewise, someone with a lower score on one test may perform extremely well in areas that the test does not measure.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Think of an IQ score as one piece of information about how you performed on a particular set of cognitive tasks, rather than a permanent definition of who you are.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "Want to Know Your IQ?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Curious about where you stand?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Take an IQ test to challenge your logical reasoning, pattern recognition, problem-solving, and other cognitive skills.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Test Your IQ and See Your Score", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "Frequently Asked Questions About IQ Scores", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "What is the average IQ score?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "The average IQ score is generally set at 100 on many standardized IQ tests.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "What IQ score is considered high?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "An IQ score above 100 is generally above average. Scores around 120 or higher are often considered high, while 130 or higher is commonly described as very high.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Is an IQ of 100 normal?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Yes. An IQ of 100 is generally considered an average score.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Is an IQ of 120 good?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "An IQ of 120 is generally above average and indicates stronger performance than the average score on many standardized IQ tests.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Is an IQ of 130 considered gifted?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "A score of 130 is often considered very high and may meet the IQ threshold used by some organizations for giftedness. However, giftedness is usually evaluated using more than a single test score.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Can IQ increase?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Test performance can improve through learning, practice, familiarity with question types, and better testing conditions. However, changes in an IQ test score should not automatically be interpreted as a direct change in overall intelligence.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Does IQ predict success?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "IQ can be related to performance in some academic and cognitive tasks, but it does not determine future success. Motivation, education, personality, creativity, social skills, opportunities, and many other factors also matter.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "What is the highest possible IQ?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "There is no single universally accepted maximum IQ score. Different tests use different scoring systems, ranges, and methods for estimating very high scores.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Should I take another IQ test?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "If you want to explore your cognitive strengths or compare your performance across different types of questions, taking another well-designed test can be interesting. However, results from different tests should not always be directly compared because their scoring systems may", "type": "text"}]}]}

article.content.push({
  type: 'paragraph',
  content: [
    {
      type: 'text',
      text: 'Custom link：使用 id + title 由使用者回调生成完整 href',
      marks: [
        {
          type: 'link',
          attrs: {
            type: 'custom',
            id: 'memory-signs',
            title: 'Know Your Early Memory Signs',
            target: '_self',
          },
        },
      ],
    },
  ],
})

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
    resolveCustomLink(attrs: Readonly<CustomLinkMarkAttrs>): string {
      return `/detail/${encodeURIComponent(attrs.id)}/${encodeURIComponent(attrs.title)}`
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
            :resolve-custom-link="resolveCustomLink"
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
