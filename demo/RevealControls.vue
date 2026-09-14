<script lang="ts">
import Vue, { type PropType } from 'vue'
import type { ArticleDocument, ResourceQuestionNode, ResourceQuestionSelectEvent, ResourceQuestionNavigationRequest } from '../src'

export default Vue.extend({
  name: 'RevealControls',
  props: {
    document: { type: Object as PropType<ArticleDocument>, required: true },
    revealedKeys: { type: Array as PropType<string[]>, required: true },
    footerText: { type: String, default: '' },
    lastEvent: { type: Object as PropType<ResourceQuestionSelectEvent | null>, default: null },
    manualNavigation: { type: Boolean, default: false },
    pendingNavigation: { type: Object as PropType<ResourceQuestionNavigationRequest | null>, default: null },
  },
  computed: {
    boundaries(): ResourceQuestionNode[] {
      return this.document.content.filter((node): node is ResourceQuestionNode =>
        node.type === 'resourceQuestion' && node.attrs.hideFollowing)
    },
  },
  methods: {
    changeNavigationMode(event: Event): void {
      this.$emit('navigation-mode', (event.target as HTMLInputElement).checked)
    },
    changeFooterText(event: Event): void {
      this.$emit('footer-text', (event.target as HTMLTextAreaElement).value)
    },
  },
})
</script>

<template>
  <section class="reveal-demo" aria-label="隐藏内容解锁示例">
    <h3>隐藏内容解锁示例</h3>
    <p>点击正文中的选项，页面取得事件中的 <code>revealKey</code>，业务允许后加入 <code>revealedKeys</code>，后续内容才会显示。</p>
    <button type="button" @click="$emit('load-example')">载入解锁示例</button>
    <label class="reveal-demo__footer-input">
      问题底部文本
      <textarea :value="footerText" rows="2" placeholder="由使用方传入，留空则不显示" @input="changeFooterText" />
    </label>
    <p v-if="lastEvent">最近收到的 revealKey：<code data-last-reveal-key>{{ lastEvent.revealKey }}</code></p>
    <p v-else>尚未点击正文选项。</p>
    <details v-if="lastEvent" open>
      <summary>选项点击回调收到的属性（event.option）</summary>
      <pre aria-label="最近点击的选项属性">{{ JSON.stringify(lastEvent.option, null, 2) }}</pre>
    </details>
    <p>当前传给渲染器的 <code>revealedKeys</code>：</p>
    <pre aria-label="当前 revealedKeys">{{ JSON.stringify(revealedKeys, null, 2) }}</pre>
    <div class="reveal-demo__navigation">
      <label><input type="checkbox" :checked="manualNavigation" @change="changeNavigationMode" /> 由页面决定滚动时机</label>
      <p v-if="manualNavigation">已传入 onAnchorNavigate 回调。选择后保留定位请求，点击下方按钮才调用 scrollToAnchor()；目标尚未解锁时仍会等待。</p>
      <p v-else>未传滚动回调：点击选项后默认定位；隐藏目标在解锁并渲染后定位。</p>
      <template v-if="manualNavigation">
        <p v-if="pendingNavigation">待滚动锚点：<code>{{ pendingNavigation.targetAnchorId }}</code></p>
        <button type="button" :disabled="!pendingNavigation" @click="$emit('navigate')">滚动到所选锚点</button>
      </template>
    </div>
    <ul v-if="boundaries.length" class="reveal-demo__boundaries">
      <li v-for="question in boundaries" :key="question.attrs.id">
        <strong>{{ question.attrs.title || '未配置问题' }}</strong>
        <code>{{ question.attrs.revealKey }}</code>
        <span>{{ revealedKeys.includes(question.attrs.revealKey) ? '已加入解锁列表' : '未解锁' }}</span>
        <button
          v-if="revealedKeys.includes(question.attrs.revealKey)"
          type="button"
          :data-relock-key="question.attrs.revealKey"
          @click="$emit('hide', question.attrs.revealKey)"
        >重新隐藏此处后文</button>
        <button v-else type="button" :data-reveal-key="question.attrs.revealKey" @click="$emit('reveal', question.attrs.revealKey)">解锁此处后文</button>
      </li>
    </ul>
    <p v-else>当前文章没有开启后文隐藏的问题，可载入示例体验。</p>
    <p v-if="boundaries.length">后面的解锁不能越过前面的未解锁问题。也可以使用上方按钮，演示宿主主动解锁或重新隐藏。</p>
    <details>
      <summary>查看状态更新代码</summary>
      <pre>// 通过 @option-select="handleOptionSelect" 接收点击事件
// event.option 包含 id、label、targetAnchorId（可选）
const selectedOption = event.option

// 业务允许后解锁
this.revealedKeys = [...new Set([...this.revealedKeys, event.revealKey])]

// 主动重新隐藏时，取消旧请求和待跳转任务，再移除对应标识
this.runtime?.cancelPendingNavigation()
this.revealedKeys = this.revealedKeys.filter(key =&gt; key !== revealKey)</pre>
    </details>
  </section>
</template>

<style scoped>
.reveal-demo { margin: 1.25rem 0; padding: 1rem; border: 1px solid #bcd2ed; border-radius: 10px; background: #f5f9ff; color: #1e293b; }
.reveal-demo h3 { margin: 0 0 0.5rem; }
.reveal-demo p { font-size: 0.875rem; line-height: 1.7; }
.reveal-demo pre { max-width: 100%; overflow: auto; padding: 0.75rem; border-radius: 6px; background: #eaf1fb; font-size: 0.8125rem; }
.reveal-demo code { overflow-wrap: anywhere; }
.reveal-demo button { padding: 0.5rem 0.75rem; border: 1px solid #8eaed7; border-radius: 6px; background: #fff; color: #174e97; font: inherit; cursor: pointer; }
.reveal-demo button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.reveal-demo button:disabled { opacity: 0.5; cursor: not-allowed; }
.reveal-demo__navigation { margin-block: 1rem; padding-block: 0.75rem; border-block: 1px solid #d3deed; }
.reveal-demo__navigation label { display: flex; align-items: center; gap: 0.5rem; }
.reveal-demo__boundaries { display: grid; gap: 0.75rem; padding: 0; list-style: none; }
.reveal-demo__boundaries li { display: grid; justify-items: start; gap: 0.5rem; padding: 0.75rem; border: 1px solid #d3deed; border-radius: 6px; background: #fff; }
.reveal-demo__boundaries strong { overflow-wrap: anywhere; }
.reveal-demo__boundaries span { font-size: 0.8125rem; color: #475569; }
.reveal-demo summary { cursor: pointer; }
.reveal-demo__footer-input { display: grid; gap: 0.5rem; margin-block: 1rem; font-size: 0.875rem; }
.reveal-demo__footer-input textarea { box-sizing: border-box; width: 100%; padding: 0.5rem; border: 1px solid #8eaed7; border-radius: 6px; font: inherit; resize: vertical; }
</style>
