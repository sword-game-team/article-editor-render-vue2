<script lang="ts">
import Vue, {
  type CreateElement,
  type FunctionalComponentOptions,
  type PropType,
  type RenderContext,
  type VNode,
} from 'vue'
import { DEFAULT_IMAGE_BASE_URL } from '../core/url.js'
import { NavigationSession, ResourceNavigation } from '../core/resource-question.js'
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
  ResourceQuestionSelectEvent,
  OnAnchorNavigate,
} from '../types.js'

interface ArticleContentRendererProps {
  document: unknown
  protocolVersion: number
  strict: boolean
  customSlots: CustomSlot[]
  imageBaseUrl: string
  resolveArticleButtonLink?: ResolveArticleButtonLink
  resolveCustomLink?: ResolveCustomLink
  revealedKeys: string[]
  articleKey?: string | number
  scrollContainer?: HTMLElement | (() => HTMLElement | null)
  scrollOffset: number
  onAnchorNavigate?: OnAnchorNavigate
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
    navigationSession: { type: Object as PropType<NavigationSession>, required: true },
    issues: {
      type: Array as PropType<RenderIssue[]>,
      required: true,
    },
  },
  data() {
    return {
      reportedFingerprint: '',
      navigation: new ResourceNavigation(),
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
        const session = this.navigationSession
        this.$nextTick(() => {
          if (session === this.navigationSession && !this.$isServer) issues.forEach((issue) => this.$emit('render-error', issue))
        })
      },
    },
  },
  mounted(): void {
    this.$emit('renderer-ready', this.navigation.api)
    this.navigation.schedule()
  },
  updated(): void { this.navigation.schedule() },
  beforeDestroy(): void { this.navigation.dispose() },
  render(createElement: CreateElement): VNode {
    this.navigation.update(this.navigationSession)
    return this.$slots.default?.[0] ?? createElement()
  },
})

function attachIssueReporter(
  createElement: CreateElement,
  context: RenderContext<ArticleContentRendererProps>,
  children: VNode[],
  issues: RenderIssue[],
  navigationSession: NavigationSession,
): VNode | VNode[] {
  const firstChild = children[0] ?? createElement()
  const renderErrorListener = context.listeners['render-error']
  const reporter = createElement(
    RenderIssueReporter,
    {
      key: context.data.key,
      props: { issues, navigationSession },
      on: {
        ...(renderErrorListener ? { 'render-error': renderErrorListener } : {}),
        ...(context.listeners['renderer-ready'] ? { 'renderer-ready': context.listeners['renderer-ready'] } : {}),
      },
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
    revealedKeys: { type: Array as PropType<string[]>, default: () => [] },
    articleKey: { type: [String, Number], default: undefined },
    scrollContainer: {
      type: null as unknown as PropType<HTMLElement | (() => HTMLElement | null)>,
      default: undefined,
      // Vue 2's Object prop check only accepts plain objects, not actual DOM elements.
      validator: (value: unknown) => typeof value === 'function' ||
        (typeof value === 'object' && value !== null && 'nodeType' in value && value.nodeType === 1),
    },
    scrollOffset: { type: Number, default: 0 },
    onAnchorNavigate: { type: Function as PropType<OnAnchorNavigate>, default: undefined },
  },
  render(createElement, context): VNode | VNode[] {
    const { props } = context
    const validation = validateArticleDocument(props.document, {
      protocolVersion: props.protocolVersion,
    })
    const adapter = getProtocolAdapter(props.protocolVersion)
    const runtimeIssues: RenderIssue[] = []
    const navigationSession = new NavigationSession({
      document: validation.valid ? props.document : null,
      articleKey: props.articleKey,
      revealedKeys: [...props.revealedKeys],
      scrollContainer: props.scrollContainer,
      scrollOffset: props.scrollOffset,
      onAnchorNavigate: props.onAnchorNavigate,
      reportNavigationIssue: (issue) => emitListener(context.listeners['render-error'], issue),
      emitSelect: (event: ResourceQuestionSelectEvent) => emitListener(context.listeners['option-select'], event),
    })
    // Invalid identities and question structure cannot safely participate in visibility/navigation.
    const unsafeQuestion = validation.issues.some((issue) => issue.severity !== 'warning' &&
      (issue.code === 'DUPLICATE_IDENTITY' || issue.nodeType === 'resourceQuestion' ||
        /\/(anchorId|revealKey)(\/|$)/.test(issue.path)))
    const hasQuestion = navigationSession.selections.size > 0 ||
      (props.document && typeof props.document === 'object' && 'content' in props.document &&
        Array.isArray(props.document.content) && props.document.content.some((node: unknown) =>
          node && typeof node === 'object' && 'type' in node && node.type === 'resourceQuestion'))

    if (!adapter || unsafeQuestion || ((props.strict || hasQuestion) && !validation.valid)) {
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
      return attachIssueReporter(createElement, context, [errorNode], validation.issues, navigationSession)
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
      navigation: navigationSession,
    })

    return attachIssueReporter(createElement, context, children, [
      ...validation.issues,
      ...runtimeIssues.filter(
        (issue, index, allIssues) =>
          allIssues.findIndex((candidate) => issueKey(candidate) === issueKey(issue)) === index,
      ),
    ], navigationSession)
  },
} satisfies FunctionalComponentOptions<ArticleContentRendererProps>

export default Vue.extend(ArticleContentRenderer)
</script>

<style src="../styles.css"></style>
