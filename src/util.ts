// 小さなユーティリティ。Leptos 版の util.rs と同じものを TypeScript で書いたもの。

/** ページ読み込みからの経過ミリ秒 (performance.now) */
export const now = (): number => performance.now();

/** localStorage ヘルパー (プライベートモード等で例外になっても落ちないように) */
export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 保存できなくても動作は続ける
  }
}

/** 依存ゼロの疑似乱数 (xorshift32)。Leptos 版と同じ数列を返す */
export class Rng {
  #x: number;
  constructor(seed: number) {
    this.#x = Math.max(seed, 1) >>> 0;
  }
  next(): number {
    let x = this.#x;
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    this.#x = x;
    return x;
  }
  below(n: number): number {
    return this.next() % n;
  }
}

const intFmt = new Intl.NumberFormat("en-US");

/** 3 桁区切り */
export const fmtInt = (n: number): string => intFmt.format(n);

export function fmtBytes(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b.toFixed(0)} B`;
}

/** 範囲内と分かっている添字で配列から取り出す (noUncheckedIndexedAccess 用) */
export function at<T>(arr: readonly T[], i: number): T {
  return arr[i] as T;
}
