/**
 * 与 cortico-world-humanize/src/bridge.ts 约定的同一座桥（那边是定义方，这里只读）。
 * World 没启用时 globalThis 上没有它，provider 就原样转发。
 *
 * 反方向还有一块牌子（PROVIDER_KEY）：provider 加载时挂上，告诉 World「我装着，包住了哪些模块」，
 * World 据此判断当前端点是不是走 provider 模式。
 */
export const BRIDGE_KEY = Symbol.for('cortico-humanize.bridge');
export const PROVIDER_KEY = Symbol.for('cortico-humanize.provider');
export const BRIDGE_VERSION = 3;

export interface MainContext {
  instructions: string;
  recent: string[];
}

export interface HumanizeBridge {
  version: typeof BRIDGE_VERSION;
  sync(): void;
  claim(cursors: readonly number[], main: MainContext | null): Promise<string | null> | null;
  touch(): void;
}

export interface ProviderMarker {
  version: typeof BRIDGE_VERSION;
  /** 这种端点模块（端点配置里的 kind）是不是被活人感包着。 */
  wraps(kind: string): boolean;
}

/** 当前挂着的桥；没有或版本对不上返回 null。 */
export function bridge(): HumanizeBridge | null {
  const b = (globalThis as Record<symbol, unknown>)[BRIDGE_KEY] as HumanizeBridge | undefined;
  return b && b.version === BRIDGE_VERSION ? b : null;
}
