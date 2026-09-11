import type { ArticleDocument, ParagraphNode, ResourceQuestionNode } from '../src'

export const paragraph = (anchorId: string): ParagraphNode => ({
  type: 'paragraph', attrs: { anchorId }, content: [{ type: 'text', text: anchorId }],
})

export const question = (id: string, targetAnchorId?: string): ResourceQuestionNode => ({
  type: 'resourceQuestion', attrs: {
    id, resourceId: 'shared-resource', title: `Question ${id}`, description: 'Saved description',
    options: [{ id: 'stable-a', label: 'Same label', ...(targetAnchorId ? { targetAnchorId } : {}) },
      { id: 'stable-b', label: 'Same label' }],
    hideFollowing: true, revealKey: `reveal-${id}`,
  },
})

export const article = (): ArticleDocument => ({ type: 'doc', content: [
  paragraph('intro'), question('one', 'last'), paragraph('middle'), question('two', 'last'), paragraph('last'),
] })

export function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep)
    Object.freeze(value)
  }
  return value
}
