# 活人感 provider · cortico-provider-humanize

和 [活人感（cortico-world-humanize）](https://github.com/abbabanana/cortico-world-humanize) 搭配使用的 Cortico provider。

它包住 Coopanion 自带的 Coo 连接。你对桌宠说话时，它先等活人感 World 想好桌宠此刻的心情，再把心情和你的话一起发给模型。主模型这一轮就带着心事开口，不用先调用 `humanize_feel` 再多跑一轮。

- **World 开着**：等心事（最多 5 秒），追加在这一批事件的末尾，然后转发。
- **World 关着，或者那边出了任何错**：原样转发，就是一条普通的 Coo 连接。最坏就是这一轮没有心事，桌宠照常说话。
- 思考档、价格、模型列表、配置项全部沿用 Coo 的。
- 只改发出去的那一次请求，会话记录不动。

## 安装

1. 先装好并打开 [活人感 World](https://github.com/abbabanana/cortico-world-humanize)。
2. Coopanion 的「扩展」页搜 `cortico-provider-humanize`，安装，重启。
3. 「模型」页新建一个端点：模块选「活人感（包住 Coo 连接）」，地址、Key、模型、思考档照你现在用的那个填（比如 DeepSeek 的 `https://api.deepseek.com`、`deepseek-flash`）。
4. 把当前端点切到这个新端点。
5. 活人感会提醒你系统前缀要刷新：在 World 页把「活人感」关掉再打开一次。

之后在活人感的「最近 20 轮记录」里看到「经 provider 注入」，就说明生效了。想换回去，把当前端点切回原来那个即可。

## 卸载

**先在「模型」页把当前端点切回原来那个**，再在「扩展」页卸掉这个包，然后重启。端点还指着它就卸掉，Coopanion 找不到这个模块，桌宠会说不了话。

## 为什么不做推理预填充

DeepSeek 的前缀续写（`/beta`）不允许和工具调用一起用，而桌宠只能通过 `pet_say` 工具说话，所以做不了。实测返回：`Function call should not be used with prefix`。

## 市场标签说明

- `requires-extension`：要和活人感 World 一起用才有作用，单独装就是一条普通的 Coo 连接。
- `experimental`：还在测试，只在少数环境里验证过（Windows、DeepSeek）。

## 许可证

AGPL-3.0-or-later。它在运行时包住 Coopanion 自带的 Coo 连接模块（`cortico-provider-coo`，AGPL-3.0-or-later），所以用同样的许可证。

---

## English

**Humanize provider** pairs with the [Humanize World](https://github.com/abbabanana/cortico-world-humanize). It wraps Coopanion's own Coo connection and, when the person speaks, waits for the World to write the pet's inner thought, then sends it along with the person's words, so the main model answers with it in a single round. With the World off, or on any error on the World's side, it forwards requests unchanged. Switch the active endpoint back before uninstalling it. Licensed under AGPL-3.0-or-later, the same as the Coo connection it wraps.
