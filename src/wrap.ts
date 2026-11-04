/**
 * 不用另建端点：装上就把已注册的每个 provider 模块的 `create` 包一层，你现在用的端点直接带上
 * 活人感。World 没启用（桥不在）时，包着的这层原样转发，和没装一样。
 *
 * 扩展的 provider 模块（比如 Coo）可能在本包之后才注册，所以除了包现有的，还接住注册表数组
 * 之后的 `push`(`registerProviderModules` 就地往这个数组里加，不换引用)。
 *
 * 卸掉本包重启后，这层包装自然就没了，端点还是原来的端点，不会说不了话。
 */
import { providerModules } from 'cortico/providers/registry.ts';
import type { ProviderModule } from 'cortico/providers/base.ts';
import { BRIDGE_VERSION, PROVIDER_KEY, type ProviderMarker } from './bridge.ts';

const WRAPPED = Symbol.for('cortico-humanize.wrapped');
const PUSH_HOOKED = Symbol.for('cortico-humanize.push-hooked');

type Wrappable = ProviderModule & { [WRAPPED]?: true };

/** 包住一个模块的 create;已经包过、或者是活人感自己的旧模块就跳过。成功返回 true。 */
function wrapModule(module: Wrappable, skip: string, wrapClient: (instance: ReturnType<ProviderModule['create']>) => ReturnType<ProviderModule['create']>): boolean {
  if (!module || module.id === skip) return false;
  if (module[WRAPPED]) return true;
  const original = module.create;
  if (typeof original !== 'function') return false;
  try {
    const create: ProviderModule['create'] = function (this: unknown, name, entry, host) {
      return wrapClient(original.call(this ?? module, name, entry, host));
    };
    module.create = create;
    module[WRAPPED] = true;
    return module.create === create;
  } catch {
    // 冻结的对象改不了：这个模块就不带活人感，照常工作
    return false;
  }
}

/** 已经包住的模块 id。 */
const wrappedKinds = new Set<string>();

export function wrapAll(skip: string, wrapClient: (instance: ReturnType<ProviderModule['create']>) => ReturnType<ProviderModule['create']>): void {
  const list = providerModules as ProviderModule[] & { [PUSH_HOOKED]?: true };
  for (const module of list) if (wrapModule(module, skip, wrapClient)) wrappedKinds.add(module.id);
  if (!list[PUSH_HOOKED]) {
    try {
      const push = list.push;
      Object.defineProperty(list, 'push', {
        configurable: true, writable: true, enumerable: false,
        value(this: ProviderModule[], ...items: ProviderModule[]) {
          for (const module of items) if (wrapModule(module, skip, wrapClient)) wrappedKinds.add(module.id);
          return push.apply(this, items);
        },
      });
      Object.defineProperty(list, PUSH_HOOKED, { value: true });
    } catch { /* 接不住就只包现有的 */ }
  }
  const marker: ProviderMarker = {
    version: BRIDGE_VERSION,
    wraps: (kind) => kind === skip || wrappedKinds.has(kind),
  };
  (globalThis as Record<symbol, unknown>)[PROVIDER_KEY] = marker;
}
