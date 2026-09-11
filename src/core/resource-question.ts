import { nextTick, type VNode } from 'vue'
import type { ArticleDocument, ArticleRendererRuntime, OnAnchorNavigate, RenderIssue, ResourceQuestionSelectEvent, TopLevelNode } from '../types.js'

type RecordValue = Record<string, unknown>
export function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getVisibleContent(document: ArticleDocument, revealedKeys: readonly string[] = []): TopLevelNode[] {
  const allowed = new Set(revealedKeys)
  const visible: TopLevelNode[] = []
  for (const node of document.content) {
    visible.push(node)
    if (node.type === 'resourceQuestion' && node.attrs.hideFollowing && !allowed.has(node.attrs.revealKey)) break
  }
  return visible
}

export interface NavigationSessionOptions {
  document: unknown
  articleKey?: string | number
  revealedKeys: readonly string[]
  scrollContainer?: HTMLElement | (() => HTMLElement | null)
  scrollOffset: number
  onAnchorNavigate?: OnAnchorNavigate
  reportNavigationIssue(issue: RenderIssue): void
  emitSelect(event: ResourceQuestionSelectEvent): void
}

interface NavigationTask {
  event: ResourceQuestionSelectEvent & { targetAnchorId: string }
  scrollRequested: boolean
}

/** A fresh render's registry; only its owning lifecycle component can activate it. */
export class NavigationSession {
  readonly anchors = new Map<string, HTMLElement>()
  readonly allAnchors = new Set<string>()
  readonly selections = new Map<string, Map<string, ResourceQuestionSelectEvent>>()
  select: (event: ResourceQuestionSelectEvent) => void = () => {}

  constructor(readonly options: NavigationSessionOptions) {
    const collect = (node: unknown): void => {
      if (!isRecord(node)) return
      if ((node.type === 'paragraph' || node.type === 'heading') && isRecord(node.attrs) && typeof node.attrs.anchorId === 'string') {
        this.allAnchors.add(node.attrs.anchorId)
      }
      if (Array.isArray(node.content)) node.content.forEach(collect)
    }
    collect(options.document)
    if (isRecord(options.document) && Array.isArray(options.document.content)) {
      const allowed = new Set(options.revealedKeys)
      for (const node of options.document.content) {
        if (!isRecord(node) || node.type !== 'resourceQuestion' || !isRecord(node.attrs)) continue
        const attrs = node.attrs
        const selections = new Map<string, ResourceQuestionSelectEvent>()
        if (Array.isArray(attrs.options)) attrs.options.forEach((option) => {
          selections.set(option.id, Object.freeze({
            questionId: attrs.id as string, resourceId: attrs.resourceId as string,
            optionId: option.id, revealKey: attrs.revealKey as string,
            ...(option.targetAnchorId !== undefined ? { targetAnchorId: option.targetAnchorId } : {}),
          }))
        })
        this.selections.set(attrs.id as string, selections)
        if (attrs.hideFollowing === true && !allowed.has(attrs.revealKey as string)) break
      }
    }
    Object.seal(this)
  }

  anchorHooks(id: string) {
    const register = (vnode: VNode): void => {
      if (vnode.elm?.nodeType === 1) this.anchors.set(id, vnode.elm as HTMLElement)
    }
    return {
      insert: register,
      postpatch: (_old: VNode, vnode: VNode) => register(vnode),
      destroy: (vnode: VNode): void => {
        if (this.anchors.get(id) === vnode.elm) this.anchors.delete(id)
      },
    }
  }
}

/** Persistent state owned by the renderer's existing, DOM-free lifecycle component. */
export class ResourceNavigation {
  private session?: NavigationSession
  private pending?: NavigationTask
  private generation = 0
  private frame?: number
  private disposed = false
  readonly api: ArticleRendererRuntime = Object.freeze({
    cancelPendingNavigation: () => this.cancelPendingNavigation(),
  })

  constructor() { Object.seal(this) }

