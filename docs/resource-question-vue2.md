# Vue 2 资源问题接入

协议版本仍为 `1`，支持最新 `v1 + Extensions`。完整数据示例在 [resource-question.json](../examples/resource-question.json)，原始需求在 [resource-question-rendering.md](resource-question-rendering.md)。

## 组件接口

```vue
<article ref="content">
  <ArticleContentRenderer
    :key="articleVersion"
    :document="article"
    :article-key="articleVersion"
    :revealed-keys="revealedKeys"
    :scroll-container="getScrollContainer"
    :scroll-offset="64"
    @renderer-ready="rememberRuntime"
    @option-select="handleOptionSelect"
    @render-error="handleRenderError"
  />
</article>
```

`revealedKeys` 默认 `[]`。渲染器从原始文档依次渲染，显示首个未解锁问题后停止，不创建后续正文和插槽的 DOM。点击只发送 `option-select`，不会自行解锁，也不会请求问题资源接口。

```ts
interface ResourceQuestionSelectEvent {
  questionId: string
  resourceId: string
  optionId: string
  revealKey: string
  targetAnchorId?: string
}

interface ArticleRendererRuntime {
  cancelPendingNavigation(): void
}
```

事件字段读取保存快照，按稳定的选项 ID 匹配。`revealKey` 精确匹配，不要求与 `questionId` 相同。所有合法点击都发出事件，包括没有配置目标、目标已删除的选项。

Vue 2 组件继续使用函数式多根输出，不能通过组件 `ref` 获取实例方法。`renderer-ready` 在挂载时提供该实例的运行时句柄；保存后调用 `runtime.cancelPendingNavigation()`。取消仅清除定位任务，不修改宿主的解锁状态；卸载后旧句柄不会影响新实例。

`scrollContainer` 接收 `HTMLElement` 或 `() => HTMLElement | null`，省略时滚动页面。模板引用在挂载后才存在，建议传 getter。目标必须属于该容器。`scrollOffset` 是顶部遮挡的像素数，默认 `0`。渲染器在 Vue 提交 DOM 后等待下一帧并读取布局，滚动后聚焦目标；尊重系统减少动态效果设置。不使用全局 ID 查询或拼接锚点选择器。

目标仍被后面的隐藏问题阻挡时，保留最新任务；成功定位后清除，不重复滚动。新的选项点击、文章对象替换、`articleKey` 变化、解锁标识被移除和卸载会取消旧任务。`articleKey` 是宿主文章版本或加载代次，不写入协议 JSON。

## 使用方控制滚动时机

可选 Prop `onAnchorNavigate` 接收导航回调，模板写法为 `:on-anchor-navigate="handleAnchorNavigate"`。不传时，可见目标在点击后默认定位，隐藏目标等待解锁和 DOM 就绪后定位。

传入后，组件先发送 `option-select`，再为存在于完整文章中的绑定目标调用一次回调。回调收到 `ResourceQuestionNavigationRequest`，其中包含选项事件字段、必填的 `targetAnchorId`、`scrollToAnchor()` 和 `cancel()`。

```ts
handleAnchorNavigate(request: ResourceQuestionNavigationRequest): void {
  this.pendingNavigation = request
},
scrollWhenReady(): void {
  this.pendingNavigation?.scrollToAnchor()
  this.pendingNavigation = null
}
```

先在 Vue `data` 中定义 `pendingNavigation: null as ResourceQuestionNavigationRequest | null`。使用方在合适时机调用 `scrollWhenReady()`，例如点击页面按钮或关闭弹窗后。组件只有收到 `scrollToAnchor()` 调用才开始定位；回调返回、Promise 完成或解锁列表变化不会自动触发滚动。目标仍隐藏时继续等待，不擅自解锁。

