# article-content-renderer-vue2

面向 Vue 2.7 的 Article Content Protocol 渲染组件。组件接收协议定义的 ProseMirror JSON，通过 Vue 2 VNode 安全渲染，不使用 `v-html`。

该项目与 Vue 3 版本保持相同的协议类型、运行时校验、节点能力、URL 安全策略、articleButton resolver 和样式变量，仅将组件实现与工具链切换为 Vue 2.7。

## 特性

- 支持 Article Content Protocol v1 + Extensions 的全部节点和 marks，兼容旧文档。
- 支持资源问题快照、宿主控制的后文解锁、实例内锚点定位和取消待跳转任务。
- 支持文字颜色、高亮、段落字号和双列图片。
- 使用 Vue 2 `CreateElement` 和 `VNodeData`，不是 Vue 3 兼容层。
- 支持严格模式和非严格容错渲染。
- 拦截危险链接和图片 URL。
- `link` mark 支持 `href` 和 `custom` 两种类型，custom 链接由使用者回调生成完整地址。
- articleButton 的 text/button 完整 href 由使用者回调生成。
- articleButton 的 link 样式直接使用协议节点中的 href，不调用 resolver。
- 支持 Vue 2 SSR。
- 提供 TypeScript 类型、结构化错误和 CSS Variables。
- Vue 作为 peer dependency，不会打入组件包。

## 环境要求

- Vue `2.7.16` 或兼容的 Vue 2.7 版本。
- Node.js 18 或更高版本用于本地开发和构建。

Vue 2 已经停止官方维护；该组件选择 Vue 2.7 是为了兼容仍在使用 Vue 2 的项目，新项目建议优先使用 Vue 3 版本。

## 安装

```bash
npm install article-content-renderer-vue2 vue@2.7.16
```

引入组件样式：

```ts
import 'article-content-renderer-vue2/style.css'
```

## 基本使用

```vue
<script lang="ts">
import Vue from 'vue'
import {
  ArticleContentRenderer,
  type ArticleButtonClickPayload,
  type ArticleDocument,
  type RenderIssue,
  type ResolveArticleButtonLink,
} from 'article-content-renderer-vue2'
import 'article-content-renderer-vue2/style.css'

export default Vue.extend({
  name: 'ArticlePage',
  components: {
    ArticleContentRenderer,
  },
  data() {
    const article: ArticleDocument = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Article title' }],
        },
        {
          type: 'articleButton',
          attrs: {
            id: 'view-more',
            text: 'View more',
            style: 'button',
          },
        },
      ],
    }

    return { article }
  },
  methods: {
    resolveArticleButtonLink: ((attrs) => {
      // 完整 href 由使用者返回，组件不会自动追加参数。
      return `/detail/${encodeURIComponent(attrs.id)}`
    }) as ResolveArticleButtonLink,
    handleArticleButtonClick(payload: ArticleButtonClickPayload): void {
      console.log(payload.attrs, payload.href)
    },
    handleRenderError(issue: RenderIssue): void {
      console.warn(issue.code, issue.path, issue.message)
    },
  },
})
</script>

<template>
  <ArticleContentRenderer
    :document="article"
    :resolve-article-button-link="resolveArticleButtonLink"
    @article-button-click="handleArticleButtonClick"
    @render-error="handleRenderError"
  />
</template>
```

也可以注册为 Vue 2 全局插件：

```ts
import Vue from 'vue'
import { ArticleContentRendererPlugin } from 'article-content-renderer-vue2'
import 'article-content-renderer-vue2/style.css'

Vue.use(ArticleContentRendererPlugin)
```

## 自定义插槽与图片地址

通过 `customSlots` 描述插槽位置，再使用与 `id` 同名的具名插槽传入任意 Vue 内容：

```ts
interface CustomSlot {
  id: string
  location: number
}
```

