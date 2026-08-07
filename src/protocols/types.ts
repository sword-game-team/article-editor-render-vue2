import type { CreateElement, VNode } from 'vue'
import type {
  ArticleButtonClickPayload,
  RenderIssue,
  ResolveArticleButtonLink,
  ValidationResult,
} from '../types'

export interface RenderContext {
  createElement: CreateElement
  resolveArticleButtonLink?: ResolveArticleButtonLink
  emitArticleButtonClick: (payload: ArticleButtonClickPayload) => void
  reportIssue: (issue: RenderIssue) => void
}

export interface ProtocolAdapter {
  version: number
  validate: (document: unknown) => ValidationResult
  render: (document: unknown, context: RenderContext) => VNode[]
}
