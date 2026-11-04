# 活人感 provider · cortico-provider-humanize

和 [活人感（cortico-world-humanize）](https://github.com/abbabanana/cortico-world-humanize) 搭配使用的 Cortico provider。

装上以后，你现在用的模型端点就会带上活人感：你对桌宠说话时，先等活人感 World 想好桌宠此刻的心情，再把心情和你的话一起发给模型。主模型这一轮就带着心事开口，不用先调用 `humanize_feel` 再多跑一轮。

- **World 开着**：等心事（最多 5 秒），追加在这一批事件的末尾，然后转发。
- **World 关着，或者那边出了任何错**：原样转发，和没装一样。最坏就是这一轮没有心事，桌宠照常说话。
- 端点的地址、Key、模型、思考档、价格都不动，还是你原来配的。
- 只改发出去的那一次请求，会话记录不动。

## 安装

1. Coopanion 的「扩展」页搜「活人感」，把 `cortico-world-humanize` 和 `cortico-provider-humanize` 都装上。
2. 重启 Coopanion。
3. World 页打开「活人感」。如果它已经开着，提示「系统前缀需要刷新」时，把它关掉再打开一次。

不用到「模型」页做任何设置。World 页「活人感」的「provider」徽章显示「已生效」，就说明在用了；「provider 注入」是心事塞进请求的次数。

## 开关

Coopanion 的模型扩展没有停用开关，所以开关放在「活人感」里：World 页「活人感 → 配置 → 基本设置」的「用「活人感 provider」」，默认开。关掉后本扩展原样转发、什么都不做，桌宠改回先调用 `humanize_feel`，不用卸载。改完把活人感关掉再打开一次。

> 不装这个 provider，只装 World 也能用，只是桌宠每次要先调用 `humanize_feel`，多跑一轮。

## 卸载

「扩展」页卸掉，重启。端点还是原来的端点，不用先做别的。

**例外**：如果你用 0.1.0 时在「模型」页新建过「活人感」端点（模块叫「活人感（旧版端点，不用再新建）」），并且当前端点还是它，要**先把当前端点切回原来那个**再卸载，不然 Coopanion 找不到这个模块，桌宠会说不了话。

## 从 0.1.0 升级

升级后原来的「活人感」端点照样能用。建议在「模型」页切回你原来的端点（比如 `deepseek`），然后可以删掉那个「活人感」端点，以后卸载就不用担心了。切换后在 World 页把活人感关开一次。

## 为什么不做推理预填充

DeepSeek 的前缀续写（`/beta`）不允许和工具调用一起用，而桌宠只能通过 `pet_say` 工具说话，所以做不了。实测返回：`Function call should not be used with prefix`。

## 市场标签说明

- `requires-extension`：要和活人感 World 一起用才有作用，单独装就是原样转发。
- `experimental`：还在测试，只在少数环境里验证过（Windows、DeepSeek）。

## 许可证

AGPL-3.0-or-later。它在运行时包住 Coopanion 自带的端点模块（包括 `cortico-provider-coo`，AGPL-3.0-or-later），所以用同样的许可证。

---

## English

**Humanize provider** pairs with the [Humanize World](https://github.com/abbabanana/cortico-world-humanize). Install both and restart; there is nothing to set up. Your current model endpoint then waits for the World to write the pet's inner thought whenever the person speaks, and sends it along with their words, so the main model answers with it in a single round. With the World off, or on any error on the World's side, requests pass through unchanged. Uninstalling needs no preparation, unless you still use an endpoint created with the 0.1.0 "Humanize" module: switch back to your original endpoint first. Licensed under AGPL-3.0-or-later, the same as the Coo connection it wraps.