```vue
<script lang="ts">
import Vue from 'vue'
import type { CustomSlot } from 'article-content-renderer-vue2'

export default Vue.extend({
  data() {
    return {
      customSlots: [
        { id: 'article-ad-1', location: 2 },
        { id: 'recommendation', location: 5 },
        { id: 'article-ad-2', location: 5 },
      ] as CustomSlot[],
    }
  },
})
</script>

<template>
  <ArticleContentRenderer
    :document="article"
    :custom-slots="customSlots"
  >
    <template #article-ad-1>
      <MyAd slot-id="top" />
    </template>

    <template #recommendation>
      <RecommendationCard />
    </template>

    <template #article-ad-2>
      <MyAd slot-id="middle" />
    </template>
  </ArticleContentRenderer>
</template>
```

插槽规则：

- `location` 从 1 开始；`location: 5` 表示插入到 `document.content[4]` 之前。
- 同一个 `location` 可以配置多个不同 `id`，并按照数组中的顺序渲染。
- `id` 应当唯一，并且必须与具名插槽名称一致。
- 非正整数或超过 `document.content` 长度的位置会被忽略。
- 渲染器不会为插槽额外创建包装 DOM，样式和生命周期由插槽组件自行控制。
- 具名插槽会收到 `{ id, location }` 作为作用域参数。

广告组件也通过具名插槽传入，并自行负责 SDK 加载、广告请求、空广告回退、唯一 DOM ID 和卸载清理。

`imageBaseUrl` 默认为 `https://www.doitme.link/`；传入新地址时，只替换文档图片中该默认前缀，其他图片 URL 保持不变。
## link mark：href 与 custom

协议中的 `link` mark 现在有两种链接来源：

- `type` 省略或为 `"href"`：直接使用 `attrs.href`，兼容旧文档，不调用 custom resolver。
- `type: "custom"`：协议只保存业务属性 `id`、`title` 和 `target`，通过 `resolveCustomLink` 生成最终 `href`。

普通 href 链接可以继续使用旧格式：

```ts
const article: ArticleDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '直接链接',
          marks: [
            {
              type: 'link',
              attrs: { href: '/help', target: '_self' },
            },
          ],
        },
      ],
    },
  ],
}
```

custom 链接不在协议中提供 `href`：

```ts
const article: ArticleDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '查看文章详情',
          marks: [
            {
              type: 'link',
              attrs: {
                type: 'custom',
                id: 'article-42',
                title: 'memory signs',
                target: '_self',
              },
            },
          ],
        },
      ],
    },
  ],
}
```

由使用者读取 `id + title` 并返回完整地址：

```vue
<script lang="ts">
import Vue from 'vue'
import type { ResolveCustomLink } from 'article-content-renderer-vue2'

export default Vue.extend({
  methods: {
    resolveCustomLink: ((attrs) => {
      return `/detail/${encodeURIComponent(attrs.id)}/${encodeURIComponent(attrs.title)}`
    }) as ResolveCustomLink,
  },
})
</script>

<template>
  <ArticleContentRenderer
    :document="article"
    :resolve-custom-link="resolveCustomLink"
  />
</template>
```

也可以返回对象来覆盖 `target` 或补充 `rel`：

```ts
const resolveCustomLink: ResolveCustomLink = (attrs) => ({
  href: `/detail/${encodeURIComponent(attrs.id)}?title=${encodeURIComponent(attrs.title)}`,
  target: '_blank',
  rel: 'external',
})
```

最终 custom DOM 会保留协议绑定属性，方便样式或事件委托：

```html
<a
  href="/detail/article-42/memory%20signs"
  data-link-type="custom"
  data-link-id="article-42"
  title="memory signs"
  target="_self"
>查看文章详情</a>
```

`resolveCustomLink` **只会**为 `type: "custom"` 的 link mark 调用。href 类型始终直接读取 `attrs.href`。传给回调的 `attrs` 和 `mark` 是只读、冻结的快照。回调缺失、返回 `null`、抛出异常或返回不安全 URL 时，组件渲染不带 `href` 的禁用态 `<a>`，并通过 `render-error` 报告 `LINK_RESOLUTION_FAILED` 或 `UNSAFE_URL`。

