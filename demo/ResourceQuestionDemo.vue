<script lang="ts">
import Vue from 'vue'
import ArticleContentRenderer, { type ArticleDocument, type ArticleRendererRuntime, type RenderIssue, type ResourceQuestionSelectEvent, type ResourceQuestionNavigationRequest } from '../src'
import example from '../examples/resource-question.json'
import JsonDocumentInput from './JsonDocumentInput.vue'
import RevealControls from './RevealControls.vue'

const freshDocument = (): ArticleDocument => JSON.parse(JSON.stringify(example))

export default Vue.extend({
  name: 'ResourceQuestionDemo',
  components: { ArticleContentRenderer, JsonDocumentInput, RevealControls },
  data() {
    return {
      article: freshDocument(),
      defaultArticle: freshDocument(),
      articleKey: 1,
      revealedKeys: [] as string[],
      runtime: null as ArticleRendererRuntime | null,
      mode: 'delay',
      manualNavigation: false,
      pendingNavigation: null as ResourceQuestionNavigationRequest | null,
      requestSequence: 0,
      lastEvent: null as ResourceQuestionSelectEvent | null,
      status: '请选择一个选项。',
      issues: [] as RenderIssue[],
      timer: null as ReturnType<typeof setTimeout> | null,
    }
  },
  beforeDestroy() { this.cancel() },
  methods: {
    rememberRuntime(runtime: ArticleRendererRuntime) { this.runtime = runtime },
    changeNavigationMode(enabled: boolean) {
      this.runtime?.cancelPendingNavigation()
      this.pendingNavigation = null
      this.manualNavigation = enabled
    },
    handleAnchorNavigate(request: ResourceQuestionNavigationRequest) {
      this.pendingNavigation = request
    },
    navigateToSelection() {
      this.pendingNavigation?.scrollToAnchor()
      this.pendingNavigation = null
    },
    getScrollContainer(): HTMLElement | null { return this.$refs.content as HTMLElement ?? null },
    invalidateRequest() {
      this.requestSequence += 1
      if (this.timer !== null) clearTimeout(this.timer)
      this.timer = null
    },
    cancel() {
      this.invalidateRequest()
      this.pendingNavigation = null
      this.runtime?.cancelPendingNavigation()
      this.status = '已取消待处理选择和定位。'
    },
    reset() {
      this.cancel()
      this.revealedKeys = []
      this.status = '已重新隐藏后续内容。'
    },
    applyDocument(article: ArticleDocument) {
      this.reset()
      this.articleKey += 1
      this.article = article
      this.lastEvent = null
      this.issues = []
      this.status = '已应用文章 JSON，阅读进度已清空。'
    },
    switchArticle() {
      this.applyDocument(freshDocument())
      this.status = '已切换文章，阅读进度已清空。'
    },
    unlockAll() {
      // External authorization can also supply keys from the current complete snapshot.
      this.revealedKeys = this.article.content.flatMap((node) => node.type === 'resourceQuestion' ? [node.attrs.revealKey] : [])
      this.status = '宿主已允许显示全文。'
    },
    revealContent(revealKey: string) {
      this.revealedKeys = [...new Set([...this.revealedKeys, revealKey])]
      this.status = `宿主已允许 ${revealKey}；前面的未解锁问题仍会阻挡后文。`
    },
    hideContent(revealKey: string) {
      this.cancel()
      this.revealedKeys = this.revealedKeys.filter((key) => key !== revealKey)
      this.status = `已移除 ${revealKey}，对应后文重新隐藏。`
    },
    async selectOption(event: ResourceQuestionSelectEvent) {
      // A new renderer click already replaces the pending target; invalidate only old requests.
      this.invalidateRequest()
      this.pendingNavigation = null
      this.lastEvent = event
      const sequence = this.requestSequence
      const articleKey = this.articleKey
      const mode = this.mode
      if (mode === 'reject') {
        this.runtime?.cancelPendingNavigation()
        this.status = '宿主拒绝了本次选择，后续内容保持隐藏。'
        return
      }
      this.status = mode === 'delay' ? '等待宿主业务结果…' : '宿主已允许本次选择。'
      if (mode === 'delay') await new Promise<void>((resolve) => { this.timer = setTimeout(resolve, 800) })
      if (sequence !== this.requestSequence || articleKey !== this.articleKey) return
      this.timer = null
      this.revealedKeys = [...new Set([...this.revealedKeys, event.revealKey])]
      this.status = this.manualNavigation
        ? '宿主已允许显示；滚动由页面回调决定，可点击“滚动到所选锚点”。'
        : '宿主已允许；可见目标会自动定位，更后的目标继续等待解锁。'
    },
    reportIssue(issue: RenderIssue) { this.issues.push(issue) },
  },
})
</script>

<template>
  <main class="question-demo">
    <header>
      <a href="/">返回原有文章 Demo</a>
      <h1>资源问题 · Vue 2</h1>
      <p>两个阅读步骤，独立的解锁标识。试试连续选择、取消或在等待期间切换文章。</p>
    </header>
    <JsonDocumentInput :document="article" :default-document="defaultArticle" @apply="applyDocument" />
    <section class="question-demo__controls" aria-label="宿主控制">
      <label>业务行为
        <select v-model="mode">
          <option value="delay">800ms 后允许</option>
          <option value="allow">立即允许</option>
          <option value="reject">拒绝</option>
        </select>
      </label>
      <button type="button" @click="cancel">取消本次操作</button>
      <button type="button" @click="reset">重新隐藏</button>
      <button type="button" @click="unlockAll">宿主允许全文</button>
      <button type="button" @click="switchArticle">切换文章</button>
    </section>
    <p role="status">{{ status }}</p>
    <p>当前文章：{{ articleKey }}</p>
    <RevealControls
      :document="article"
      :revealed-keys="revealedKeys"
      :last-event="lastEvent"
      :manual-navigation="manualNavigation"
      :pending-navigation="pendingNavigation"
      @navigation-mode="changeNavigationMode"
      @navigate="navigateToSelection"
      @load-example="switchArticle"
      @reveal="revealContent"
      @hide="hideContent"
    />
    <article ref="content" class="question-demo__content">
      <ArticleContentRenderer
        :key="articleKey"
        :document="article"
        :article-key="articleKey"
        :revealed-keys="revealedKeys"
        :on-anchor-navigate="manualNavigation ? handleAnchorNavigate : undefined"
        :scroll-container="getScrollContainer"
        :scroll-offset="16"
        strict
        @renderer-ready="rememberRuntime"
        @option-select="selectOption"
        @render-error="reportIssue"
      />
    </article>
    <details v-if="lastEvent" open><summary>最近的选项事件</summary><pre>{{ JSON.stringify(lastEvent, null, 2) }}</pre></details>
    <ul v-if="issues.length"><li v-for="(issue, index) in issues" :key="index">{{ issue.code }}：{{ issue.message }}</li></ul>
    <details><summary>完整文章 JSON</summary><pre>{{ JSON.stringify(article, null, 2) }}</pre></details>
  </main>
</template>

<style scoped>
.question-demo { max-width: 960px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
.question-demo__controls { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
.question-demo__controls button, .question-demo__controls select { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font: inherit; cursor: pointer; }
.question-demo__content { max-height: 65vh; overflow: auto; padding: 1.5rem; background: white; border: 1px solid #cbd5e1; border-radius: 12px; }
details { margin: 1rem 0; }
pre { overflow: auto; padding: 1rem; background: #f1f5f9; }
</style>