新选择、取消、重新隐藏、切换文章、卸载或成功定位后，旧请求的方法失效；使用方也应清理保存的旧句柄。回调异常通过 `render-error` 报告 `NAVIGATION_CALLBACK_FAILED`，不会恢复自动定位。没有绑定目标或目标已失效时不调用导航回调，但仍发出选项事件。完整示例见 [README](../README.md#onanchornavigate由使用方决定滚动时机)。

## 宿主异步业务

以下代码展示宿主需要保存的状态；`requestBusinessApproval` 由业务项目实现。

```ts
let articleGeneration = 0
let interaction = 0
let runtime: ArticleRendererRuntime | null = null
let revealedKeys: string[] = []

async function handleOptionSelect(event: ResourceQuestionSelectEvent) {
  const generation = articleGeneration
  const selection = ++interaction
  const isCurrent = () => generation === articleGeneration && selection === interaction
  try {
    const allowed = await requestBusinessApproval(event)
    if (!isCurrent()) return
    if (!allowed) {
      runtime?.cancelPendingNavigation()
      return
    }
    // 在 Vue data/ref 中更新该状态，再通过 Prop 传入组件。
    revealedKeys = [...new Set([...revealedKeys, event.revealKey])]
  } catch {
    if (isCurrent()) runtime?.cancelPendingNavigation()
  }
}

function cancelSelection() {
  interaction += 1
  runtime?.cancelPendingNavigation()
}

function beforeSwitchArticle() {
  articleGeneration += 1
  cancelSelection()
  revealedKeys = []
  // 然后更新 article 和 articleKey；卸载时同样使旧请求失效。
}
```

切换文章时必须由宿主清空 `revealedKeys`。渲染器始终以宿主当前传入的列表为准，不修改该 Prop。若要恢复进度，按用户、文章及版本保存并明确恢复；不同文章可以使用相同固定 `revealKey`，不能共用一份全局列表。渲染器能取消旧定位，但无法拦截宿主自己提交的过期业务结果，宿主必须检查文章代次和交互序号。

不要在每次 `option-select` 开始时调用 `cancelPendingNavigation()`，否则会取消渲染器刚记录的本次目标。新点击已自动替换旧目标。只在业务拒绝、失败、主动取消或重新锁定时调用。

可运行的 Vue 2 示例在 [ResourceQuestionDemo.vue](../demo/ResourceQuestionDemo.vue)。执行 `npm run dev` 后访问 `http://localhost:5173/?demo=resource-question`，可测试立即允许、延迟允许、拒绝、取消、重新隐藏和切换文章。

## 校验与兼容

先按下载协议的 `documentSchema` 校验结构，再检查内容模型和跨节点身份。保留旧版默认值：省略的 `orderedList.attrs.start` 为 `1`，省略的 `codeBlock.attrs` 为 `{}`，省略的 link `target` 为 `_blank`。校验使用副本补充默认值，不修改输入。

- 问题 ID、所有问题的 revealKey、全篇 paragraph/heading 的 anchorId 分别唯一；选项 ID 在所属问题内唯一。重复会产生 `DUPLICATE_IDENTITY`，即使非严格模式也停止正文渲染。
- 资源问题只允许在顶层。包含问题的文章必须通过结构校验；非法问题不能跳过成为意外放行后文的入口。
- 失效目标产生 `MISSING_ANCHOR`，其 `severity` 为 `warning`，`valid` 仍可为 `true`，严格模式也保留文章。旧错误没有 `severity` 字段时按错误处理。
- 合法未配置问题显示“暂无问题内容”，仍受相同隐藏规则约束。
- 问题、描述和选项始终按纯文本渲染。选择、授权结果、解锁列表不写回 JSON。

`getVisibleContent(document, revealedKeys)` 是导出的只读计算工具，输入应先通过 `validateArticleDocument`。每次使用完整文档计算。

隐藏只控制展示。完整 JSON 仍在客户端；敏感内容应由服务器在鉴权后返回，`revealKey` 不是密码或授权凭证。

## 其他协议扩展

- `textStyle`：`attrs.color` 六位十六进制颜色，输出文字颜色。
- `highlight`：同样的颜色格式，输出背景高亮。
- `paragraph.attrs.fontSize`：8–96 的整数像素值。
- `paragraph/heading.attrs.anchorId`：非空且非纯空白的全篇唯一锚点。
- `image.attrs.imageLayout: "two-column"`：连续同层图片每两张一行，奇数尾图占半行；其他正文或实际插槽内容打断图片行。嵌套引用、列表和表格内也适用。原始尺寸保留，按容器等比例缩放。