## articleButton 链接

`style: "button"`、`style: "text"` 和 `style: "link"` 都使用 `<a>` 渲染。它们的链接来源不同：

- text/button：必须提供 `id`，通过 `resolveArticleButtonLink` 生成完整 `href`。
- link：`id` 可省略，直接使用节点的 `href`，不会调用 `resolveArticleButtonLink`。

对应的 TypeScript 类型是可辨识联合：

```ts
interface ArticleButtonActionAttrs {
  id: string
  title?: string
  text: string
  style: 'text' | 'button'
  href?: never
}

interface ArticleButtonLinkAttrs {
  id?: string
  title?: string
  text: string
  style: 'link'
  href?: string
}

type ArticleButtonAttrs = ArticleButtonActionAttrs | ArticleButtonLinkAttrs
```

resolver 只处理 text/button，因此回调中的 `attrs.id` 始终是 `string`：

```ts
type ResolveArticleButtonLink = (
  attrs: Readonly<ArticleButtonActionAttrs>,
  node: Readonly<ArticleButtonActionNode>,
) =>
  | string
  | {
      href: string
      target?: '_self' | '_blank'
      rel?: string
    }
  | null
```

完整 href 由使用者生成：

```ts
const resolveArticleButtonLink: ResolveArticleButtonLink = (attrs) => {
  return `/detail/${attrs.id}`
}
```

当 `attrs.id` 为 `view-more` 时，最终 DOM 为：

```html
<a href="/detail/view-more">...</a>
```

组件不会自动添加 `?`，也不会自动把节点属性转换成查询参数。

### link 样式直接使用 href

link 类型的地址完整写在协议节点中，不经过 resolver，也不会被自动改写：

```ts
const article: ArticleDocument = {
  type: 'doc',
  content: [
    {
      type: 'articleButton',
      attrs: {
        text: '查看协议说明',
        style: 'link',
        href: '/docs/article-content-protocol#article-button',
      },
    },
  ],
}
```

最终 DOM：

```html
<a href="/docs/article-content-protocol#article-button">查看协议说明</a>
```

协议允许 link 类型省略 `href`；此时会渲染不带 `href` 的禁用态 `<a>`。`javascript:`、`data:` 等不安全地址也会被拦截，并通过 `render-error` 事件报告 `UNSAFE_URL`。

### 使用闭包

```ts
function createArticleButtonResolver(pathPrefix: string): ResolveArticleButtonLink {
  const prefix = pathPrefix.replace(/\/+$/, '')

  return (attrs) => `${prefix}/${encodeURIComponent(attrs.id)}`
}

const resolveArticleButtonLink = createArticleButtonResolver('/detail')
```

### Vue Router 3

```ts
const resolveArticleButtonLink: ResolveArticleButtonLink = (attrs) => {
  return this.$router.resolve({
    name: 'article-detail',
    params: { id: attrs.id },
  }).href
}

function handleArticleButtonClick(payload: ArticleButtonClickPayload): void {
  if (!payload.href) return
  payload.event.preventDefault()
  void this.$router.push(payload.href)
}
```

## revealedKeys：解锁隐藏内容

`revealedKeys` 是由使用方维护的 `string[]`，默认值为 `[]`，通过 `:revealed-keys="revealedKeys"` 传给组件。数组中的字符串与问题节点的 `attrs.revealKey` 精确匹配，表示页面允许显示该问题之后的内容。

组件接收的 `document` 必须是**完整文章 JSON**。隐藏部分已经在这份 JSON 中，只是暂时不创建 DOM；更新 `revealedKeys` 后，组件从原始完整文档重新计算并渲染后续内容，**不会请求新的 JSON，也不会根据 `resourceId` 请求问题数据**。新显示的图片可能触发浏览器正常的图片资源请求。

### 完整 Vue 2 示例：选择后解锁

