import Vue, { type VNode } from 'vue'

type AdsByGoogleWindow = Window & {
  adsbygoogle?: Array<Record<string, unknown>>
}

function normalizePublisherId(publisherId: string): string {
  const value = publisherId.trim()
  if (!value) return ''
  return value.startsWith('ca-pub-') ? value : `ca-pub-${value}`
}

export const AdSenseAd = Vue.extend({
  name: 'ArticleAdSenseAd',
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
  },
  data() {
    return {
      observer: null as IntersectionObserver | null,
      requestedKey: null as string | null,
    }
  },
  computed: {
    adClient(): string {
      return normalizePublisherId(this.publisherId)
    },
    adSlot(): string {
      return String(this.slotId).trim()
    },
    requestKey(): string {
      return `${this.adClient}:${this.adSlot}`
    },
  },
  watch: {
    requestKey(): void {
      this.requestedKey = null
      this.stopObserver()
      this.$nextTick(() => this.startObserver())
    },
  },
  mounted(): void {
    this.startObserver()
  },
  beforeDestroy(): void {
    this.stopObserver()
  },
  methods: {
    requestAd(): void {
      if (!this.adClient || !this.adSlot || this.requestedKey === this.requestKey) return

      try {
        const adsWindow = window as AdsByGoogleWindow
        const queue = (adsWindow.adsbygoogle ??= [])
        queue.push({})
        this.requestedKey = this.requestKey
      } catch (error) {
        console.error('[ArticleContentRenderer] Failed to request AdSense ad:', error)
      }
    },
    startObserver(): void {
      const root = this.$refs.root as HTMLDivElement | undefined
      if (!root || !this.adClient || !this.adSlot) return

      if (typeof IntersectionObserver === 'undefined') {
        this.requestAd()
        return
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          this.requestAd()
          this.stopObserver()
        },
        { rootMargin: '200px 0px' },
      )
      this.observer.observe(root)
    },
    stopObserver(): void {
      this.observer?.disconnect()
      this.observer = null
    },
  },
  render(createElement): VNode {
    if (!this.adClient || !this.adSlot) return createElement()

    return createElement(
      'div',
      {
        ref: 'root',
        staticClass: 'article-ad-wrapper',
        attrs: { 'data-google-ad': 'true' },
      },
      [
        createElement('div', { staticClass: 'article-ad-title' }, this.title),
        createElement('ins', {
          key: this.requestKey,
          staticClass: 'adsbygoogle article-ad-unit',
          style: { display: 'block', width: '100%' },
          attrs: {
            'data-ad-client': this.adClient,
            'data-ad-slot': this.adSlot,
          },
        }),
      ],
    )
  },
})

export default AdSenseAd
