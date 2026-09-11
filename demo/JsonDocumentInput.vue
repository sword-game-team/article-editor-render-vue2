<script lang="ts">
import Vue, { type PropType } from 'vue'
import { validateArticleDocument, type ArticleDocument } from '../src'

export default Vue.extend({
  name: 'JsonDocumentInput',
  props: {
    document: { type: Object as PropType<ArticleDocument>, required: true },
    defaultDocument: { type: Object as PropType<ArticleDocument>, required: true },
  },
  data() {
    return {
      source: JSON.stringify(this.document, null, 2),
      error: '',
      status: '',
    }
  },
  watch: {
    document(value: ArticleDocument) {
      this.source = JSON.stringify(value, null, 2)
      this.error = ''
    },
  },
  methods: {
    clearFeedback() { this.error = ''; this.status = '' },
    apply() {
      this.clearFeedback()
      let parsed: unknown
      try {
        parsed = JSON.parse(this.source)
      } catch (error) {
        this.error = `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`
        return
      }
      const validation = validateArticleDocument(parsed)
      if (!validation.valid) {
        this.error = '协议校验失败：\n' + validation.issues
          .filter((issue) => issue.severity !== 'warning')
          .map((issue) => `${issue.path || '/'}：${issue.message}`)
          .join('\n')
        return
      }
      this.$emit('apply', parsed as ArticleDocument)
      this.source = JSON.stringify(parsed, null, 2)
      this.status = '已应用文章 JSON。'
    },
    restoreExample() {
      this.source = JSON.stringify(this.defaultDocument, null, 2)
      this.apply()
    },
  },
})
</script>

<template>
  <section class="json-input" aria-label="传入文章 JSON">
    <h2>传入文章 JSON</h2>
    <p>粘贴完整文章 JSON，点击“应用 JSON”更新预览。解析或协议校验失败时保留当前文章。</p>
    <textarea
      v-model="source"
      aria-label="文章 JSON"
      :aria-invalid="Boolean(error)"
      rows="10"
      spellcheck="false"
      @input="clearFeedback"
    ></textarea>
    <div class="json-input__actions">
      <button type="button" @click="apply">应用 JSON</button>
      <button type="button" @click="restoreExample">恢复示例</button>
    </div>
    <p v-if="error" class="json-input__error" role="alert">{{ error }}</p>
    <p v-if="status" role="status">{{ status }}</p>
  </section>
</template>

<style scoped>
.json-input { margin: 1.25rem 0; padding: 1rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #1e293b; }
.json-input h2 { margin: 0 0 0.5rem; font-size: 1.125rem; }
.json-input p { margin: 0.5rem 0; font-size: 0.875rem; line-height: 1.6; }
.json-input textarea { box-sizing: border-box; display: block; width: 100%; min-height: 12rem; padding: 0.75rem; resize: vertical; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; color: #1e293b; font: 0.8125rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.json-input textarea:focus-visible, .json-input button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.json-input textarea[aria-invalid="true"] { border-color: #b42318; }
.json-input__actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
.json-input button { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #1e293b; font: inherit; cursor: pointer; }
.json-input button:first-child { background: #2563eb; border-color: #2563eb; color: #fff; }
.json-input__error { max-height: 12rem; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: #b42318; }
</style>
