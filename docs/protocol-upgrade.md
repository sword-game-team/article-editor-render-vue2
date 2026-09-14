# 协议升级指南（Vue 2）

协议升级集中在组件库内部，业务项目继续使用稳定的 Props、Events 和 resolver API。

1. 把原始协议保存到 `protocol/article-content-protocol-v{version}.json`。
2. 在 `src/protocols/v{version}` 新建 validator、renderer 和元数据。
3. validator 同时检查 JSON 结构、`contentModel` 和 `constraints`。
4. renderer 使用 Vue 2 `CreateElement` 创建 VNode，不得使用 `v-html`。
5. 在 `src/protocols/registry.ts` 注册新的 `ProtocolAdapter`。
6. 更新 `CURRENT_PROTOCOL_VERSION` 和公共联合类型。
7. 为新旧版本兼容、安全策略和默认值补充测试。
8. 执行 `npm run check` 和 `npm run demo:build`。

Vue 2 版本的协议逻辑应与 Vue 3 版本保持一致；仅 VNode 数据结构、事件绑定和根节点兼容方式不同。

## v1 + Extensions

当前下载协议的版本仍为 `1`，在既有 v1 适配器中新增 `textStyle`、`highlight`、段落 `fontSize`、`imageLayout`、`anchorId` 和 `resourceQuestion`。结构先由协议文件内的 `documentSchema` 校验，再执行内容模型和跨节点约束。保留旧版省略默认字段的兼容行为，不修改输入文档。

资源问题按顶层顺序受宿主 `revealedKeys` 控制，点击只通知宿主。定位状态由实例内生命周期组件管理，继续保持 Vue 2 多根输出；使用 `renderer-ready` 获取取消入口。详见 [Vue 2 接入说明](resource-question-vue2.md)。升级验收还需覆盖多边界、同步/异步解锁、取消、切换文章、特殊锚点、多实例及 SSR。

可选 `onAnchorNavigate` 回调控制选项点击后的滚动时机：配置后只有调用请求的 `scrollToAnchor()` 才定位，省略时保持原有默认行为。此接口不改变协议 JSON 或宿主解锁规则。验收需覆盖默认滚动、自定义延迟、过期回调失效和异常处理。

已同步包含 `resourceQuestionImage` 的最新 v1 协议，支持可选 `resourceQuestion.attrs.image`。升级必须同时更新 JSON Schema、字段校验、公共类型和渲染输出，仅放开未知字段不能完成图片展示。问题图片按独立的协议地址规则校验，显示在标题上方并保持比例；旧版无图片文档及旧 `targetAnchorId` 绑定继续兼容。

## articleButton 兼容约束

`articleButton` 的 text、button、link 三种样式都使用 `<a>`。text/button 由 resolver 返回完整链接，渲染器不得自动添加 query、hash 或其他节点属性；link 直接使用节点的 `href`，不得调用 resolver。text/button 必须提供 `id`，link 的 `id` 和 `href` 均可省略。

## link mark 兼容约束

`type` 省略时必须按 `href` 处理，以兼容旧文档；显式 `type: "href"` 也直接读取协议中的 `href`。只有 `type: "custom"` 才调用 `resolveCustomLink(attrs, mark)`，并使用回调返回的完整安全地址。custom 类型要求 `id`、`title`，禁止包含 `href`；href 类型要求 `href`，禁止包含 `id`、`title`。两种类型都沿用 `target` 默认值 `_blank`。
