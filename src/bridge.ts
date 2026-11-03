/**
 * 与 cortico-world-humanize/src/bridge.ts 约定的同一座桥（那边是定义方，这里只读）。
 * World 没启用时 globalThis 上没有它，provider 就原样转发。
 */
export const BRIDGE_KEY = Symbol.for('cortico-humanize.bridge');
export const BRIDGE_VERSION = 2;

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

/** 当前挂着的桥；没有或版本对不上返回 null。 */
export function bridge(): HumanizeBridge | null {
  const b = (globalThis as Record<symbol, unknown>)[BRIDGE_KEY] as HumanizeBridge | undefined;
  return b && b.version === BRIDGE_VERSION ? b : null;
}
