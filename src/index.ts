/**
 * 活人感 provider:一种端点模块（`humanize`），包住 Coopanion 自己的 Coo 连接（`coo` 模块，
 * 从框架的注册表现取，不按路径 import）。只有用户在「模型」页选了这种端点时才起作用，
 * 不碰别的端点模块，也不改框架的任何东西。新建并切到这种端点，可以在活人感 World 页一键完成。
 *
 * (0.2.x 曾在加载时包住所有端点模块，市场以「改写发给主模型的每个请求」为由下架，0.3.0 去掉了。)
 *
 * 每次请求：上下文最后一项是刚投递进来的事件帧时，问「活人感」World 要这批事件引出的心事
 * (连同主模型这次的系统前缀和最近上下文，让副 API 知道主模型知道的一切，不管记忆存在哪)，
 * 等它想好（最多 CAP_MS），把心事追加到帧输出末尾再转发。于是主模型这一轮就带着心事开口，
 * 不用先调 humanize_feel 再等一轮。World 没启用（桥不在）时原样转发，就是一条普通的 Coo 连接。
 *
 * 模块的其余部分（思考档、价目、模型列表、配置项）全部交给 coo;框架里没有 coo 时（比如
 * `check:extension` 的假部署）退回内建的 openai-responses-compat。
 */
import { BaseProvider, type ProviderInstance, type ProviderModule } from 'cortico/providers/base.ts';
import { providerModule } from 'cortico/providers/registry.ts';
import type { GenerateOptions, Generation, ResponseClient } from 'cortico/core/generation.ts';
import type { Request } from 'cortico/protocol/open-responses/index.ts';
import { BRIDGE_VERSION, PROVIDER_KEY, bridge, type ProviderMarker } from './bridge.ts';
import { capped, contextWithInner, inputWithInner, mainContext, newestFrame } from './inject.ts';

export const HUMANIZE_PROVIDER_ID = 'humanize';
const WRAPPED = 'coo';
const FALLBACK = 'openai-responses-compat';
/** 等心事的上限：World 自己的副 API 超时默认 2.5 秒，这里再多留一点。 */
const CAP_MS = 5_000;
/** 记住最近这么多帧的心事，之后的请求照样补上，前缀才稳定。 */
const KEEP = 200;

const TITLE = '活人感（包住 Coo 连接）';
const DESCRIPTION = '和「活人感」World 搭配：你对桌宠说话时，先等 World 想好桌宠的心情，再连同你的话一起发给模型。不用在这里手动新建：在 World 页「活人感 → 配置 → 基本设置」勾「切换到活人感端点」，会照着你现在的端点复制一个并切过去。';

/** 被包住的模块：Coo,没有就内建的 Responses 兼容模块。 */
function wrapped(): ProviderModule {
  try { return providerModule(WRAPPED); } catch { return providerModule(FALLBACK); }
}

type Methods = 'normalize' | 'validateEntry' | 'validateModel' | 'accepts' | 'prices' | 'estimateTokens' | 'contextOverflow' | 'webUi' | 'config';

/** 被包住模块的某个可选方法，绑好 this;没有就 undefined。 */
function method<K extends Methods>(key: K): ProviderModule[K] {
  const m = wrapped();
  const fn = m[key] as unknown;
  return (typeof fn === 'function' ? fn.bind(m) : undefined) as ProviderModule[K];
}

export class HumanizeClient extends BaseProvider {
  /** 帧调用 id → 心事。 */
  private readonly inner: Map<string, string>;

  constructor(private readonly client: ResponseClient, inner?: Map<string, string>) {
    super();
    this.inner = inner ?? new Map();
  }

  /** fork 捕获的绑定也走这一层，和主会话共用同一份心事表。 */
  bind(): ResponseClient {
    return this.client.bind ? new HumanizeClient(this.client.bind(), this.inner) : this;
  }

  /**
   * 活人感这一层出任何错（World 那边抛异常、改写请求出错）都不能连累主模型：一律原样转发，
   * 最坏就是这一轮没有心事。只有被包住的客户端自己报的错才往上抛。
   */
  async respond(request: Request, options: GenerateOptions = {}): Promise<Generation> {
    let rewritten: { request: Request; options: GenerateOptions } | null = null;
    try {
      rewritten = await this.withInner(request, options);
    } catch {
      rewritten = null;
    }
    return rewritten ? this.client.respond(rewritten.request, rewritten.options) : this.client.respond(request, options);
  }

