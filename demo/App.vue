<script lang="ts">
import Vue from 'vue'
import JsonDocumentInput from './JsonDocumentInput.vue'
import RevealControls from './RevealControls.vue'
import resourceQuestionExample from '../examples/resource-question.json'
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
  type ArticleRendererRuntime,
  type ResourceQuestionSelectEvent,
  type ResourceQuestionNavigationRequest,
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

const article: ArticleDocument = {"type": "doc", "content": [{"type": "paragraph", "content": [{"text": "It's not unusual for dogs to lose their appetites. However, refusal to eat could signal a deeper issue. If the loss of appetite is sudden and lasts beyond a meal or two, contact your veterinarian, especially if your puppy seems unwell.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "We break down the reasons that puppies sometimes refuse to eat and how to know when it's time to seek a veterinarian's assistance.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "Why Do Puppies Refuse to Eat?", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Anorexia—or loss of appetite—may be abrupt, with your ", "type": "text"}, {"text": "pup suddenly refusing", "type": "text", "marks": [{"type": "link", "attrs": {"id": "58306", "type": "custom", "title": "How to Express a Young Dog's Anal Glands", "target": "_self"}}]}, {"text": " to eat, or gradual, so that it's ", "type": "text"}, {"text": "eating less", "type": "text", "marks": [{"type": "link", "attrs": {"id": "59260", "type": "custom", "title": "Why Is Your Cat's Nose Dry?", "target": "_self"}}]}, {"text": " over time. A number of factors can contribute to your puppy's anorexia.", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Young puppies have smaller fat reserves than adult dogs and can’t go without food longer than about 12 hours before needing medical help.1 Toy breed puppies are particularly prone to potentially deadly drops in blood sugar (hypoglycemia) if they skip a meal.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Finickiness", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Some finicky pups develop preferences for certain foods and refuse to eat anything else. When you give in and feed your puppy its desired food, you've taught it how to get its way.2 If your vet has confirmed that your puppy is otherwise healthy, practicing “tough puppy love” may convince it to eat your choice of food during scheduled feedings.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Stress and High Temperatures", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Stress can suppress your pet's desire to eat. Changes in the home, such as moving, having a baby, or adding a pet to the home are all potential stressors. Being left alone too long or a change in an owner's work schedule can be stressful, especially if your puppy develops separation anxiety. High outdoor temperatures can also impact appetite.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 3}, "content": [{"text": "Illnesses, Parasites, and Teething", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "Anorexia is one of the most common signs of illness in dogs and can occur in conjunction with a fever if an infection is present. Life-threatening viral infections, such as parvovirus, will cause loss of appetite.3 Distemper and other less severe infections such as an upper respiratory infection or intestinal parasites will also affect appetite. Even a ", "type": "text"}, {"text": "sore mouth", "type": "text", "marks": [{"type": "link", "attrs": {"id": "59007", "type": "custom", "title": "How to Keep Your Dog's Teeth Clean", "target": "_self"}}]}, {"text": " from ​teething can make a pup reluctant to eat. Other times, an ingested foreign body (like a swallowed toy or piece of trash) can cause abdominal pain and result in a puppy not wanting to eat.4", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "If your ", "type": "text"}, {"text": "puppy won't eat", "type": "text", "marks": [{"type": "link", "attrs": {"id": "59654", "type": "custom", "title": "Bluetick Coonhound: Dog Breed Characteristics & Care", "target": "_self"}}]}, {"text": " for ", "type": "text"}, {"text": "several meals", "type": "text", "marks": [{"type": "link", "attrs": {"id": "59216", "type": "custom", "title": "Hypoglycemia in Puppies and Small Dogs", "target": "_self"}}]}, {"text": ", contact your veterinarian to rule out any illnesses before trying any techniques to coax your puppy to eat.", "type": "text"}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"text": "How to Get Your Puppy to Eat", "type": "text"}]}, {"type": "paragraph", "content": [{"text": "You’ll need a diagnosis from your veterinarian to figure out why your puppy has stopped eating. If your vet rules out illness, it’s often OK to tempt your puppy with vet-approved ​healthy people food and employ other techniques to encourage them to eat.", "type": "text"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Offer wholesome tidbits", "type": "text", "marks": [{"type": "bold"}]}, {"text": " like a sliver of lean beef or chicken. This will also help you decide if your puppy is just being finicky or really has a problem that needs veterinary attention.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Stimulate your ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "puppy's appetite", "type": "text", "marks": [{"type": "bold"}, {"type": "link", "attrs": {"id": "58957", "type": "custom", "title": "Puppy Vaccine Schedule and Information", "target": "_self"}}]}, {"text": " with pungent-smelling foods that may make eating more attractive. Liverwurst and peanut butter are common favorites.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Give your puppy meat-based baby food,", "type": "text", "marks": [{"type": "bold"}]}, {"text": " which is palatable to most puppies and easier to eat with a sore mouth.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Add warm water or low-sodium chicken broth ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "to dry foods to make a slurry in the blender.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Warm up your puppy's food", "type": "text", "marks": [{"type": "bold"}]}, {"text": " by zapping it in the microwave for 10 seconds or so, which can unlock the food's aroma and pique your pup’s appetite.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Spike your puppy's regular food ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "with yogurt or cottage cheese for another good way to tempt your dog to eat or offer a ", "type": "text"}, {"text": "small amount", "type": "text", "marks": [{"type": "link", "attrs": {"id": "59693", "type": "custom", "title": "Xoloitzcuintli: Explore the Unique Traits and Care of the Mexican Hairless Dog", "target": "_self"}}]}, {"text": " of a stinky canned product with high meat or fat content.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Mix some dry cat food ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "with your pup’s food if you have a cat. The aroma and higher protein content of cat food are very appealing to most dogs.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Try hand-feeding", "type": "text", "marks": [{"type": "bold"}]}, {"text": " your reluctant pup.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Offer your ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "reluctant eater", "type": "text", "marks": [{"type": "bold"}, {"type": "link", "attrs": {"id": "58924", "type": "custom", "title": "Human Food for Dogs With Kidney Disease: Optimizing Canine Health", "target": "_self"}}]}, {"text": " a small amount of food, and when they've had their fill or refuse to eat, take the food away and try again an hour later. Leaving food out for a reluctant eater for long periods may overwhelm the appetite centers in the brain, which may kill any appetite your puppy has left.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Utilize a little behavior modification", "type": "text", "marks": [{"type": "bold"}]}, {"text": " if your veterinarian has ruled out a health issue and your puppy is turning its nose up at even the tastiest foods. Cut back on treats (as with kids, treats tend to spoil a puppy's appetite for meals) and stick to your dog's regular feeding schedule.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Buy a new food dish", "type": "text", "marks": [{"type": "bold"}]}, {"text": " or move the old one to a new location, which might make it a little more interesting; you might even try using a food dispenser that your pup can partially control.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Take your dog for a walk", "type": "text", "marks": [{"type": "bold"}]}, {"text": " or engage in another type of exercise with it before mealtimes if their appetite still isn't what you'd like it to be.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Talk to your ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "veterinarian", "type": "text"}, {"text": " ", "type": "text", "marks": [{"type": "bold"}]}, {"text": "if your puppy's case is severe. She may recommend drugs to help stimulate its appetite, depending on the diagnosis.", "type": "text"}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"text": "Seek veterinary attention immediately", "type": "text", "marks": [{"type": "bold"}]}, {"text": " if your puppy shows signs of ", "type": "text"}, {"text": "low blood sugar", "type": "text", "marks": [{"type": "link", "attrs": {"id": "59600", "type": "custom", "title": "Cairn Terrier: Dog Breed Characteristics & Care", "target": "_self"}}]}, {"text": " (hypoglycemia), such as a drunken-type gait, weakness, and occasional seizures. In the meantime, if it appears weak, you might try boosting its low blood sugar by applying something sweet to its gums, such as a very small amount of pasteurized honey or Karo syrup.", "type": "text"}]}]}]}, {"type": "image", "attrs": {"src": "https://asserts.gameseeks.com/icon/1788165401049629100.jpg", "imageAlign": "center"}}]}

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
    JsonDocumentInput,
    RevealControls,
  },
  data() {
    return {
      article,
      defaultArticle: article,
      articleKey: 1,
      revealedKeys: [] as string[],
      resourceQuestionFooterText: '请选择一个选项，继续阅读后续内容。',
      runtime: null as ArticleRendererRuntime | null,
      lastOption: null as ResourceQuestionSelectEvent | null,
      manualNavigation: false,
      pendingNavigation: null as ResourceQuestionNavigationRequest | null,
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
    applyDocument(document: ArticleDocument): void {
      this.runtime?.cancelPendingNavigation()
      this.pendingNavigation = null
      this.revealedKeys = []
      this.lastOption = null
      this.articleKey += 1
      this.article = document
      this.clearRuntimeState()
    },
    loadRevealExample(): void {
      this.applyDocument(JSON.parse(JSON.stringify(resourceQuestionExample)))
    },
    rememberRuntime(runtime: ArticleRendererRuntime): void { this.runtime = runtime },
    changeNavigationMode(enabled: boolean): void {
      this.runtime?.cancelPendingNavigation()
      this.pendingNavigation = null
      this.manualNavigation = enabled
    },
    handleAnchorNavigate(request: ResourceQuestionNavigationRequest): void {
      this.pendingNavigation = request
    },
    navigateToSelection(): void {
      this.pendingNavigation?.scrollToAnchor()
      this.pendingNavigation = null
    },
    handleOptionSelect(event: ResourceQuestionSelectEvent): void {
      this.pendingNavigation = null
      this.lastOption = event
      // This demo's host policy is "allow on selection". The renderer itself never unlocks.
      this.revealContent(event.revealKey)
    },
    revealContent(revealKey: string): void {
      this.revealedKeys = [...new Set([...this.revealedKeys, revealKey])]
    },
    hideContent(revealKey: string): void {
      this.runtime?.cancelPendingNavigation()
      this.pendingNavigation = null
      this.revealedKeys = this.revealedKeys.filter((key) => key !== revealKey)
    },
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
      <a href="/?demo=resource-question">打开异步解锁、拒绝和取消示例</a>
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

        <JsonDocumentInput :document="article" :default-document="defaultArticle" @apply="applyDocument" />

        <RevealControls
          :document="article"
          :revealed-keys="revealedKeys"
          :last-event="lastOption"
          :footer-text="resourceQuestionFooterText"
          @footer-text="resourceQuestionFooterText = $event"
          :manual-navigation="manualNavigation"
          :pending-navigation="pendingNavigation"
          @navigation-mode="changeNavigationMode"
          @navigate="navigateToSelection"
          @load-example="loadRevealExample"
          @reveal="revealContent"
          @hide="hideContent"
        />
        <p class="demo-hint">本页采用“选择即允许”：点击正文选项后，页面立即更新解锁列表。可点击“载入解锁示例”体验两步解锁。</p>

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
            :key="articleKey"
            :document="article"
            :article-key="articleKey"
            :revealed-keys="revealedKeys"
            :on-anchor-navigate="manualNavigation ? handleAnchorNavigate : undefined"
            :resource-question-footer-text="resourceQuestionFooterText"
            :strict="strict"
            :custom-slots="customSlots"
            :resolve-article-button-link="resolveArticleButtonLink"
            :resolve-custom-link="resolveCustomLink"
            @article-button-click="handleArticleButtonClick"
            @renderer-ready="rememberRuntime"
            @option-select="handleOptionSelect"
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
