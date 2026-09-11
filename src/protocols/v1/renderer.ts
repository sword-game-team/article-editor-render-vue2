import type { VNode, VNodeChildren, VNodeData } from 'vue'
import type {
  ArticleButtonAttrs,
  ArticleButtonLinkDescriptor,
  ArticleButtonNode,
  CustomLinkMark,
  CustomLinkMarkAttrs,
  ImageAlign,
  LinkTarget,
  RenderIssue,
  TextAlign,
} from '../../types.js'
import { replaceImageBaseUrl, sanitizeUrl, secureRel } from '../../core/url.js'
import type { RenderContext, ResolvedCustomSlot } from '../types.js'

type UnknownRecord = Record<string, unknown>
type RenderedChild = VNode | string

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'codeBlock',
  'horizontalRule',
  'image',
  'articleButton',
  'table',
])

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function recordValue(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function createVNode(
  context: RenderContext,
  tag: string,
  propsOrChildren?: UnknownRecord | VNodeChildren,
  children?: VNodeChildren,
): VNode {
  const props = isRecord(propsOrChildren) ? propsOrChildren : {}
  const resolvedChildren = isRecord(propsOrChildren) ? children : propsOrChildren
  const data: VNodeData = {}
  const attrs: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') {
      data.class = value as VNodeData['class']
    } else if (key === 'style') {
      data.style = value as VNodeData['style']
    } else if (key === 'hook') {
      data.hook = value as VNodeData['hook']
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase()
      data.on = { ...(data.on ?? {}), [eventName]: value }
    } else if (value !== undefined && value !== false) {
      attrs[key] = value
    }
  }

  if (Object.keys(attrs).length > 0) data.attrs = attrs
  return context.createElement(tag, data, resolvedChildren)
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function childPath(path: string, ...keys: Array<string | number>): string {
  return `${path}/${keys.map(String).join('/')}`
}

function validTextAlign(value: unknown): value is TextAlign {
  return value === 'left' || value === 'center' || value === 'right' || value === 'justify'
}

function validImageAlign(value: unknown): value is ImageAlign {
  return value === 'left' || value === 'center' || value === 'right'
}

function validTarget(value: unknown): value is LinkTarget {
  return value === '_blank' || value === '_self'
}

function report(
  context: RenderContext,
  issue: Omit<RenderIssue, 'nodeType'> & { nodeType?: string },
): void {
  context.reportIssue(issue)
}

