<script lang="ts">
import Vue, {
  type CreateElement,
  type FunctionalComponentOptions,
  type PropType,
  type RenderContext,
  type VNode,
} from 'vue'
import { DEFAULT_IMAGE_BASE_URL } from '../core/url.js'
import {
  CURRENT_PROTOCOL_VERSION,
  getProtocolAdapter,
  validateArticleDocument,
} from '../protocols/registry.js'
import type { ResolvedCustomSlot } from '../protocols/types.js'
import type {
  ArticleButtonClickPayload,
  CustomSlot,
  RenderIssue,
  ResolveArticleButtonLink,
  ResolveCustomLink,
} from '../types.js'

interface ArticleContentRendererProps {
  document: unknown
  protocolVersion: number
  strict: boolean
  customSlots: CustomSlot[]
  imageBaseUrl: string
  resolveArticleButtonLink?: ResolveArticleButtonLink
  resolveCustomLink?: ResolveCustomLink
}

function createEmptyCustomSlots(): CustomSlot[] {
  return []
}

function issueKey(issue: RenderIssue): string {
  return `${issue.code}:${issue.path}:${issue.message}`
}

function resolveCustomSlots(
  context: RenderContext<ArticleContentRendererProps>,
): ResolvedCustomSlot[] {
  const slots = context.slots()

  return context.props.customSlots.map((slot) => {
    const slotScope = { id: slot.id, location: slot.location }
    const content = context.scopedSlots[slot.id]?.(slotScope) ?? slots[slot.id] ?? []
    return { ...slot, content }
  })
}

function emitListener(listener: Function | Function[] | undefined, payload: unknown): void {
  if (Array.isArray(listener)) {
    listener.forEach((handler) => handler(payload))
  } else {
    listener?.(payload)
  }
}

const RenderIssueReporter = Vue.extend({
  name: 'ArticleContentRenderIssueReporter',
  props: {
    issues: {
      type: Array as PropType<RenderIssue[]>,
      required: true,
    },
  },
  data(): { reportedFingerprint: string } {
    return {
      reportedFingerprint: '',
    }
  },
  watch: {
    issues: {
      immediate: true,
      deep: true,
      handler(issues: RenderIssue[]): void {
        const fingerprint = issues.map(issueKey).join('|')
        if (fingerprint === this.reportedFingerprint) return
        this.reportedFingerprint = fingerprint
        this.$nextTick(() => issues.forEach((issue) => this.$emit('render-error', issue)))
      },
    },
  },
  render(createElement: CreateElement): VNode {
    return this.$slots.default?.[0] ?? createElement()
  },
})

function attachIssueReporter(
  createElement: CreateElement,
  context: RenderContext<ArticleContentRendererProps>,
  children: VNode[],
  issues: RenderIssue[],
): VNode | VNode[] {
  const firstChild = children[0] ?? createElement()
  const renderErrorListener = context.listeners['render-error']
  const reporter = createElement(
    RenderIssueReporter,
    {
      props: { issues },
      on: renderErrorListener ? { 'render-error': renderErrorListener } : undefined,
    },
    [firstChild],
  )

  return children.length > 1 ? [reporter, ...children.slice(1)] : reporter
}

const ArticleContentRenderer = {
  name: 'ArticleContentRenderer',
  functional: true,
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
    resolveCustomLink: {
      type: Function as PropType<ResolveCustomLink>,
      default: undefined,
    },
  },
  render(createElement, context): VNode | VNode[] {
    const { props } = context
    const validation = validateArticleDocument(props.document, {
      protocolVersion: props.protocolVersion,
    })
    const adapter = getProtocolAdapter(props.protocolVersion)
    const runtimeIssues: RenderIssue[] = []

    if (!adapter || (props.strict && !validation.valid)) {
      const errorNode = createElement(
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
      return attachIssueReporter(createElement, context, [errorNode], validation.issues)
    }

    const children = adapter.render(props.document, {
      createElement,
      customSlots: resolveCustomSlots(context),
      imageBaseUrl: props.imageBaseUrl,
      resolveArticleButtonLink: props.resolveArticleButtonLink,
      resolveCustomLink: props.resolveCustomLink,
      emitArticleButtonClick: (payload: ArticleButtonClickPayload) =>
        emitListener(context.listeners['article-button-click'], payload),
      reportIssue: (issue) => runtimeIssues.push(issue),
    })

    return attachIssueReporter(createElement, context, children, [
      ...validation.issues,
      ...runtimeIssues.filter(
        (issue, index, allIssues) =>
          allIssues.findIndex((candidate) => issueKey(candidate) === issueKey(issue)) === index,
      ),
    ])
  },
} satisfies FunctionalComponentOptions<ArticleContentRendererProps>

export default Vue.extend(ArticleContentRenderer)
</script>

<style src="../styles.css"></style>
