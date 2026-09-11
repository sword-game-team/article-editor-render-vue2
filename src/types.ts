export type ProtocolVersion = 1

export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type ImageAlign = 'left' | 'center' | 'right'
export type ImageLayout = 'two-column'
export type ArticleButtonStyle = 'text' | 'button' | 'link'
export type LinkTarget = '_blank' | '_self'

export interface CustomSlot {
  id: string
  location: number
}

export interface BoldMark {
  type: 'bold'
}

export interface ItalicMark {
  type: 'italic'
}

export interface StrikeMark {
  type: 'strike'
}

export interface UnderlineMark {
  type: 'underline'
}

export interface CodeMark {
  type: 'code'
}

export interface HrefLinkMarkAttrs {
  type?: 'href'
  href: string
  id?: never
  title?: never
  target?: LinkTarget
}

export interface CustomLinkMarkAttrs {
  type: 'custom'
  id: string
  title: string
  href?: never
  target?: LinkTarget
}

export interface HrefLinkMark {
  type: 'link'
  attrs: HrefLinkMarkAttrs
}

export interface CustomLinkMark {
  type: 'link'
  attrs: CustomLinkMarkAttrs
}

export type LinkMark = HrefLinkMark | CustomLinkMark

export interface TextStyleMark {
  type: 'textStyle'
  attrs: { color: string }
}

export interface HighlightMark {
  type: 'highlight'
  attrs: { color: string }
}

export type ArticleMark =
  | BoldMark
  | ItalicMark
  | StrikeMark
  | UnderlineMark
  | CodeMark
  | LinkMark
  | TextStyleMark
  | HighlightMark

export interface TextNode {
  type: 'text'
  text: string
  marks?: ArticleMark[]
}

export interface ParagraphNode {
  type: 'paragraph'
  attrs?: {
    textAlign?: TextAlign
    anchorId?: string
    fontSize?: number
  }
  content?: TextNode[]
}

export interface HeadingNode {
  type: 'heading'
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6
    textAlign?: TextAlign
    anchorId?: string
  }
  content?: TextNode[]
}

export interface BlockquoteNode {
  type: 'blockquote'
  content: BlockNode[]
}

export interface BulletListNode {
  type: 'bulletList'
  content: ListItemNode[]
}

export interface OrderedListNode {
  type: 'orderedList'
  attrs?: {
    start?: number
  }
  content: ListItemNode[]
}

export interface ListItemNode {
  type: 'listItem'
  content: BlockNode[]
}

export interface CodeBlockTextNode {
  type: 'text'
  text: string
}

export interface CodeBlockNode {
  type: 'codeBlock'
  attrs?: {
    language?: string
  }
  content?: CodeBlockTextNode[]
}

export interface HorizontalRuleNode {
  type: 'horizontalRule'
}

export interface ImageNode {
  type: 'image'
  attrs: {
    src: string
    alt?: string
    title?: string
    width?: number
    height?: number
    imageAlign?: ImageAlign
    imageLayout?: ImageLayout
  }
}

interface ArticleButtonBaseAttrs {
  title?: string
  text: string
}

export interface ArticleButtonActionAttrs extends ArticleButtonBaseAttrs {
  id: string
  style: 'text' | 'button'
  href?: never
}

export interface ArticleButtonLinkAttrs extends ArticleButtonBaseAttrs {
  id?: string
  style: 'link'
  href?: string
}

export type ArticleButtonAttrs = ArticleButtonActionAttrs | ArticleButtonLinkAttrs

export interface ArticleButtonActionNode {
  type: 'articleButton'
  attrs: ArticleButtonActionAttrs
}

export interface ArticleButtonLinkNode {
  type: 'articleButton'
  attrs: ArticleButtonLinkAttrs
}

export type ArticleButtonNode = ArticleButtonActionNode | ArticleButtonLinkNode

