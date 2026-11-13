# 活人感 provider · cortico-provider-humanize

和 [活人感（cortico-world-humanize）](https://github.com/abbabanana/cortico-world-humanize) 搭配使用的 Cortico provider。

它提供一种模型端点「活人感（包住 Coo 连接）」。切到这种端点后，你对桌宠说话时，它先等活人感 World 想好桌宠此刻的心情，再把心情和你的话一起发给模型。主模型这一轮就带着心事开口，不用先调用 `humanize_feel` 再多跑一轮。

- **只影响你切过去的那个端点**。别的端点模块、Coopanion 本身都不碰，也不写任何配置。
- **World 开着**：等心事（最多 5 秒），追加在这一批事件的末尾，然后转发。
- **World 关着，或者那边出了任何错**：原样转发，就是一条普通的 Coo 连接。最坏就是这一轮没有心事，桌宠照常说话。
- 思考档、价格、模型列表、配置项都沿用 Coo 的。只改发出去的那一次请求，会话记录不动。

## 安装

1. Coopanion 的「扩展」页搜「活人感」，把 `cortico-world-humanize` 和 `cortico-provider-humanize` 都装上，重启 Coopanion。
2. 打开「模型」页，点「+ 新建供应商实例」：
   - 类型选「活人感（包住 Coo 连接）」；
   - 地址、模型、思考档、API Key 照你现在用的端点填（比如 DeepSeek 的 `https://api.deepseek.com`、`deepseek-flash`）；
   - 名字随便起，比如 `deepseek-活人感`，保存。
3. 选中它，点「设为当前供应商」。
4. 到 World 页的「活人感」，按提示把它关掉再打开一次。

不知道该填什么的话，World 页「活人感 → 配置」顶部会列出这几步，并把你现在用的端点的地址和模型抄出来给你对着填。

「provider」徽章显示「已生效」，就说明在用了；「provider 注入」是心事塞进请求的次数。

目前只支持 Coo 连接的端点。

> 不装这个 provider，只装 World 也能用，只是桌宠每次要先调用 `humanize_feel`，多跑一轮。

## 开关

Coopanion 的模型扩展没有停用开关，所以开关放在「活人感」里：World 页「活人感 → 配置 → 基本设置」的「用「活人感 provider」」，默认开。关掉后本扩展原样转发、什么都不做，桌宠改回先调用 `humanize_feel`。改完把活人感关掉再打开一次。

也可以直接在「模型」页把当前供应商切回原来的端点。

## 卸载

**先切回原来的端点**：「模型」页选中原来的端点，点「设为当前供应商」。然后在「扩展」页卸掉本扩展，重启。

当前端点还是活人感端点时就卸掉，Coopanion 找不到这种端点，桌宠会说不了话。

## 从旧版升级

- **0.2.x**：0.2.x 装上就会接管所有端点模块，因为「改写发给主模型的每个请求」被市场下架了；0.3 起去掉了这种做法。升级后你原来的端点不再带活人感（不会出错，只是桌宠每次多跑一轮），按上面「安装」的第 2–4 步切过去即可。
- **0.3.0**：0.3.0 配套的活人感 World 有「一键切换到活人感端点」，会替你写端点配置；市场认为这些配置不归 World 管，0.3.1 起改成只给步骤。已经切过去的不受影响。

## 为什么不做推理预填充

DeepSeek 的前缀续写（`/beta`）不允许和工具调用一起用，而桌宠只能通过 `pet_say` 工具说话，所以做不了。实测返回：`Function call should not be used with prefix`。

## 市场标签说明

- `requires-extension`：要和活人感 World 一起用才有作用，单独用就是一条普通的 Coo 连接。
- `experimental`：还在测试，只在少数环境里验证过（Windows、DeepSeek）。

## 许可证

AGPL-3.0-or-later。它在运行时包住 Coopanion 自带的 Coo 连接模块（`cortico-provider-coo`，AGPL-3.0-or-later），所以用同样的许可证。

---

## English

**Humanize provider** pairs with the [Humanize World](https://github.com/abbabanana/cortico-world-humanize). It adds one model endpoint type, "Humanize", which wraps Coopanion's Coo connection: when the person speaks, it waits for the World to write the pet's inner thought and sends it along with their words, so the main model answers with it in a single round. Only endpoints of this type are affected; other provider modules and Coopanion itself are left alone, and nothing is written to your configuration. To set it up, install both extensions and restart, then on the Models page create a new connection of type "Humanize (wraps the Coo connection)" with the same address, model and key as your current one, and set it as the current connection. Before uninstalling, set your original connection back as current. Licensed under AGPL-3.0-or-later, the same as the Coo connection it wraps.
