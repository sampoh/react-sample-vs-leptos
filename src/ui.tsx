// 再利用する小さな UI 部品
import { type ReactNode, type Ref, useLayoutEffect, useRef } from "react";
import { fmtInt } from "./util";

export const BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-xs transition hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-xs transition hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
export const INPUT =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-800";

/** ページ見出し */
export function PageHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{lead}</p>
    </header>
  );
}

/** 枠付きのカード */
export function Card({
  title,
  note,
  badge,
  children,
}: {
  title?: string;
  note?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      {(title || badge) && (
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold">{title}</h2>
          {badge}
        </div>
      )}
      {note && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 数値 + ラベルの小さな統計表示 */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums">{value}</div>
    </div>
  );
}

/**
 * 呼び出したコンポーネントのレンダー (コミット) 回数を数え、返した ref の要素に表示する。
 * 回数を state に入れるとそれ自体が再レンダーを起こすので、ref と DOM の直接書き換えで数える。
 * 表示先の要素には子を渡さないこと (React が中身を上書きするため)。
 */
export function useRenderCount<T extends HTMLElement>() {
  const el = useRef<T>(null);
  const n = useRef(0);
  useLayoutEffect(() => {
    n.current += 1;
    if (el.current) el.current.textContent = fmtInt(n.current);
  });
  return el;
}

/** Card の右上に置く「再レンダー N 回」バッジ */
export function RenderBadge({ ref }: { ref: Ref<HTMLSpanElement> }) {
  return (
    <span className="shrink-0 rounded-full border border-zinc-300 px-2 py-0.5 font-mono text-xs text-zinc-500 tabular-nums dark:border-zinc-700 dark:text-zinc-400">
      {"render "}
      <span ref={ref} />
    </span>
  );
}