  update(session: NavigationSession): void {
    const previous = this.session
    if (previous && (previous.options.document !== session.options.document ||
      previous.options.articleKey !== session.options.articleKey ||
      previous.options.revealedKeys.some((key) => !session.options.revealedKeys.includes(key)))) {
      this.cancelPendingNavigation()
    }
    if (this.pending) {
      const event = this.pending.event
      const latest = session.selections.get(event.questionId)?.get(event.optionId)
      if (!latest || latest.targetAnchorId !== event.targetAnchorId || latest.revealKey !== event.revealKey ||
        !session.allAnchors.has(event.targetAnchorId)) this.cancelPendingNavigation()
    }
    this.session = session
    session.select = (event) => {
      if (this.disposed || this.session !== session) return
      // Register before notifying the host, which may synchronously reveal or cancel.
      this.cancelPendingNavigation()
      const callback = session.options.onAnchorNavigate
      const task: NavigationTask | undefined = event.targetAnchorId && session.allAnchors.has(event.targetAnchorId)
        ? { event: { ...event, targetAnchorId: event.targetAnchorId }, scrollRequested: !callback }
        : undefined
      this.pending = task
      session.options.emitSelect(event)
      if (task && this.pending === task && callback && !this.disposed) {
        const fail = (error: unknown): void => {
          if (this.pending !== task || this.disposed) return
          this.cancelPendingNavigation()
          session.options.reportNavigationIssue({
            code: 'NAVIGATION_CALLBACK_FAILED', path: '', nodeType: 'resourceQuestion',
            message: `onAnchorNavigate failed: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
        try {
          const result = callback(Object.freeze({
            ...task.event,
            scrollToAnchor: () => {
              if (this.pending !== task || this.disposed) return
              task.scrollRequested = true
              this.schedule()
            },
            cancel: () => {
              if (this.pending === task) this.cancelPendingNavigation()
            },
          }))
          // Completing a callback does not imply permission to scroll.
          if (result) void Promise.resolve(result).catch(fail)
        } catch (error) { fail(error) }
      }
      this.schedule()
    }
  }

  cancelPendingNavigation(): void {
    this.pending = undefined
    this.generation += 1
    if (this.frame !== undefined && typeof window !== 'undefined') window.cancelAnimationFrame?.(this.frame)
    this.frame = undefined
  }

  schedule(): void {
    if (!this.pending?.scrollRequested || this.disposed || typeof window === 'undefined') return
    const generation = ++this.generation
    if (this.frame !== undefined) window.cancelAnimationFrame?.(this.frame)
    void nextTick(() => {
      if (this.disposed || generation !== this.generation) return
      const navigate = (): void => {
        this.frame = undefined
        if (this.disposed || generation !== this.generation) return
        this.navigate()
      }
      if (window.requestAnimationFrame) this.frame = window.requestAnimationFrame(navigate)
      else navigate() // The geometry read below forces layout after Vue's DOM commit.
    })
  }

  private navigate(): void {
    const session = this.session
    const id = this.pending?.event.targetAnchorId
    if (!session || !id || !this.pending?.scrollRequested) return
    const target = session.anchors.get(id)
    if (!target?.isConnected) return // Still behind another boundary; retry only on a render.
    const configured = session.options.scrollContainer
    const container = typeof configured === 'function' ? configured() : configured
    if (container && !container.contains(target)) return
    const offset = Number.isFinite(session.options.scrollOffset) ? session.options.scrollOffset : 0
    const top = target.getBoundingClientRect().top
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (container) {
      const position = Math.max(0, container.scrollTop + top - container.getBoundingClientRect().top - container.clientTop - offset)
      if (container.scrollTo) container.scrollTo({ top: position, behavior })
      else container.scrollTop = position
    } else {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - offset), behavior })
    }
    target.focus({ preventScroll: true })
    this.pending = undefined
  }

  dispose(): void {
    this.cancelPendingNavigation()
    this.disposed = true
    this.session = undefined
  }
}
