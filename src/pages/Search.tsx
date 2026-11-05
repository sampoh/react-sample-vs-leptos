import { useMemo, useState } from "react";
import { INPUT, PageHeader } from "../ui";
import { Rng, at, fmtInt, now } from "../util";

const CATEGORIES = ["家具", "文具", "家電", "衣類", "食器", "工具"];
const WORDS_A = [
  "Quiet", "Bright", "Tiny", "Grand", "Soft", "Rapid", "Silver", "Hollow",
  "Lucky", "Plain", "Urban", "Polar", "Amber", "Swift", "Noble", "Misty",
];
const WORDS_B = [
  "Lamp", "Chair", "Desk", "Kettle", "Pencil", "Jacket", "Bowl", "Hammer",
  "Shelf", "Clock", "Mug", "Scarf", "Wrench", "Fan", "Notebook", "Plate",
];
const SHOW = 100;

type Item = {
  sku: string;
  skuLower: string;
  name: string;
  lower: string; // 検索用に小文字化したもの
  cat: number;
  price: number;
};

function generate(n: number): Item[] {
  const rng = new Rng(2024);
  return Array.from({ length: n }, (_, i) => {
    const name = `${at(WORDS_A, rng.below(16))} ${at(WORDS_B, rng.below(16))} ${rng.below(900) + 100}`;
    const sku = `SKU-${String(i).padStart(6, "0")}`;
    return {
      sku,
      skuLower: sku.toLowerCase(),
      name,
      lower: name.toLowerCase(),
      cat: rng.below(CATEGORIES.length),
      price: (rng.below(500) + 1) * 100,
    };
  });
}

type Sort = "sku" | "asc" | "desc";

/** 一致部分を <mark> で強調 */
function Highlight({ name, lower, q }: { name: string; lower: string; q: string }) {
  const pos = q ? lower.indexOf(q) : -1;
  if (pos < 0 || lower.length !== name.length) return name;
  return (
    <>
      {name.slice(0, pos)}
      <mark className="rounded-sm bg-zinc-200 text-inherit dark:bg-zinc-700">{name.slice(pos, pos + q.length)}</mark>
      {name.slice(pos + q.length)}
    </>
  );
}

const CHIP = "rounded-full border px-3 py-1 text-xs transition";

export function Search() {
  const [count, setCount] = useState(10_000);
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState(() => CATEGORIES.map(() => true));
  const [sort, setSort] = useState<Sort>("sku");

  const items = useMemo(() => generate(count), [count]);
  const q = query.trim().toLowerCase();

  // フィルタ + ソート。依存 (件数・検索語・カテゴリ・並び順) が変わったときだけ再計算
  const [hits, ms] = useMemo(() => {
    const t0 = now();
    const out: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = at(items, i);
      if (cats[it.cat] && (!q || it.lower.includes(q) || it.skuLower.includes(q))) out.push(i);
    }
    if (sort === "asc") out.sort((a, b) => at(items, a).price - at(items, b).price);
    else if (sort === "desc") out.sort((a, b) => at(items, b).price - at(items, a).price);
    return [out, now() - t0] as const;
  }, [items, q, cats, sort]);

  return (
    <>
      <PageHeader
        title="即時検索"
        lead="キーを押すたびに全件を走査してフィルタ・ソートします。デバウンスも、useDeferredValue も、仮想スクロールのライブラリも使っていません。"
      />
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="例: lamp, silver 4, SKU-0001"
            aria-label="検索"
            className={INPUT}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="件数"
            className={`${INPUT} sm:w-44`}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 10_000)}
          >
            <option value="10000">10,000 件</option>
            <option value="50000">50,000 件</option>
            <option value="100000">100,000 件</option>
          </select>
          <select
            aria-label="並び順"
            className={`${INPUT} sm:w-44`}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="sku">SKU 順</option>
            <option value="asc">価格の安い順</option>
            <option value="desc">価格の高い順</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              type="button"
              className={
                cats[i]
                  ? `${CHIP} border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900`
                  : `${CHIP} border-zinc-300 text-zinc-500 dark:border-zinc-700`
              }
              onClick={() => setCats((cs) => cs.map((v, j) => (j === i ? !v : v)))}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-mono tabular-nums">{fmtInt(count)}</span> 件中{" "}
          <span className="font-mono font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
            {fmtInt(hits.length)}
          </span>{" "}
          件 · フィルタとソート <span className="font-mono tabular-nums">{ms.toFixed(2)} ms</span>
        </p>
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800/60 dark:border-zinc-800">
          {hits.slice(0, SHOW).map((i) => {
            const it = at(items, i);
            return (
              <li
                key={it.sku}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-2 text-sm sm:grid-cols-[8rem_1fr_5rem_6rem]"
              >
                <span className="hidden font-mono text-xs text-zinc-500 sm:block">{it.sku}</span>
                <span className="truncate">
                  <Highlight name={it.name} lower={it.lower} q={q} />
                </span>
                <span className="hidden text-xs text-zinc-500 sm:block">{CATEGORIES[it.cat]}</span>
                <span className="text-right font-mono tabular-nums">¥{fmtInt(it.price)}</span>
              </li>
            );
          })}
        </ul>
        {hits.length > SHOW && (
          <p className="text-center text-xs text-zinc-500">
            上位 {SHOW} 件を表示しています（残り {fmtInt(hits.length - SHOW)} 件）
          </p>
        )}
      </div>
    </>
  );
}