export interface ResourceQuestionOption {
  id: string
  label: string
  targetAnchorId?: string
}

export interface ResourceQuestionAttrs {
  id: string
  resourceId: string
  title: string
  description: string
  options: ResourceQuestionOption[]
  hideFollowing: boolean
  revealKey: string
}

export interface ResourceQuestionNode {
  type: 'resourceQuestion'
  attrs: ResourceQuestionAttrs
}

export interface ResourceQuestionSelectEvent {
  questionId: string
  resourceId: string
  optionId: string
  /** Read-only copy of the selected option's saved protocol attributes. */
  option: Readonly<ResourceQuestionOption>
  revealKey: string
  targetAnchorId?: string
}

/** One option click's navigation request. Methods become no-ops after cancellation or replacement. */
export interface ResourceQuestionNavigationRequest extends ResourceQuestionSelectEvent {
  targetAnchorId: string
  scrollToAnchor(): void
  cancel(): void
}

/** Suppresses automatic navigation; call request.scrollToAnchor() when the host is ready. */
export type OnAnchorNavigate = (
  request: Readonly<ResourceQuestionNavigationRequest>,
) => void | Promise<void>

/** Delivered through renderer-ready; keep one handle per renderer instance. */
export interface ArticleRendererRuntime {
  cancelPendingNavigation(): void
}

export interface TableNode {
  type: 'table'
  content: TableRowNode[]
}

export interface TableRowNode {
  type: 'tableRow'
  content: TableCellNode[]
}

export interface TableCellNode {
  type: 'tableCell'
  content: BlockNode[]
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | BulletListNode
  | OrderedListNode
  | CodeBlockNode
  | HorizontalRuleNode
  | ImageNode
  | ArticleButtonNode
  | TableNode

export interface ArticleDocument {
  type: 'doc'
  content: TopLevelNode[]
}

export type TopLevelNode = BlockNode | ResourceQuestionNode

export type ArticleContentNode =
  | ArticleDocument
  | BlockNode
  | ResourceQuestionNode
  | ListItemNode
  | TableRowNode
  | TableCellNode
  | TextNode

export interface ArticleButtonLinkDescriptor {
  href: string
  target?: LinkTarget
  rel?: string
}

export type ArticleButtonLink = string | ArticleButtonLinkDescriptor | null

export type ResolveArticleButtonLink = (
  attrs: Readonly<ArticleButtonActionAttrs>,
  node: Readonly<ArticleButtonActionNode>,
) => ArticleButtonLink

export interface CustomLinkDescriptor {
  href: string
  target?: LinkTarget
  rel?: string
}

export type CustomLink = string | CustomLinkDescriptor | null

export type ResolveCustomLink = (
  attrs: Readonly<CustomLinkMarkAttrs>,
  mark: Readonly<CustomLinkMark>,
) => CustomLink

export type RenderIssueCode =
  | 'INVALID_ROOT'
  | 'INVALID_TYPE'
  | 'INVALID_CONTENT'
  | 'INVALID_VALUE'
  | 'MISSING_PROPERTY'
  | 'UNKNOWN_PROPERTY'
  | 'UNKNOWN_NODE'
  | 'UNKNOWN_MARK'
  | 'TABLE_COLUMN_MISMATCH'
  | 'UNSAFE_URL'
  | 'LINK_RESOLUTION_FAILED'
  | 'UNSUPPORTED_PROTOCOL'
  | 'DUPLICATE_IDENTITY'
  | 'MISSING_ANCHOR'
  | 'NAVIGATION_CALLBACK_FAILED'

export interface RenderIssue {
  code: RenderIssueCode
  path: string
  message: string
  nodeType?: string
  severity?: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  issues: RenderIssue[]
}

export interface ArticleButtonClickPayload {
  attrs: Readonly<ArticleButtonAttrs>
  node: Readonly<ArticleButtonNode>
  href: string | null
  event: MouseEvent
}