下面的示例采用“选择即允许”的页面规则：初始显示引言和问题，点击“继续阅读”后，页面将事件中的 `revealKey` 加入列表，组件显示后文并定位到 `details` 段落。也可以点击页面的“直接解锁”按钮，演示从外部控制显示。

```vue
<script lang="ts">
import Vue from 'vue'
import {
  ArticleContentRenderer,
  type ArticleDocument,
  type ArticleRendererRuntime,
  type ResourceQuestionSelectEvent,
} from 'article-content-renderer-vue2'
import 'article-content-renderer-vue2/style.css'

export default Vue.extend({
  components: { ArticleContentRenderer },
  data() {
    const article: ArticleDocument = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '这段引言始终显示。' }] },
        {
          type: 'resourceQuestion',
          attrs: {
            id: 'question-1',
            resourceId: 'resource-123',
            title: '准备好继续阅读了吗？',
            description: '选择后显示后续内容。',
            options: [{ id: 'read', label: '继续阅读', targetAnchorId: 'details' }],
            hideFollowing: true,
            revealKey: 'article-content',
          },
        },
        {
          type: 'paragraph',
          attrs: { anchorId: 'details' },
          content: [{ type: 'text', text: '这是解锁后显示的正文，始终保存在完整 JSON 中。' }],
        },
      ],
    }
    return {
      article,
      articleKey: 1,
      revealedKeys: [] as string[],
      runtime: null as ArticleRendererRuntime | null,
    }
  },
  methods: {
    rememberRuntime(runtime: ArticleRendererRuntime): void {
      this.runtime = runtime
    },
    handleOptionSelect(event: ResourceQuestionSelectEvent): void {
      // 本示例的业务规则是“选择即允许”。组件只发事件，不会自行解锁。
      this.unlockContent(event.revealKey)
    },
    unlockContent(revealKey: string): void {
      this.revealedKeys = [...new Set([...this.revealedKeys, revealKey])]
    },
    hideContent(revealKey: string): void {
      this.runtime?.cancelPendingNavigation()
      this.revealedKeys = this.revealedKeys.filter((key) => key !== revealKey)
    },
    switchArticle(nextArticle: ArticleDocument): void {
      this.runtime?.cancelPendingNavigation()
      this.revealedKeys = []
      this.articleKey += 1
      this.article = nextArticle
    },
  },
})
</script>

<template>
  <main>
    <button type="button" @click="unlockContent('article-content')">直接解锁</button>
    <button type="button" @click="hideContent('article-content')">重新隐藏</button>
    <article>
      <ArticleContentRenderer
        :key="articleKey"
        :document="article"
        :article-key="articleKey"
        :revealed-keys="revealedKeys"
        @renderer-ready="rememberRuntime"
        @option-select="handleOptionSelect"
      />
    </article>
  </main>
</template>
```

示例中的 `article-content` 是保存在 JSON 中的固定标识，可以替换为编辑器保存的随机值。选项事件始终返回当前问题的真实 `event.revealKey`，使用方不必预先知道它，也不要假定它等于问题 ID、资源 ID 或目标段落 ID。

`option-select` 携带 `{ questionId, resourceId, optionId, option, revealKey, targetAnchorId? }`，其中 `option` 是被点击选项的完整属性。组件先记录目标，再发出事件；默认在宿主更新列表、DOM 和布局就绪后定位。可通过下面的 `onAnchorNavigate` 回调控制滚动时机。没有目标的选项仍可解锁，只是不跳转。外部按钮直接解锁时，若没有待定位任务，则只显示内容。

### 多个问题与重新隐藏

组件按顶层顺序扫描，保留首个未解锁问题本身，然后停止渲染其后的全部内容。假设文章为“引言 → 问题 A → 段落 A → 问题 B → 段落 B”，两个问题都开启 `hideFollowing`，标识分别为 `step-1` 和 `step-2`：

