<script lang="ts">
import Vue, { type CreateElement, type PropType, type VNode } from 'vue'
import { DEFAULT_IMAGE_BASE_URL } from '../core/url.js'
import { CURRENT_PROTOCOL_VERSION, getProtocolAdapter, validateArticleDocument } from '../protocols/registry.js'
import type { AdSlot } from '../protocols/types.js'
import type {
  AdConfig,
  ArticleButtonClickPayload,
  PubId,
  RenderIssue,
  ResolveArticleButtonLink,
  ValidationResult,
} from '../types.js'

const DEFAULT_AD_TITLE = 'Advertisement'

function createEmptyAdConfig(): AdConfig {
  return { adm: [], ads: [], loc: [] }
}

function createEmptyPubId(): PubId {
  return { adm: '', ads: '' }
}

function issueKey(issue: RenderIssue): string {
  return `${issue.code}:${issue.path}:${issue.message}`
}

function validateAdConfig(adConf: AdConfig): RenderIssue | null {
  const admLength = adConf.adm?.length ?? 0
  const adsLength = adConf.ads?.length ?? 0
  const locLength = adConf.loc.length
  const admMatches = admLength === 0 || admLength === locLength
  const adsMatches = adsLength === 0 || adsLength === locLength
  const hasAdValues = admLength > 0 || adsLength > 0

  if ((locLength === 0 && !hasAdValues) || (hasAdValues && admMatches && adsMatches)) {
    return null
  }

  return {
    code: 'AD_CONFIG_LENGTH_MISMATCH',
    path: '/adConf',
    message: `Each non-empty adConf.adm or adConf.ads array must have the same length as adConf.loc, and at least one ad array must contain values when loc is non-empty. Received adm length ${admLength}, ads length ${adsLength}, and loc length ${locLength}.`,
  }
}

function createAdSlots(adConf: AdConfig, issue: RenderIssue | null): readonly AdSlot[] {
  if (issue) return []

  return adConf.loc
    .map((location, index) => ({
      index: index + 1,
      location,
      adm: adConf.adm?.[index],
      ads: adConf.ads?.[index],
    }))
    .filter((slot) => Number.isInteger(slot.location) && slot.location >= 1)
}

export default Vue.extend({
  name: 'ArticleContentRenderer',
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
    adConf: {
      type: Object as PropType<AdConfig>,
      default: createEmptyAdConfig,
    },
    pubid: {
      type: Object as PropType<PubId>,
      default: createEmptyPubId,
    },
    adTitle: {
      type: String,
      default: DEFAULT_AD_TITLE,
    },
    imageBaseUrl: {
      type: String,
      default: DEFAULT_IMAGE_BASE_URL,
    },
    resolveArticleButtonLink: {
      type: Function as PropType<ResolveArticleButtonLink>,
      default: undefined,
    },
  },
  data() {
    return {
      reportedRuntimeIssues: new Set<string>(),
      reportedAdConfigIssue: null as string | null,
    }
  },
  computed: {
    validation(): ValidationResult {
      return validateArticleDocument(this.document, { protocolVersion: this.protocolVersion })
    },
    adConfigIssue(): RenderIssue | null {
      return validateAdConfig(this.adConf)
    },
    adSlots(): readonly AdSlot[] {
      return createAdSlots(this.adConf, this.adConfigIssue)
    },
  },
  watch: {
    validation: {
      immediate: true,
      deep: true,
      handler(result: ValidationResult): void {
        result.issues.forEach((issue) => this.$emit('render-error', issue))
      },
    },
    document: {
      deep: true,
      handler(): void {
        this.reportedRuntimeIssues.clear()
      },
    },
    protocolVersion(): void {
      this.reportedRuntimeIssues.clear()
    },
    resolveArticleButtonLink(): void {
      this.reportedRuntimeIssues.clear()
    },
    imageBaseUrl(): void {
      this.reportedRuntimeIssues.clear()
    },
    adConfigIssue: {
      immediate: true,
      handler(issue: RenderIssue | null): void {
        if (!issue) {
          this.reportedAdConfigIssue = null
          return
        }

        const key = issueKey(issue)
        if (this.reportedAdConfigIssue === key) return
        this.reportedAdConfigIssue = key
        console.error('[ArticleContentRenderer] Invalid adConf:', issue)
        this.$emit('render-error', issue)
      },
    },
  },
  methods: {
    reportRuntimeIssue(issue: RenderIssue): void {
      const key = issueKey(issue)
      if (this.reportedRuntimeIssues.has(key)) return
      this.reportedRuntimeIssues.add(key)
      this.$nextTick(() => this.$emit('render-error', issue))
    },
  },
  render(createElement: CreateElement): VNode {
    const adapter = getProtocolAdapter(this.protocolVersion)
    if (!adapter || (this.strict && !this.validation.valid)) {
      return createElement(
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
    }

    const children = adapter.render(this.document, {
      createElement,
      adSlots: this.adSlots,
      admPublisherId: this.pubid.adm,
      adsPublisherId: this.pubid.ads,
      adTitle: this.adTitle,
      imageBaseUrl: this.imageBaseUrl,
      resolveArticleButtonLink: this.resolveArticleButtonLink,
      emitArticleButtonClick: (payload: ArticleButtonClickPayload) =>
        this.$emit('article-button-click', payload),
      reportIssue: this.reportRuntimeIssue,
    })

    return createElement(
      'div',
      {
        class: 'acp-document',
        attrs: {
          'data-node-type': 'doc',
          'data-protocol-version': this.protocolVersion,
        },
      },
      children,
    )
  },
})
</script>

<style src="../styles.css"></style>