  /** 问 World 要心事、补进请求；不需要改写时给 null。 */
  private async withInner(request: Request, options: GenerateOptions): Promise<{ request: Request; options: GenerateOptions } | null> {
    const b = bridge();
    if (!b) return null;
    b.touch();
    const context = options.context;
    const frame = context?.length ? newestFrame(context) : null;
    if (frame && !this.inner.has(frame.callId)) {
      b.sync();
      // 主模型这次看到的前缀和最近上下文一并交过去；World 那边按「共享上下文」开关决定用不用
      const pending = b.claim(frame.cursors, mainContext(request, context));
      const text = pending ? await capped(pending, CAP_MS, options.signal) : null;
      if (text) this.remember(frame.callId, text);
    }
    if (this.inner.size === 0) return null;
    return {
      request: { ...request, input: inputWithInner(request.input, this.inner) },
      options: context ? { ...options, context: contextWithInner(context, this.inner) } : options,
    };
  }

  private remember(callId: string, text: string): void {
    this.inner.set(callId, text);
    while (this.inner.size > KEEP) this.inner.delete(this.inner.keys().next().value!);
  }
}

/**
 * 字段都用 getter 现取被包住的模块：扩展加载时 coo 可能还没注册，用到时一定已经在了
 * (Coopanion 在解析端点之前把 coo 和扩展 provider 一起注册)。
 */
export const HUMANIZE_PROVIDER: ProviderModule = {
  id: HUMANIZE_PROVIDER_ID,
  title: TITLE,
  description: DESCRIPTION,
  // 和被包住的 Coo 一样：协议、登录方式、输入类型都是它的。写死是为了离开 Coopanion 也能导出 describe.json
  describe: { protocols: ['openai-responses', 'openai-chat', 'anthropic-messages', 'gemini'], auth: ['api-key'], local: false, input: ['text', 'image'] },
  get defaultBaseUrl() { return wrapped().defaultBaseUrl ?? 'https://api.deepseek.com'; },
  get baseUrlSuggestions() { return wrapped().baseUrlSuggestions; },
  get reasoningTiers() { return wrapped().reasoningTiers; },
  get effortSuggestions() { return wrapped().effortSuggestions; },
  get serviceTiers() { return wrapped().serviceTiers; },
  get temperatureNote() { return wrapped().temperatureNote; },
  localize(language) {
    return { ...wrapped().localize?.(language), title: TITLE, description: DESCRIPTION };
  },
  // 可选方法：被包住的模块有才有，框架据此决定要不要走它自己的兜底
  get normalize() { return method('normalize'); },
  get validateEntry() { return method('validateEntry'); },
  get validateModel() { return method('validateModel'); },
  get accepts() { return method('accepts'); },
  get prices() { return method('prices'); },
  get estimateTokens() { return method('estimateTokens'); },
  get contextOverflow() { return method('contextOverflow'); },
  get webUi() { return method('webUi'); },
  // 被包住模块的配置组改挂到本模块名下，键还是 providers.<端点名>.…
  get config() {
    const own = method('config');
    if (!own) return undefined;
    return ((...args: Parameters<NonNullable<ProviderModule['config']>>) => own(...args).map((g) => ({
      ...g, id: g.id.replace(/^llm\.[^.]+\./, `llm.${HUMANIZE_PROVIDER_ID}.`), owner: `provider:${HUMANIZE_PROVIDER_ID}` as const,
    }))) as ProviderModule['config'];
  },
  create(name, entry, host): ProviderInstance {
    const instance = wrapped().create(name, entry, host);
    return { ...instance, client: new HumanizeClient(instance.client) };
  },
} as ProviderModule;

// 告诉 World「装着、已加载」，只认自己这种端点；不碰别的模块
const marker: ProviderMarker = { version: BRIDGE_VERSION, wraps: (kind) => kind === HUMANIZE_PROVIDER_ID };
(globalThis as Record<symbol, unknown>)[PROVIDER_KEY] = marker;

export default HUMANIZE_PROVIDER;