| `revealedKeys` | 可见内容 |
| --- | --- |
| `[]` | 引言、问题 A |
| `["step-1"]` | 引言、问题 A、段落 A、问题 B |
| `["step-2"]` | 引言、问题 A；不能越过前面的未解锁问题 |
| `["step-1", "step-2"]` | 全文 |
| `["unknown"]` | 引言、问题 A；未知标识不生效 |

从列表中移除对应标识即可重新隐藏；将列表设为 `[]` 可重新锁定全部隐藏边界。每次都从原始完整文档计算，无需删除或恢复 JSON 节点。`hideFollowing: false` 的问题不会截断正文；没有隐藏问题的旧文章完整显示。同篇文章内所有问题的 `revealKey` 必须唯一，一次允许多个问题时传入多个不同标识。

### 异步业务与文章切换

如果需要业务接口确认，将 `unlockContent(event.revealKey)` 放在业务允许的分支中；请求期间保持列表不变。接口请求由使用方自行发起，渲染器不负责获取业务结果或新的文章 JSON。业务拒绝、失败或主动取消时，调用 `runtime.cancelPendingNavigation()`，避免后续操作触发旧定位；不要在每次选项点击开始时调用它，否则会取消刚记录的本次目标。

切换文章时，使用类似示例中的 `switchArticle(nextArticle)` 方法，清空 `revealedKeys` 和待定位任务，再更新文章与 `articleKey`。`articleKey` 变化会取消旧定位，但**不会替使用方清空传入的解锁列表**。异步请求还需检查文章版本或加载代次、交互序号，忽略旧文章或旧选择的返回结果；重新隐藏和卸载时也要使旧请求失效。完整异步示例见 [Vue 2 资源问题接入](./docs/resource-question-vue2.md#宿主异步业务)。

`revealedKeys` 是页面运行时状态，不写入文章 JSON。不同文章可以使用相同固定 `revealKey`，因此不能共享一份全局解锁列表；需要恢复阅读进度时，应由使用方按用户、文章及版本隔离保存。

隐藏只控制展示，完整文章数据仍在客户端；敏感内容应由服务器在鉴权后返回，`revealKey` 不能作为密码或授权凭证。

可运行示例：启动 Demo，在“隐藏内容解锁示例”面板点击“载入解锁示例”，观察选项事件、解锁列表与正文变化。相关源码见 [主 Demo](./demo/App.vue) 和 [异步资源问题 Demo](./demo/ResourceQuestionDemo.vue)。

## onAnchorNavigate：由使用方决定滚动时机

`onAnchorNavigate` 是可选的函数 Prop，通过 `:on-anchor-navigate="handleAnchorNavigate"` 传入。它与 `@option-select` 分工不同：`option-select` 用于处理选择和业务解锁，`onAnchorNavigate` 用于决定何时滚动。

- **不传回调**：可见目标在点击后直接按默认流程滚动；如果目标尚未渲染，仍需等待 `revealedKeys` 解锁和 DOM、布局就绪。“默认立即滚动”不会自动解锁内容。
- **传入回调**：在有有效目标的选项被点击后，组件先发出 `option-select`，再调用一次回调。目标可以仍处于隐藏状态；组件不会自动滚动，只有使用方调用 `request.scrollToAnchor()` 后才执行定位。
- 提前调用 `scrollToAnchor()` 时，组件会等待目标解锁并完成渲染；在目标已显示后调用也可以。调用此方法不会修改 `revealedKeys`，也不会请求新的 JSON。

### 示例：点击页面按钮后再滚动

在上面的 Vue 2 解锁示例中，额外导入 `ResourceQuestionNavigationRequest`，并在 `data` 和 `methods` 中增加以下内容，原有的解锁逻辑继续保留：

```ts
import type { ResourceQuestionNavigationRequest } from 'article-content-renderer-vue2'

// data() 返回的对象中增加：
pendingNavigation: null as ResourceQuestionNavigationRequest | null

// methods 中增加：
handleAnchorNavigate(request: ResourceQuestionNavigationRequest): void {
  this.pendingNavigation = request
},
scrollWhenReady(): void {
  this.pendingNavigation?.scrollToAnchor()
  this.pendingNavigation = null
},
cancelNavigation(): void {
  this.pendingNavigation?.cancel()
  this.pendingNavigation = null
}
```

模板中把回调传给组件，再添加操作按钮：

```vue
<main>
  <button type="button" :disabled="!pendingNavigation" @click="scrollWhenReady">
    滚动到所选锚点
  </button>
  <article>
    <ArticleContentRenderer
      :key="articleKey"
      :document="article"
      :article-key="articleKey"
      :revealed-keys="revealedKeys"
      :on-anchor-navigate="handleAnchorNavigate"
      @renderer-ready="rememberRuntime"
      @option-select="handleOptionSelect"
    />
  </article>
</main>
```

此时，点击正文选项可以先解锁并显示后文，但不会滚动；点击“滚动到所选锚点”才请求定位。在原有的 `handleOptionSelect`、`hideContent`、`switchArticle` 中也应将 `pendingNavigation` 设为 `null`，清理页面保存的旧句柄；组件自身仍会校验请求是否有效。

回调也可以等待弹窗关闭、动画结束等异步操作，再显式调用 `request.scrollToAnchor()`。**回调返回、Promise 完成或目标变为可见，都不会替代这次显式调用。**

### 回调类型与取消规则

```ts
interface ResourceQuestionNavigationRequest extends ResourceQuestionSelectEvent {
  targetAnchorId: string
  scrollToAnchor(): void
  cancel(): void
}

type OnAnchorNavigate = (
  request: Readonly<ResourceQuestionNavigationRequest>,
) => void | Promise<void>
```

请求包含 `questionId`、`resourceId`、`optionId`、`option`、`revealKey` 和 `targetAnchorId`，可通过 `request.option` 读取选项属性。`scrollToAnchor()` 继续使用组件的实例内锚点、`scrollContainer`、`scrollOffset` 和焦点处理。`request.cancel()` 只取消该次点击的定位，不改变解锁列表；也可使用 `renderer-ready` 提供的 `runtime.cancelPendingNavigation()` 取消当前定位。

没有绑定锚点或锚点已不存在时，仍发出 `option-select`，但不会调用 `onAnchorNavigate`。同步在 `option-select` 中取消定位时，也不会再调用该次导航回调。每次有效点击只回调一次，重新渲染不会重复回调。

新选择、文章对象或 `articleKey` 变化、移除解锁标识、主动取消、卸载以及成功滚动后，旧请求的 `scrollToAnchor()` 和 `cancel()` 都不再生效，因此过期的异步回调不会影响新选择。更改回调 Prop 只影响后续点击，已经交给使用方的请求仍需显式执行或取消。

回调抛出异常或返回的 Promise 拒绝时，组件会取消仍有效的本次定位，并通过 `render-error` 报告 `NAVIGATION_CALLBACK_FAILED`，不会退回自动滚动。过期回调的失败不影响新请求。

两个 Demo 的解锁面板均提供“由页面决定滚动时机”开关：关闭时不传回调，开启后通过“滚动到所选锚点”按钮手动调用回调提供的方法。

## Props

资源问题完整接入说明及异步业务示例见 [Vue 2 资源问题接入](./docs/resource-question-vue2.md)。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `document` | `unknown` | 必填 | Article Content Protocol 文档 |
| `protocolVersion` | `number` | `1` | 协议适配器版本 |
| `strict` | `boolean` | `false` | 校验失败时是否停止整篇正文渲染 |
| `revealedKeys` | `string[]` | `[]` | 宿主允许的解锁标识；选项点击不自动修改 |
| `articleKey` | `string \| number` | `undefined` | 文章版本或加载代次，变化时取消旧定位；宿主仍须重置解锁状态 |
| `scrollContainer` | `HTMLElement \| (() => HTMLElement \| null)` | `undefined` | 目标滚动容器，省略时滚动页面 |
| `scrollOffset` | `number` | `0` | 定位时顶部遮挡偏移，单位 px |
| `onAnchorNavigate` | `OnAnchorNavigate` | `undefined` | 可选滚动回调；传入后须显式调用 `request.scrollToAnchor()`，省略时默认定位 |
| `customSlots` | `CustomSlot[]` | `[]` | 配置一个或多个具名插槽的顶层正文插入位置 |
| `imageBaseUrl` | `string` | `"https://www.doitme.link/"` | 替换文档图片的默认地址前缀 |
| `resolveArticleButtonLink` | `ResolveArticleButtonLink` | `undefined` | 为 text/button 生成完整链接；link 类型不调用 |
| `resolveCustomLink` | `ResolveCustomLink` | `undefined` | 仅为 `type: "custom"` 的 link mark 生成完整安全链接 |

## Events

### option-select：点击选项并获取属性

通过 `@option-select="handleOptionSelect"` 注册点击回调，回调参数的 `event.option` 返回当前选项在文章 JSON 中保存的完整属性：

```ts
interface ResourceQuestionSelectEvent {
  questionId: string
  resourceId: string
  optionId: string
  option: Readonly<{
    id: string
    label: string
    targetAnchorId?: string
  }>
  revealKey: string
  targetAnchorId?: string
}
```

下面的组件接收文章并展示最近点击选项的属性，可在回调内接入自己的业务操作：

```vue
<script lang="ts">
import Vue, { type PropType } from 'vue'
import ArticleContentRenderer, {
  type ArticleDocument,
  type ResourceQuestionOption,
  type ResourceQuestionSelectEvent,
} from 'article-content-renderer-vue2'
import 'article-content-renderer-vue2/style.css'

export default Vue.extend({
  components: { ArticleContentRenderer },
  props: {
    article: { type: Object as PropType<ArticleDocument>, required: true },
  },
  data() {
    return { selectedOption: null as Readonly<ResourceQuestionOption> | null }
  },
  methods: {
    handleOptionSelect(event: ResourceQuestionSelectEvent): void {
      this.selectedOption = event.option
      // event.option.id：选项 ID
      // event.option.label：选项文本
      // event.option.targetAnchorId：目标锚点（未绑定时不存在）
      // event.questionId / event.resourceId：所属问题及资源 ID
    },
  },
})
</script>

<template>
  <main>
    <ArticleContentRenderer :document="article" @option-select="handleOptionSelect" />
    <pre v-if="selectedOption">{{ JSON.stringify(selectedOption, null, 2) }}</pre>
  </main>
</template>
```

每次点击触发一次回调，包括重复点击同一选项、没有绑定锚点或锚点已删除的情况；无需在各个 JSON 选项中配置函数。选项通过所属问题和稳定的 `id` 匹配，同名选项也能区分。事件及其 `option` 是冻结的只读快照副本，不会随之后的文章修改而变化；需要编辑时先复制，例如 `{ ...event.option }`。原有的顶层 `optionId`、`targetAnchorId` 等字段继续保留。

此示例只展示回调收到的属性。宿主业务允许后可更新 `revealedKeys` 来解锁隐藏内容；默认等待 DOM 和布局后定位可见目标。配置 `onAnchorNavigate` 后，还需使用方显式调用 `request.scrollToAnchor()`。两个 Demo 的解锁面板均会展示 `event.option`。

### renderer-ready

`renderer-ready` 返回 `ArticleRendererRuntime`，提供 `cancelPendingNavigation()`。Vue 2 函数式组件没有可通过 `ref` 获取的实例，请保存这个运行时句柄，在拒绝、失败或主动取消时调用。

### article-button-click

```ts
interface ArticleButtonClickPayload {
  attrs: Readonly<ArticleButtonAttrs>
  node: Readonly<ArticleButtonNode>
  href: string | null
  event: MouseEvent
}
```

三种样式都会在原生跳转前同步触发事件。调用 `payload.event.preventDefault()` 可以由 Vue Router 3 接管跳转。

### render-error

```ts
interface RenderIssue {
  code: RenderIssueCode
  path: string
  message: string
  nodeType?: string
  severity?: 'error' | 'warning'
}
```

## 校验和 URL 安全

校验同时覆盖 JSON 结构、`contentModel` 和跨节点约束：

使用仓库中的最新 `documentSchema` 校验结构，并保留旧版允许省略的默认字段。重复问题 ID、revealKey、anchorId 或问题内选项 ID 会报错并停止渲染；包含资源问题的文章即使非严格模式也必须通过结构校验。失效目标是 `MISSING_ANCHOR` 警告，不会使整篇文章失效。

- `block+`、`listItem+`、`tableRow+` 等内容不能为空。
- `codeBlock` 最多包含一个 text 节点。
- 同一张表格的每一行必须具有相同列数。
- 未知节点、mark、属性和越界值会被报告。

普通链接和 articleButton 允许 `http:`、`https:`、`mailto:`、`tel:`、相对路径和页面锚点。图片允许 `http:`、`https:`、`blob:` 和相对路径。危险协议会被拦截。

## Vue 2 顶层渲染结构

组件使用 Vue 2 函数式多根渲染，正文节点会直接进入使用方已有的容器，不会额外输出 `.acp-document`、`data-node-type="doc"` 或 `data-protocol-version`：

```html
<article class="article-content">
  <h1 class="acp-heading">...</h1>
  <p class="acp-paragraph">...</p>
</article>
```

Vue 2 应用本身仍要求单一根节点。因此，不要把包含多个正文节点的 `ArticleContentRenderer` 直接作为整个 Vue 实例 render 函数的唯一根；请像上例一样放入页面已有的 `<main>`、`<article>` 或其他业务容器中。这个容器由使用方控制，不属于组件输出。

## 样式覆盖

组件与 Vue 3 版使用相同的 `acp-` 类名和 CSS Variables：

```css
.my-article-theme {
  --acp-color-accent: #7c3aed;
  --acp-color-accent-hover: #6d28d9;
  --acp-radius: 8px;
  --acp-spacing-block: 20px;
}

.my-article-theme .acp-article-button--button {
  min-width: 160px;
  border-radius: 999px;
}
```

## 本地 Demo

```bash
npm install
npm run dev
```

默认访问 `http://localhost:5173`。Demo 包含全部主要节点、可编辑 articleButton resolver、严格模式、错误列表和 JSON 查看器。

资源问题独立 Demo：`http://localhost:5173/?demo=resource-question`，提供两步解锁、异步允许、拒绝、取消及切换文章演示。

两个 Demo 都提供“传入文章 JSON”输入区：粘贴后点击“应用 JSON”更新预览，也可“恢复示例”。解析或协议校验失败会显示错误并保留当前文章；资源问题 Demo 应用成功后会清空解锁状态并取消旧的异步操作和定位。

解锁操作示例：在“隐藏内容解锁示例”面板点击“载入解锁示例”，再点击正文中的“先了解基础”。主 Demo 会把事件的 `revealKey` 加入 `revealedKeys` 并显示后文；面板会同步展示收到的标识和当前列表。每个隐藏边界还提供“解锁此处后文”和“重新隐藏此处后文”按钮，可验证多个边界按顺序生效。应用其他文章会重置解锁状态；独立资源问题 Demo 还可切换延迟允许或拒绝。

动态 resolver 编辑器只用于本地 Demo；生产项目应在 Vue/TypeScript 源码中定义 resolver。

单独检查并构建 Demo：

```bash
npm run demo:typecheck
npm run demo:build
```

## 开发命令

```bash
npm run typecheck
npm run test:run
npm run build
npm run check
```

原始协议定义位于 [protocol/article-content-protocol-v1.json](./protocol/article-content-protocol-v1.json)，完整示例位于 [examples/article-v1.json](./examples/article-v1.json)。
