<script lang="ts">
import Vue, { type CreateElement, type PropType, type VNode } from 'vue'
import { DEFAULT_IMAGE_BASE_URL } from '../core/url.js'
import { CURRENT_PROTOCOL_VERSION, getProtocolAdapter, validateArticleDocument } from '../protocols/registry.js'
import type { ResolvedCustomSlot } from '../protocols/types.js'
import type {
  ArticleButtonClickPayload,
  CustomSlot,
  RenderIssue,
  ResolveArticleButtonLink,
  ValidationResult,
} from '../types.js'

function createEmptyCustomSlots(): CustomSlot[] {
  return []
}

function issueKey(issue: RenderIssue): string {
  return `${issue.code}:${issue.path}:${issue.message}`
}

export default Vue.extend({
  name: 'ArticleContentRenderer',
  props: {
    document: {
      type: null as unknown as PropType<unknown>,
      required: true,
    },
    protocolVersion: {
      type: Number,
      default: CURRENT_PROTOCOL_VERSION,
    },
    strict: {
      type: Boolean,
      default: false,
    },
    customSlots: {
      type: Array as PropType<CustomSlot[]>,
      default: createEmptyCustomSlots,
    },
    imageBaseUrl: {
      type: String,
      default: DEFAULT_IMAGE_BASE_URL,
    },
    resolveArticleButtonLink: {
      type: Function as PropType<ResolveArticleButtonLink>,
      default: undefined,
    },
  },
  data() {
    return {
      reportedRuntimeIssues: new Set<string>(),
    }
  },
  computed: {
    validation(): ValidationResult {
      return validateArticleDocument(this.document, { protocolVersion: this.protocolVersion })
    },
  },
  watch: {
    validation: {
      immediate: true,
      deep: true,
      handler(result: ValidationResult): void {
        result.issues.forEach((issue) => this.$emit('render-error', issue))
      },
    },
    document: {
      deep: true,
      handler(): void {
        this.reportedRuntimeIssues.clear()
      },
    },
    protocolVersion(): void {
      this.reportedRuntimeIssues.clear()
    },
    resolveArticleButtonLink(): void {
      this.reportedRuntimeIssues.clear()
    },
    imageBaseUrl(): void {
      this.reportedRuntimeIssues.clear()
    },
  },
  methods: {
    resolveCustomSlots(): ResolvedCustomSlot[] {
      return this.customSlots.map((slot) => {
        const slotScope = { id: slot.id, location: slot.location }
        const content = this.$scopedSlots[slot.id]?.(slotScope) ?? this.$slots[slot.id] ?? []
        return { ...slot, content }
      })
    },
    reportRuntimeIssue(issue: RenderIssue): void {
      const key = issueKey(issue)
      if (this.reportedRuntimeIssues.has(key)) return
      this.reportedRuntimeIssues.add(key)
      this.$nextTick(() => this.$emit('render-error', issue))
    },
  },
  render(createElement: CreateElement): VNode {
    const adapter = getProtocolAdapter(this.protocolVersion)
    if (!adapter || (this.strict && !this.validation.valid)) {
      return createElement(
        'div',
        {
          class: 'acp-render-error',
          attrs: {
            role: 'alert',
            'data-render-error': 'true',
          },
        },
        'Invalid article content',
      )
    }

    const children = adapter.render(this.document, {
      createElement,
      customSlots: this.resolveCustomSlots(),
      imageBaseUrl: this.imageBaseUrl,
      resolveArticleButtonLink: this.resolveArticleButtonLink,
      emitArticleButtonClick: (payload: ArticleButtonClickPayload) =>
        this.$emit('article-button-click', payload),
      reportIssue: this.reportRuntimeIssue,
    })

    return createElement(
      'div',
      {
        class: 'acp-document',
        attrs: {
          'data-node-type': 'doc',
          'data-protocol-version': this.protocolVersion,
        },
      },
      children,
    )
  },
})
</script>

<style src="../styles.css"></style>
