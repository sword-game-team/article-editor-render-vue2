import Ajv from 'ajv'
import protocol from '../../../protocol/article-content-protocol-v1.json'
import type { RenderIssue } from '../../types.js'
import { isRecord } from '../../core/resource-question.js'

const validateSchema = new Ajv({ strict: false, allErrors: true }).compile(protocol.documentSchema)

/** Preserve the renderer's pre-extension defaults without ever changing the input snapshot. */
function withLegacyDefaults(value: unknown): unknown {
  if (!isRecord(value)) return value
  const node = { ...value }
  if (Array.isArray(node.content)) node.content = node.content.map(withLegacyDefaults)
  if (Array.isArray(node.marks)) node.marks = node.marks.map(withLegacyDefaults)
  if (node.type === 'orderedList' && (node.attrs === undefined || isRecord(node.attrs))) {
    node.attrs = { start: 1, ...(isRecord(node.attrs) ? node.attrs : {}) }
  }
  if (node.type === 'codeBlock' && node.attrs === undefined) node.attrs = {}
  if (node.type === 'link' && isRecord(node.attrs)) node.attrs = { target: '_blank', ...node.attrs }
  return node
}

export function validateDocumentSchema(document: unknown): RenderIssue[] {
  if (validateSchema(withLegacyDefaults(document))) return []
  return (validateSchema.errors ?? []).map((error) => ({
    code: 'INVALID_VALUE', path: error.instancePath,
    message: `Protocol schema: ${error.message ?? error.keyword}.`,
  }))
}
