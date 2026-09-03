import type { PluginObject } from 'vue'
import ArticleContentRenderer from './components/ArticleContentRenderer.vue'

export { ArticleContentRenderer }
export default ArticleContentRenderer

export const ArticleContentRendererPlugin: PluginObject<never> = {
  install(Vue): void {
    Vue.component('ArticleContentRenderer', ArticleContentRenderer)
  },
}

export {
  CURRENT_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
  validateArticleDocument,
} from './protocols/registry.js'
export { ARTICLE_CONTENT_PROTOCOL_V1 } from './protocols/v1/metadata.js'
export type {
  ArticleButtonAttrs,
  ArticleButtonActionAttrs,
  ArticleButtonActionNode,
  ArticleButtonClickPayload,
  ArticleButtonLink,
  ArticleButtonLinkAttrs,
  ArticleButtonLinkDescriptor,
  ArticleButtonLinkNode,
  ArticleButtonNode,
  ArticleButtonStyle,
  ArticleContentNode,
  ArticleDocument,
  ArticleMark,
  BlockNode,
  BlockquoteNode,
  BoldMark,
  BulletListNode,
  CodeBlockNode,
  CodeBlockTextNode,
  CodeMark,
  CustomLink,
  CustomLinkDescriptor,
  CustomLinkMark,
  CustomLinkMarkAttrs,
  CustomSlot,
  HeadingNode,
  HorizontalRuleNode,
  ImageAlign,
  ImageNode,
  ItalicMark,
  HrefLinkMark,
  HrefLinkMarkAttrs,
  LinkMark,
  LinkTarget,
  ListItemNode,
  OrderedListNode,
  ParagraphNode,
  ProtocolVersion,
  RenderIssue,
  RenderIssueCode,
  ResolveArticleButtonLink,
  ResolveCustomLink,
  StrikeMark,
  TableCellNode,
  TableNode,
  TableRowNode,
  TextAlign,
  TextNode,
  UnderlineMark,
  ValidationResult,
} from './types.js'