function renderText(value: unknown, path: string, context: RenderContext): RenderedChild | null {
  if (!isRecord(value) || value.type !== 'text' || typeof value.text !== 'string' || !value.text) {
    return null
  }

  let rendered: RenderedChild = value.text
  const marks = arrayValue(value.marks)

  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index]
    if (!isRecord(mark) || typeof mark.type !== 'string') continue
    const markPath = childPath(path, 'marks', index)

    switch (mark.type) {
      case 'bold':
        rendered = createVNode(context, 'strong', { class: 'acp-mark acp-mark--bold' }, [rendered])
        break
      case 'italic':
        rendered = createVNode(context, 'em', { class: 'acp-mark acp-mark--italic' }, [rendered])
        break
      case 'strike':
        rendered = createVNode(context, 's', { class: 'acp-mark acp-mark--strike' }, [rendered])
        break
      case 'underline':
        rendered = createVNode(context, 'u', { class: 'acp-mark acp-mark--underline' }, [rendered])
        break
      case 'code':
        rendered = createVNode(context, 'code', { class: 'acp-mark acp-mark--code' }, [rendered])
        break
      case 'textStyle':
      case 'highlight': {
        const attrs = recordValue(mark.attrs)
        if (typeof attrs.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(attrs.color)) {
          rendered = createVNode(context, mark.type === 'highlight' ? 'mark' : 'span', {
            class: `acp-mark acp-mark--${mark.type}`,
            style: mark.type === 'highlight' ? { backgroundColor: attrs.color, color: 'inherit' } : { color: attrs.color },
          }, [rendered])
        }
        break
      }
      case 'link': {
        const attrs = recordValue(mark.attrs)
        const target: LinkTarget = validTarget(attrs.target) ? attrs.target : '_blank'

        if (attrs.type === 'custom') {
          if (
            typeof attrs.id !== 'string' ||
            !attrs.id ||
            typeof attrs.title !== 'string' ||
            !attrs.title
          ) {
            break
          }

          const customAttrs = Object.freeze({
            type: 'custom' as const,
            id: attrs.id,
            title: attrs.title,
            ...(validTarget(attrs.target) ? { target: attrs.target } : {}),
          }) as Readonly<CustomLinkMarkAttrs>
          const customMark = Object.freeze({
            type: 'link' as const,
            attrs: customAttrs,
          }) as Readonly<CustomLinkMark>
          let resolved: ReturnType<typeof normalizeResolvedLink> = null

          if (!context.resolveCustomLink) {
            report(context, {
              code: 'LINK_RESOLUTION_FAILED',
              path: markPath,
              message: 'No resolveCustomLink callback was provided for a custom link mark.',
              nodeType: 'link',
            })
          } else {
            try {
              const result = context.resolveCustomLink(customAttrs, customMark)
              resolved = normalizeResolvedLink(result, target)
              if (!resolved) {
                report(context, {
                  code:
                    typeof result === 'string' ||
                    (isRecord(result) && typeof result.href === 'string')
                      ? 'UNSAFE_URL'
                      : 'LINK_RESOLUTION_FAILED',
                  path: markPath,
                  message: 'The custom link resolver returned no usable safe URL.',
                  nodeType: 'link',
                })
              }
            } catch (error) {
              report(context, {
                code: 'LINK_RESOLUTION_FAILED',
                path: markPath,
                message: `The custom link resolver threw an error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                nodeType: 'link',
              })
            }
          }

          const href = resolved?.href ?? null
          const resolvedTarget = resolved?.target ?? target
          rendered = createVNode(
            context,
            'a',
            {
              class: `acp-link acp-link--custom${!href ? ' acp-link--disabled' : ''}`,
              href: href ?? undefined,
              target: resolvedTarget,
              rel: resolved?.rel ?? secureRel(undefined, resolvedTarget),
              title: customAttrs.title,
              'data-link-type': 'custom',
              'data-link-id': customAttrs.id,
              'aria-disabled': href ? undefined : 'true',
              onClick: href ? undefined : (event: MouseEvent) => event.preventDefault(),
            },
            [rendered],
          )
          break
        }

        if (attrs.type !== undefined && attrs.type !== 'href') break
        const href = sanitizeUrl(attrs.href, 'link')
        if (!href) {
          report(context, {
            code: 'UNSAFE_URL',
            path: childPath(markPath, 'attrs', 'href'),
            message: 'The link URL is empty, malformed, or uses a disallowed protocol.',
            nodeType: 'link',
          })
          break
        }
        rendered = createVNode(context, 
          'a',
          {
            class: 'acp-link',
            href,
            target,
            rel: secureRel(undefined, target),
            'data-link-type': 'href',
          },
          [rendered],
        )
        break
      }
    }
  }

  return rendered
}

function renderInlineContent(value: unknown, path: string, context: RenderContext): RenderedChild[] {
  return arrayValue(value)
    .map((child, index) => renderText(child, childPath(path, index), context))
    .filter((child): child is Exclude<RenderedChild, null> => child !== null)
}

function renderListItem(value: unknown, path: string, context: RenderContext): RenderedChild | null {
  if (!isRecord(value) || value.type !== 'listItem') return null
  return createVNode(context, 
    'li',
    { class: 'acp-list-item', 'data-node-type': 'listItem' },
    renderBlockContent(value.content, childPath(path, 'content'), context),
  )
}

function renderTableCell(value: unknown, path: string, context: RenderContext): RenderedChild | null {
  if (!isRecord(value) || value.type !== 'tableCell') return null
  return createVNode(context, 
    'td',
    { class: 'acp-table-cell', 'data-node-type': 'tableCell' },
    renderBlockContent(value.content, childPath(path, 'content'), context),
  )
}

function renderTableRow(value: unknown, path: string, context: RenderContext): RenderedChild | null {
  if (!isRecord(value) || value.type !== 'tableRow') return null
  const cells = arrayValue(value.content)
    .map((cell, index) => renderTableCell(cell, childPath(path, 'content', index), context))
    .filter((cell): cell is Exclude<RenderedChild, null> => cell !== null)

  return createVNode(context, 'tr', { class: 'acp-table-row', 'data-node-type': 'tableRow' }, cells)
}

function normalizeResolvedLink(
  value: unknown,
  defaultTarget: LinkTarget = '_self',
): { href: string; target: LinkTarget; rel?: string } | null {
  if (isRecord(value) && value.target !== undefined && !validTarget(value.target)) return null
  if (isRecord(value) && value.rel !== undefined && typeof value.rel !== 'string') return null

  const descriptor: ArticleButtonLinkDescriptor | null =
    typeof value === 'string'
      ? { href: value }
      : isRecord(value) && typeof value.href === 'string'
        ? {
            href: value.href,
            ...(validTarget(value.target) ? { target: value.target } : {}),
            ...(typeof value.rel === 'string' ? { rel: value.rel } : {}),
          }
        : null

  if (!descriptor) return null
  const href = sanitizeUrl(descriptor.href, 'link')
  if (!href) return null
  const target = descriptor.target ?? defaultTarget

  return {
    href,
    target,
    rel: secureRel(descriptor.rel, target),
  }
}

function renderArticleButton(
  node: UnknownRecord,
  path: string,
  context: RenderContext,
): RenderedChild | null {
  const rawAttrs = recordValue(node.attrs)
  const isActionStyle = rawAttrs.style === 'text' || rawAttrs.style === 'button'
  const isLinkStyle = rawAttrs.style === 'link'
  if (
    typeof rawAttrs.text !== 'string' ||
    !rawAttrs.text ||
    (!isActionStyle && !isLinkStyle) ||
    (isActionStyle && (typeof rawAttrs.id !== 'string' || !rawAttrs.id)) ||
    (isLinkStyle &&
      rawAttrs.id !== undefined &&
      (typeof rawAttrs.id !== 'string' || !rawAttrs.id))
  ) {
    return null
  }

  const attrs: Readonly<ArticleButtonAttrs> = isLinkStyle
    ? Object.freeze({
        ...(typeof rawAttrs.id === 'string' ? { id: rawAttrs.id } : {}),
        ...(typeof rawAttrs.title === 'string' ? { title: rawAttrs.title } : {}),
        text: rawAttrs.text,
        style: 'link' as const,
        ...(typeof rawAttrs.href === 'string' ? { href: rawAttrs.href } : {}),
      })
    : Object.freeze({
        id: rawAttrs.id as string,
        ...(typeof rawAttrs.title === 'string' ? { title: rawAttrs.title } : {}),
        text: rawAttrs.text,
        style: rawAttrs.style as 'text' | 'button',
      })
  const typedNode = Object.freeze({ type: 'articleButton' as const, attrs }) as Readonly<ArticleButtonNode>

  let resolved: ReturnType<typeof normalizeResolvedLink> = null
  if (attrs.style === 'link') {
    if (attrs.href !== undefined) {
      resolved = normalizeResolvedLink(attrs.href)
      if (!resolved) {
        report(context, {
          code: 'UNSAFE_URL',
          path: `${path}/attrs/href`,
          message: 'The articleButton link href is not a usable safe URL.',
          nodeType: 'articleButton',
        })
      }
    }
  } else if (!context.resolveArticleButtonLink) {
    report(context, {
      code: 'LINK_RESOLUTION_FAILED',
      path,
      message: 'No resolveArticleButtonLink callback was provided for an articleButton node.',
      nodeType: 'articleButton',
    })
  } else {
    try {
      const actionNode = Object.freeze({ type: 'articleButton' as const, attrs })
      const result = context.resolveArticleButtonLink(attrs, actionNode)
      resolved = normalizeResolvedLink(result)
      if (!resolved) {
        report(context, {
          code:
            typeof result === 'string' || (isRecord(result) && typeof result.href === 'string')
              ? 'UNSAFE_URL'
              : 'LINK_RESOLUTION_FAILED',
          path,
          message: 'The articleButton link resolver returned no usable safe URL.',
          nodeType: 'articleButton',
        })
      }
    } catch (error) {
      report(context, {
        code: 'LINK_RESOLUTION_FAILED',
        path,
        message: `The articleButton link resolver threw an error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        nodeType: 'articleButton',
      })
    }
  }

  const href = resolved?.href ?? null
  return createVNode(context, 
    'a',
    {
      class: [
        'acp-article-button',
        `acp-article-button--${attrs.style}`,
        !href && 'acp-article-button--disabled',
      ],
      href: href ?? undefined,
      target: resolved?.target,
      rel: resolved?.rel,
      title: attrs.title,
      'data-node-type': 'articleButton',
      'data-article-button-id': attrs.id,
      'data-article-button-style': attrs.style,
      'aria-disabled': href ? undefined : 'true',
      onClick: (event: MouseEvent) => {
        if (!href) event.preventDefault()
        context.emitArticleButtonClick({ attrs, node: typedNode, href, event })
      },
    },
    attrs.text,
  )
}

function renderBlock(value: unknown, path: string, context: RenderContext): RenderedChild | null {
  if (!isRecord(value) || typeof value.type !== 'string' || !BLOCK_TYPES.has(value.type)) {
    return null
  }

  const attrs = recordValue(value.attrs)
  switch (value.type) {
    case 'paragraph': {
      const textAlign = validTextAlign(attrs.textAlign) ? attrs.textAlign : undefined
      return createVNode(context, 
        'p',
        {
          class: 'acp-paragraph',
          'data-node-type': 'paragraph',
          ...anchorProps(attrs, context),
          style: {
            textAlign,
            fontSize: Number.isInteger(attrs.fontSize) && Number(attrs.fontSize) >= 8 && Number(attrs.fontSize) <= 96 ? `${attrs.fontSize}px` : undefined,
          },
        },
        renderInlineContent(value.content, childPath(path, 'content'), context),
      )
    }
    case 'heading': {
      const level =
        Number.isInteger(attrs.level) && Number(attrs.level) >= 1 && Number(attrs.level) <= 6
          ? Number(attrs.level)
          : 1
      const textAlign = validTextAlign(attrs.textAlign) ? attrs.textAlign : undefined
      return createVNode(context, 
        `h${level}`,
        {
          class: ['acp-heading', `acp-heading--${level}`],
          'data-node-type': 'heading',
          ...anchorProps(attrs, context),
          style: textAlign ? { textAlign } : undefined,
        },
        renderInlineContent(value.content, childPath(path, 'content'), context),
      )
    }
    case 'blockquote':
      return createVNode(context, 
        'blockquote',
        { class: 'acp-blockquote', 'data-node-type': 'blockquote' },
        renderBlockContent(value.content, childPath(path, 'content'), context),
      )
    case 'bulletList': {
      const items = arrayValue(value.content)
        .map((item, index) => renderListItem(item, childPath(path, 'content', index), context))
        .filter((item): item is Exclude<RenderedChild, null> => item !== null)
      return createVNode(context, 'ul', { class: 'acp-list acp-list--bullet', 'data-node-type': 'bulletList' }, items)
    }
    case 'orderedList': {
      const start = Number.isInteger(attrs.start) && Number(attrs.start) >= 1 ? Number(attrs.start) : 1
      const items = arrayValue(value.content)
        .map((item, index) => renderListItem(item, childPath(path, 'content', index), context))
        .filter((item): item is Exclude<RenderedChild, null> => item !== null)
      return createVNode(context, 
        'ol',
        {
          class: 'acp-list acp-list--ordered',
          'data-node-type': 'orderedList',
          start,
        },
        items,
      )
    }
    case 'codeBlock': {
      const language = typeof attrs.language === 'string' && attrs.language ? attrs.language : undefined
      const code = arrayValue(value.content)
        .filter((child) => isRecord(child) && child.type === 'text' && typeof child.text === 'string')
        .map((child) => (child as UnknownRecord).text as string)
        .join('')
      return createVNode(context, 
        'pre',
        {
          class: 'acp-code-block',
          'data-node-type': 'codeBlock',
          'data-language': language,
        },
        [createVNode(context, 'code', { class: language ? `language-${language}` : undefined }, code)],
      )
    }
    case 'horizontalRule':
      return createVNode(context, 'hr', { class: 'acp-horizontal-rule', 'data-node-type': 'horizontalRule' })
    case 'image': {
      const src = sanitizeUrl(replaceImageBaseUrl(attrs.src, context.imageBaseUrl), 'image')
      if (!src) {
        report(context, {
          code: 'UNSAFE_URL',
          path: childPath(path, 'attrs', 'src'),
          message: 'The image URL is empty, malformed, or uses a disallowed protocol.',
          nodeType: 'image',
        })
        return null
      }
      const imageAlign: ImageAlign = validImageAlign(attrs.imageAlign) ? attrs.imageAlign : 'center'
      const width =
        Number.isInteger(attrs.width) && Number(attrs.width) >= 1 && Number(attrs.width) <= 10_000
          ? Number(attrs.width)
          : undefined
      const height =
        Number.isInteger(attrs.height) && Number(attrs.height) >= 1 && Number(attrs.height) <= 10_000
          ? Number(attrs.height)
          : undefined

      return createVNode(context, 
        'div',
        {
          class: ['acp-image', `acp-image--${imageAlign}`],
          'data-node-type': 'image',
          'data-image-align': imageAlign,
          'data-image-layout': attrs.imageLayout === 'two-column' ? 'two-column' : undefined,
        },
        [
          createVNode(context, 'img', {
            class: 'acp-image__element',
            src,
            alt: typeof attrs.alt === 'string' ? attrs.alt : '',
            title: typeof attrs.title === 'string' ? attrs.title : undefined,
            width,
            height,
            'data-image-align': imageAlign,
          }),
        ],
      )
    }
    case 'articleButton':
      return renderArticleButton(value, path, context)
    case 'table': {
      const rows = arrayValue(value.content)
        .map((row, index) => renderTableRow(row, childPath(path, 'content', index), context))
        .filter((row): row is Exclude<RenderedChild, null> => row !== null)
      return createVNode(context, 
        'div',
        { class: 'acp-table-wrapper', 'data-node-type': 'table' },
        [createVNode(context, 'table', { class: 'acp-table' }, [createVNode(context, 'tbody', rows)])],
      )
    }
  }

  return null
}

function anchorProps(attrs: UnknownRecord, context: RenderContext): UnknownRecord {
  if (typeof attrs.anchorId !== 'string' || !/\S/.test(attrs.anchorId)) return {}
  return {
    'data-anchor-id': attrs.anchorId,
    tabindex: -1,
    hook: context.navigation.anchorHooks(attrs.anchorId),
  }
}

function renderResourceQuestion(node: UnknownRecord, context: RenderContext): VNode {
  const attrs = recordValue(node.attrs)
  const options = context.navigation.selections.get(attrs.id as string)
  const children: VNode[] = []
  if (attrs.resourceId === '') {
    children.push(createVNode(context, 'p', { class: 'acp-resource-question__placeholder' }, '暂无问题内容'))
  } else {
    children.push(createVNode(context, 'legend', { class: 'acp-resource-question__title' }, String(attrs.title)))
    if (attrs.description) children.push(createVNode(context, 'p', { class: 'acp-resource-question__description' }, String(attrs.description)))
    children.push(createVNode(context, 'div', { class: 'acp-resource-question__options' },
      arrayValue(attrs.options).filter(isRecord).map((option) => createVNode(context, 'button', {
        type: 'button', class: 'acp-resource-question__option',
        'data-option-id': option.id,
        onClick: () => {
          const event = options?.get(option.id as string)
          if (event) context.navigation.select(event)
        },
      }, String(option.label))),
    ))
  }
  return createVNode(context, 'fieldset', {
    class: 'acp-resource-question', 'data-node-type': 'resourceQuestion',
    'data-question-id': attrs.id,
  }, children)
}

function isColumnImage(node: unknown): boolean {
  return isRecord(node) && node.type === 'image' && recordValue(node.attrs).imageLayout === 'two-column'
}

function appendBlock(rendered: VNode[], node: unknown, path: string, context: RenderContext, previousRow?: VNode): VNode | undefined {
  const child = renderBlock(node, path, context)
  if (!isColumnImage(node)) {
    if (child && typeof child !== 'string') rendered.push(child)
    return undefined
  }
  if (!child || typeof child === 'string') return previousRow
  if (previousRow && (previousRow.children?.length ?? 0) < 2) {
    previousRow.children!.push(child)
    return previousRow
  }
  const row = createVNode(context, 'div', { class: 'acp-image-row' }, [child])
  rendered.push(row)
  return row
}

function renderBlockContent(value: unknown, path: string, context: RenderContext): RenderedChild[] {
  const rendered: VNode[] = []
  let row: VNode | undefined
  arrayValue(value).forEach((node, index) => { row = appendBlock(rendered, node, childPath(path, index), context, row) })
  return rendered
}

function renderDocumentContent(document: UnknownRecord, context: RenderContext): VNode[] {
  const content = arrayValue(document.content)
  const slotsByLocation = new Map<number, ResolvedCustomSlot[]>()

  context.customSlots.forEach((slot) => {
    if (
      !Number.isInteger(slot.location) ||
      slot.location < 1 ||
      slot.location > content.length
    ) {
      return
    }
    const slots = slotsByLocation.get(slot.location) ?? []
    slots.push(slot)
    slotsByLocation.set(slot.location, slots)
  })

  const rendered: VNode[] = []
  const allowed = new Set(context.navigation.options.revealedKeys)
  let row: VNode | undefined
  for (let index = 0; index < content.length; index += 1) {
    const node = content[index]
    const location = index + 1
    slotsByLocation.get(location)?.forEach((slot) => {
      if (slot.content.length) row = undefined
      rendered.push(...slot.content)
    })
    if (isRecord(node) && node.type === 'resourceQuestion') {
      row = undefined
      rendered.push(renderResourceQuestion(node, context))
      const attrs = recordValue(node.attrs)
      if (attrs.hideFollowing === true && !allowed.has(attrs.revealKey as string)) break
    } else row = appendBlock(rendered, node, childPath('/content', index), context, row)
  }
  return rendered
}

export function renderDocumentV1(document: unknown, context: RenderContext): VNode[] {
  if (!isRecord(document) || document.type !== 'doc') return []
  return renderDocumentContent(document, context)
}
