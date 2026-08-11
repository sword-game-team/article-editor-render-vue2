import type { CreateElement, VNode } from 'vue'
import type {
  ArticleButtonClickPayload,
  RenderIssue,
  ResolveArticleButtonLink,
  ValidationResult,
} from '../types.js'

export interface RenderContext {
  createElement: CreateElement
  customSlots: readonly ResolvedCustomSlot[]
  imageBaseUrl: string
  resolveArticleButtonLink?: ResolveArticleButtonLink
  emitArticleButtonClick: (payload: ArticleButtonClickPayload) => void
  reportIssue: (issue: RenderIssue) => void
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
