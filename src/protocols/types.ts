import type { CreateElement, VNode } from 'vue'
import type { NavigationSession } from '../core/resource-question.js'
import type {
  ArticleButtonClickPayload,
  RenderIssue,
  ResolveArticleButtonLink,
  ResolveCustomLink,
  ValidationResult,
} from '../types.js'

export interface RenderContext {
  createElement: CreateElement
  customSlots: readonly ResolvedCustomSlot[]
  imageBaseUrl: string
  resolveArticleButtonLink?: ResolveArticleButtonLink
  resolveCustomLink?: ResolveCustomLink
  emitArticleButtonClick: (payload: ArticleButtonClickPayload) => void
  reportIssue: (issue: RenderIssue) => void
  navigation: NavigationSession
}

export interface ResolvedCustomSlot {
  id: string
  location: number
  content: readonly VNode[]
}

export interface ProtocolAdapter {
  version: number
  validate: (document: unknown) => ValidationResult
  render: (document: unknown, context: RenderContext) => VNode[]
}
