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
