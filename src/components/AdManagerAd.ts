import Vue, { type VNode } from 'vue'
import { AdSenseAd } from './AdSenseAd.js'

interface GoogleTagSlot {
  addService: (service: GoogleTagPubAdsService) => GoogleTagSlot
}

interface GoogleTagSlotRenderEndedEvent {
  slot: GoogleTagSlot
  isEmpty: boolean
}

interface GoogleTagPubAdsService {
  addEventListener: (
    eventName: 'slotRenderEnded',
    listener: (event: GoogleTagSlotRenderEndedEvent) => void,
  ) => void
  removeEventListener?: (
    eventName: 'slotRenderEnded',
    listener: (event: GoogleTagSlotRenderEndedEvent) => void,
  ) => void
}

interface GoogleTagApi {
  cmd: { push: (callback: () => void) => number }
  defineSlot: (adUnitPath: string, size: unknown, elementId: string) => GoogleTagSlot | null
  pubads: () => GoogleTagPubAdsService
  enableServices: () => void
  display: (elementId: string) => void
  destroySlots?: (slots: GoogleTagSlot[]) => boolean
}

type GoogleTagWindow = Window & {
  googletag?: GoogleTagApi
}

function getGoogleTagQueue(): GoogleTagApi {
  const googleTagWindow = window as GoogleTagWindow
  googleTagWindow.googletag ??= { cmd: [] } as unknown as GoogleTagApi
  return googleTagWindow.googletag
}

function buildAdUnitPath(publisherId: string, slotId: string): string {
  const prefix = publisherId.trim().replace(/\/+$/u, '')
  const suffix = slotId.replace(/^\/+|\/+$/gu, '')
  return prefix && suffix ? `${prefix}/${suffix}` : ''
}

export const AdManagerAd = Vue.extend({
  name: 'ArticleAdManagerAd',
  props: {
    publisherId: {
      type: String,
      required: true,
    },
    slotId: {
      type: [String, Number],
      required: true,
    },
    title: {
      type: String,
      default: 'Advertisement',
    },
    fallbackPublisherId: {
      type: String,
      default: '',
    },
    fallbackSlotId: {
      type: [String, Number],
      default: undefined,
    },
  },
  data() {
    return {
      observer: null as IntersectionObserver | null,
      definedSlot: null as GoogleTagSlot | null,
      pubAdsService: null as GoogleTagPubAdsService | null,
      slotRenderEnded: null as ((event: GoogleTagSlotRenderEndedEvent) => void) | null,
      emptyAdmKey: null as string | null,
      cancelled: false,
    }
  },
  computed: {
    admSlotId(): string {
      return String(this.slotId).trim()
    },
    adsSlotId(): string {
      return this.fallbackSlotId === undefined ? '' : String(this.fallbackSlotId).trim()
    },
    adUnitPath(): string {
      return buildAdUnitPath(this.publisherId, this.admSlotId)
    },
    fallbackKey(): string {
      return `${this.adUnitPath}:${this.admSlotId}:${this.fallbackPublisherId}:${this.adsSlotId}`
    },
    hasAdSenseFallback(): boolean {
      return Boolean(this.fallbackPublisherId.trim() && this.adsSlotId)
    },
    shouldUseAdSense(): boolean {
      return this.hasAdSenseFallback && this.emptyAdmKey === this.fallbackKey
    },
  },
  watch: {
    fallbackKey(): void {
      this.restartAdManager()
    },
  },
  mounted(): void {
    this.startObserver()
  },
  beforeDestroy(): void {
    this.cleanupAdManager()
  },
  methods: {
    restartAdManager(): void {
      this.cleanupAdManager()
      this.emptyAdmKey = null
      this.$nextTick(() => this.startObserver())
    },
    startObserver(): void {
      const root = this.$refs.root as HTMLDivElement | undefined
      if (!root || !this.adUnitPath || !this.admSlotId || this.shouldUseAdSense) return

      this.cancelled = false
      if (typeof IntersectionObserver === 'undefined') {
        this.requestAd()
        return
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          this.requestAd()
          this.observer?.disconnect()
          this.observer = null
        },
        { rootMargin: '200px 0px' },
      )
      this.observer.observe(root)
    },
    requestAd(): void {
      const unit = this.$refs.unit as HTMLDivElement | undefined
      if (!unit) return

      const googletag = getGoogleTagQueue()
      googletag.cmd.push(() => {
        if (this.cancelled) return

        const width = unit.clientWidth
        const height = unit.clientHeight
        const size = width > 0 && height > 0 ? ['fluid', [width, height]] : 'fluid'
        const slot = googletag.defineSlot(this.adUnitPath, size, this.admSlotId)
        if (!slot) return

        const pubAds = googletag.pubads()
        const listener = (event: GoogleTagSlotRenderEndedEvent) => {
          if (this.cancelled || event.slot !== slot || !event.isEmpty) return
          if (!this.hasAdSenseFallback) return

          const fallbackKey = this.fallbackKey
          this.cleanupAdManager()
          this.emptyAdmKey = fallbackKey
        }

        this.definedSlot = slot
        this.pubAdsService = pubAds
        this.slotRenderEnded = listener
        pubAds.addEventListener('slotRenderEnded', listener)
        slot.addService(pubAds)
        googletag.enableServices()
        googletag.display(this.admSlotId)
      })
    },
    cleanupAdManager(): void {
      this.cancelled = true
      this.observer?.disconnect()
      this.observer = null

      const slot = this.definedSlot
      const pubAds = this.pubAdsService
      const listener = this.slotRenderEnded
      this.definedSlot = null
      this.pubAdsService = null
      this.slotRenderEnded = null

      if (!slot && !listener) return
      const googletag = getGoogleTagQueue()
      googletag.cmd.push(() => {
        if (pubAds && listener) pubAds.removeEventListener?.('slotRenderEnded', listener)
        if (slot) googletag.destroySlots?.([slot])
      })
    },
  },
  render(createElement): VNode {
    if (this.shouldUseAdSense) {
      return createElement(AdSenseAd, {
        props: {
          publisherId: this.fallbackPublisherId,
          slotId: this.adsSlotId,
          title: this.title,
        },
      })
    }

    if (!this.adUnitPath || !this.admSlotId) return createElement()

    return createElement(
      'div',
      {
        ref: 'root',
        staticClass: 'article-ad-wrapper article-adm-wrapper',
        attrs: {
          'data-google-ad-manager': 'true',
          'data-ad-unit-path': this.adUnitPath,
        },
      },
      [
        createElement('div', { staticClass: 'article-ad-title' }, this.title),
        createElement('div', {
          ref: 'unit',
          staticClass: 'article-ad-unit article-adm-unit',
          attrs: { id: this.admSlotId },
        }),
      ],
    )
  },
})

export default AdManagerAd
