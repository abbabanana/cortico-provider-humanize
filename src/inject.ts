/**
 * 把心事写进请求。Core 把每批外部事件投成一帧：`external_event_frame` 调用加它的输出，输出正文就是
 * 那几行事件。心事追加在那一帧输出的末尾，模型看到的和一条普通事件一样。
 *
 * 只改这一次请求用的副本，session 里存的原样不动；同一帧在之后每次请求里都照样补上，
 * 请求前缀保持稳定，缓存照常命中。
 */
import type { ContextRecord } from 'cortico/protocol/open-responses/context.ts';
import type { MainContext } from './bridge.ts';

/** 请求刚投递进来的那一帧：上下文最后一项就是带事件的帧输出时返回它，否则 null(工具回执后的续轮等)。 */
export function newestFrame(context: readonly ContextRecord[]): { callId: string; cursors: number[] } | null {
  const last = context.at(-1);
  if (!last || last.item.type !== 'function_call_output') return null;
  const events = last.context.frame?.events;
  if (!events?.length) return null;
  return { callId: last.item.call_id, cursors: events.map((e) => e.cursor) };
}

const append = (output: unknown, text: string): unknown => (typeof output === 'string' ? `${output}\n${text}` : output);

/** 上下文副本：记过心事的帧输出末尾补上心事。 */
export function contextWithInner(context: readonly ContextRecord[], inner: ReadonlyMap<string, string>): ContextRecord[] {
  return context.map((r) => {
    if (r.item.type !== 'function_call_output') return r;
    const text = inner.get(r.item.call_id);
    return text ? { ...r, item: { ...r.item, output: append(r.item.output, text) } as typeof r.item } : r;
  });
}

/** `request.input` 副本：同上，给不读 `options.context` 的客户端。 */
export function inputWithInner<T>(input: T, inner: ReadonlyMap<string, string>): T {
  if (!Array.isArray(input)) return input;
  return input.map((item: { type?: string; call_id?: string; output?: unknown }) => {
    if (item?.type !== 'function_call_output' || !item.call_id) return item;
    const text = inner.get(item.call_id);
    return text ? { ...item, output: append(item.output, text) } : item;
  }) as T;
}

/** 交给副 API 的上限：前缀最多这么多字，最近上下文最多这么多条、每条这么多字。 */
const INSTRUCTIONS_CHARS = 30_000;
const RECENT_ITEMS = 12;
const ITEM_CHARS = 400;
const FRAME = 'external_event_frame';

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);

function partsText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((p: { text?: unknown }) => (typeof p?.text === 'string' ? p.text : '')).join('');
}

/** 一条上下文写成一行给副 API 看；推理和 Core 自己的帧调用不要。 */
function itemLine(item: { type?: string; role?: string; content?: unknown; name?: string; arguments?: string; output?: unknown }): string {
  switch (item.type) {
    case 'message': {
      const text = partsText(item.content).trim();
      if (!text || text.startsWith('[system]')) return '';
      return `${item.role === 'assistant' ? '[桌宠]' : '[输入]'} ${clip(text, ITEM_CHARS)}`;
    }
    case 'function_call':
      return item.name === FRAME ? '' : `[桌宠调用 ${item.name}] ${clip(item.arguments ?? '', ITEM_CHARS)}`;
    case 'function_call_output': {
      const text = partsText(item.output).trim();
      return text ? `[结果] ${clip(text, ITEM_CHARS)}` : '';
    }
    default:
      return '';
  }
}

/** 主模型这次请求的系统前缀和最近几条上下文，截短后交给 World。 */
export function mainContext(request: { instructions?: unknown; input?: unknown }, context: readonly ContextRecord[] | undefined): MainContext {
  const instructions = typeof request.instructions === 'string' ? request.instructions : partsText(request.instructions);
  const items = (context?.map((r) => r.item) ?? (Array.isArray(request.input) ? request.input : [])) as Parameters<typeof itemLine>[0][];
  const recent: string[] = [];
  for (let i = items.length - 1; i >= 0 && recent.length < RECENT_ITEMS; i--) {
    const line = itemLine(items[i]);
    if (line) recent.unshift(line);
  }
  return { instructions: clip(instructions.trim(), INSTRUCTIONS_CHARS), recent };
}

/** 等 `pending`,最多 `ms`;超时或请求被取消都给 null。 */
export function capped<T>(pending: Promise<T | null>, ms: number, signal?: AbortSignal): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => done(null), ms);
    const onAbort = () => done(null);
    function done(v: T | null) {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(v);
    }
    if (signal?.aborted) return done(null);
    signal?.addEventListener('abort', onAbort, { once: true });
    pending.then(done, () => done(null));
  });
}
