# article-content-renderer-vue2

面向 Vue 2.7 的 Article Content Protocol 渲染组件。组件接收协议定义的 ProseMirror JSON，通过 Vue 2 VNode 安全渲染，不使用 `v-html`。

该项目与 Vue 3 版本保持相同的协议类型、运行时校验、节点能力、URL 安全策略、articleButton resolver 和样式变量，仅将组件实现与工具链切换为 Vue 2.7。

## 特性

- 支持 Article Content Protocol v1 的全部节点和 marks。
- 使用 Vue 2 `CreateElement` 和 `VNodeData`，不是 Vue 3 兼容层。
- 支持严格模式和非严格容错渲染。
- 拦截危险链接和图片 URL。
- articleButton 的完整 href 由使用者回调生成。
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

## 广告与图片地址

广告参数与 React 版保持一致：

```ts
interface AdConfig {
  adm?: readonly unknown[]
  ads?: readonly unknown[]
  loc: readonly number[]
}

interface PubId {
  adm: string
  ads: string
}
```

```vue
<ArticleContentRenderer
  :document="article"
  :ad-conf="{
    adm: ['banner-1', 'banner-2'],
    ads: ['123', '456'],
    loc: [2, 5],
  }"
  :pubid="{
    adm: '/23054585162/newsflowly/',
    ads: '3887371527059481',
  }"
  ad-title="Advertisement"
  image-base-url="https://cdn.example.com/"
  @render-error="handleRenderError"
/>
```

`loc` 使用从 1 开始的 `document.content` 顶层位置，广告会插入在对应元素前面。位置超出文档长度时直接忽略。每个非空 `adm`/`ads` 数组的长度都必须与 `loc` 一致，否则不生成广告占位，并通过 `render-error` 上报 `AD_CONFIG_LENGTH_MISMATCH`。

广告选择规则：

- 同一位置同时有 `adm` 和 `ads`：先请求 ADM；只有 ADM 返回空广告时才请求对应 AdSense。
- 只有 `adm`：只请求 ADM，空广告也不回退。
- 只有 `ads`：直接请求 AdSense。

宿主项目需要分别加载一次 Google Publisher Tag 和 Google AdSense SDK。组件通过 `googletag.cmd` 和 `adsbygoogle` 队列请求广告，不会为每个广告位重复插入 `<script>`。

ADM 和 AdSense 共用稳定的全局 class，样式由宿主项目覆盖：

```css
.article-ad-wrapper {
  max-width: 728px;
  height: 110px;
  margin: 0 auto;
}

.article-ad-title {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
}
```

外层使用纵向 flex 布局，广告单元自动占满标题之外的剩余高度。上例中外层为 `110px`、标题为 `20px`，广告实际高度为 `90px`。如果宿主使用 `<style scoped>`，请使用 Vue 2 的深度选择器，或将这些广告规则放到非 scoped 样式中。

`adTitle` 默认为 `Advertisement`。`imageBaseUrl` 默认为 `https://www.doitme.link/`；传入新地址时，只替换文档图片中该默认前缀，其他图片 URL 保持不变。

## articleButton 链接

`style: "button"` 和 `style: "text"` 都使用 `<a>` 渲染，只改变视觉样式。resolver 接收当前节点的完整只读属性：

```ts
interface ArticleButtonAttrs {
  id: string
  title?: string
  text: string
  style: 'text' | 'button'
}
```

resolver 类型：

```ts
type ResolveArticleButtonLink = (
  attrs: Readonly<ArticleButtonAttrs>,
  node: Readonly<ArticleButtonNode>,
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

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `document` | `unknown` | 必填 | Article Content Protocol 文档 |
| `protocolVersion` | `number` | `1` | 协议适配器版本 |
| `strict` | `boolean` | `false` | 校验失败时是否停止整篇正文渲染 |
| `adConf` | `AdConfig` | `{ adm: [], ads: [], loc: [] }` | 广告配置；非空广告数组长度须与 `loc` 一致 |
| `pubid` | `PubId` | `{ adm: '', ads: '' }` | ADM/AdSense 发布标识 |
| `adTitle` | `string` | `"Advertisement"` | ADM 和 AdSense 共用的广告标题 |
| `imageBaseUrl` | `string` | `"https://www.doitme.link/"` | 替换文档图片的默认地址前缀 |
| `resolveArticleButtonLink` | `ResolveArticleButtonLink` | `undefined` | 由使用者生成 articleButton 完整链接 |

## Events

### article-button-click

```ts
interface ArticleButtonClickPayload {
  attrs: Readonly<ArticleButtonAttrs>
  node: Readonly<ArticleButtonNode>
  href: string | null
  event: MouseEvent
}
```

事件在原生跳转前同步触发。调用 `payload.event.preventDefault()` 可以由 Vue Router 3 接管跳转。

### render-error

```ts
interface RenderIssue {
  code: RenderIssueCode
  path: string
  message: string
  nodeType?: string
}
```

## 校验和 URL 安全

校验同时覆盖 JSON 结构、`contentModel` 和跨节点约束：

- `block+`、`listItem+`、`tableRow+` 等内容不能为空。
- `codeBlock` 最多包含一个 text 节点。
- 同一张表格的每一行必须具有相同列数。
- 未知节点、mark、属性和越界值会被报告。

普通链接和 articleButton 允许 `http:`、`https:`、`mailto:`、`tel:`、相对路径和页面锚点。图片允许 `http:`、`https:`、`blob:` 和相对路径。危险协议会被拦截。

## Vue 2 根节点说明

Vue 2 状态组件要求单一根节点，因此该版本会输出：

```html
<div class="acp-document" data-node-type="doc">...</div>
```

默认样式为：

```css
.acp-document {
  display: contents;
}
```

它不会增加额外布局盒。Vue 3 版本使用 Fragment，不需要此兼容根节点。

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
