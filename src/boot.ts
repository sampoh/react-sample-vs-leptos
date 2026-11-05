// 起動計測値 (概要ページで表示)
import { now } from "./util";

let appStart = 0;
let firstFrame: number | null = null;
const listeners = new Set<() => void>();

/** main.tsx でマウント直前に呼ぶ。Leptos 版の App 開始時刻に相当 */
export function markAppStart() {
  appStart = now();
  requestAnimationFrame(() => {
    firstFrame = now();
    for (const l of listeners) l();
  });
}

export const getAppStart = () => appStart;

/** useSyncExternalStore 用 */
export function subscribeFirstFrame(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export const getFirstFrame = () => firstFrame;
