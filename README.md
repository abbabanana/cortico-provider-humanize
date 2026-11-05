# 活人感 provider · cortico-provider-humanize

和 [活人感（cortico-world-humanize）](https://github.com/abbabanana/cortico-world-humanize) 搭配使用的 Cortico provider。

它提供一种模型端点「活人感（包住 Coo 连接）」。切到这种端点后，你对桌宠说话时，它先等活人感 World 想好桌宠此刻的心情，再把心情和你的话一起发给模型。主模型这一轮就带着心事开口，不用先调用 `humanize_feel` 再多跑一轮。

- **只影响你切过去的那个端点**。别的端点模块、Coopanion 本身都不碰。
- **World 开着**：等心事（最多 5 秒），追加在这一批事件的末尾，然后转发。
- **World 关着，或者那边出了任何错**：原样转发，就是一条普通的 Coo 连接。最坏就是这一轮没有心事，桌宠照常说话。
- 思考档、价格、模型列表、配置项都沿用 Coo 的。只改发出去的那一次请求，会话记录不动。

## 安装

1. Coopanion 的「扩展」页搜「活人感」，把 `cortico-world-humanize` 和 `cortico-provider-humanize` 都装上，重启 Coopanion。
2. World 页打开「活人感」，在「配置 → 基本设置」里勾「切换到活人感端点」。它会照着你现在用的端点复制一个「活人感」端点（地址、模型、Key 都一样）并切过去，和「模型」页的「复制端点」做的是同一件事，只是替你点了。
3. 再重启一次 Coopanion，按提示把活人感关掉再打开一次。

World 页「活人感」的「provider」徽章显示「已生效」，就说明在用了；「provider 注入」是心事塞进请求的次数。

目前只支持 Coo 连接的端点。想自己建也行：「模型」页新建端点，模块选「活人感（包住 Coo 连接）」，其余照你原来的端点填。

> 不装这个 provider，只装 World 也能用，只是桌宠每次要先调用 `humanize_feel`，多跑一轮。

## 开关

Coopanion 的模型扩展没有停用开关，所以开关放在「活人感」里：World 页「活人感 → 配置 → 基本设置」的「用「活人感 provider」」，默认开。关掉后本扩展原样转发、什么都不做，桌宠改回先调用 `humanize_feel`。改完把活人感关掉再打开一次。

## 卸载

**先切回原来的端点**：活人感「基本设置」里勾「切回原来的端点」，重启 Coopanion。然后在「扩展」页卸掉本扩展，再重启。

当前端点还是活人感端点时就卸掉，Coopanion 找不到这种端点，桌宠会说不了话。

## 从 0.2.x 升级

0.2.x 装上就会接管所有端点模块，因为「改写发给主模型的每个请求」被市场下架了；0.3.0 去掉了这种做法。升级后你原来的端点不再带活人感（不会出错，只是桌宠每次多跑一轮），按上面「安装」的第 2、3 步切过去即可。

## 为什么不做推理预填充

DeepSeek 的前缀续写（`/beta`）不允许和工具调用一起用，而桌宠只能通过 `pet_say` 工具说话，所以做不了。实测返回：`Function call should not be used with prefix`。

## 市场标签说明

- `requires-extension`：要和活人感 World 一起用才有作用，单独用就是一条普通的 Coo 连接。
- `experimental`：还在测试，只在少数环境里验证过（Windows、DeepSeek）。

## 许可证

AGPL-3.0-or-later。它在运行时包住 Coopanion 自带的 Coo 连接模块（`cortico-provider-coo`，AGPL-3.0-or-later），所以用同样的许可证。

---

## English

**Humanize provider** pairs with the [Humanize World](https://github.com/abbabanana/cortico-world-humanize). It adds one model endpoint type, "Humanize", which wraps Coopanion's Coo connection: when the person speaks, it waits for the World to write the pet's inner thought and sends it along with their words, so the main model answers with it in a single round. Only endpoints of this type are affected; other provider modules and Coopanion itself are left alone. To set it up, install both extensions, restart, tick "Switch to the Humanize endpoint" in the World's settings (it copies your current Coo endpoint and switches to the copy), and restart again. Before uninstalling, tick "Switch back" and restart. Licensed under AGPL-3.0-or-later, the same as the Coo connection it wraps.
