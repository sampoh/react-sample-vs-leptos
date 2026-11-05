import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { BTN, BTN_PRIMARY, Card, PageHeader, RenderBadge, Stat, useRenderCount } from "../ui";
import { Rng, at, fmtInt, now } from "../util";

const ADJ = ["大きな", "小さな", "静かな", "速い", "古い", "新しい", "丸い", "四角い", "軽い", "重い", "明るい", "暗い"];
const COLOR = ["赤い", "青い", "白い", "黒い", "緑の", "黄色い", "灰色の", "茶色の", "紫の", "銀の"];
const NOUN = ["机", "椅子", "鞄", "時計", "電車", "鉛筆", "窓", "傘", "本", "皿", "鍵", "靴"];

/** 行はイミュータブルなオブジェクト。ラベルを変えるときは新しいオブジェクトに差し替える */
type RowData = { readonly id: number; readonly label: string };
type Rows = readonly RowData[];

const ACTIONS = [
  "1,000 行作成",
  "10,000 行作成",
  "1,000 行追加",
  "10 行ごとに更新",
  "2 行目と 999 行目を入替",
  "全削除",
] as const;
type Action = (typeof ACTIONS)[number];
type Result = { readonly id: number; readonly label: string; readonly ms: number };

const ROW =
  "flex h-8 items-center gap-3 border-b border-zinc-100 px-3 [contain-intrinsic-size:auto_2rem] [content-visibility:auto] hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900";
const ROW_SELECTED =
  "flex h-8 items-center gap-3 border-b border-zinc-100 bg-zinc-100 px-3 [contain-intrinsic-size:auto_2rem] [content-visibility:auto] dark:border-zinc-800/60 dark:bg-zinc-800";

/**
 * 1 行。memo により props (row / selected / コールバック) が前回と同じなら再レンダーを省く。
 * ただし親が再レンダーされるたびに、全行ぶんの props 比較 (と key による突き合わせ) は走る。
 */
const Row = memo(function Row({
  row,
  selected,
  onSelect,
  onRemove,
}: {
  row: RowData;
  selected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <li className={selected ? ROW_SELECTED : ROW}>
      <span className="w-16 shrink-0 font-mono text-xs text-zinc-500 tabular-nums">{row.id}</span>
      <button type="button" className="flex-1 cursor-pointer truncate text-left" onClick={() => onSelect(row.id)}>
        {row.label}
      </button>
      <button
        type="button"
        className="px-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        aria-label="削除"
        onClick={() => onRemove(row.id)}
      >
        ×
      </button>
    </li>
  );
});

export function Benchmark() {
  const renders = useRenderCount<HTMLSpanElement>();
  const [rows, setRows] = useState<Rows>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const nextId = useRef(1);
  const nextResultId = useRef(1);
  const [rng] = useState(() => new Rng(42));

  // 計測結果に「何行になったか」を出すため、コミット済みの行を ref に写しておく
  const committed = useRef(rows);
  useLayoutEffect(() => {
    committed.current = rows;
  });

  const build = useCallback(
    (n: number): RowData[] =>
      Array.from({ length: n }, () => ({
        id: nextId.current++,
        label: `${at(ADJ, rng.below(12))}${at(COLOR, rng.below(10))}${at(NOUN, rng.below(12))}`,
      })),
    [rng],
  );

  /**
   * 操作を実行し、DOM 更新が終わった直後 (setTimeout 0) までの時間を記録する。
   * クリックで呼んだ setState は離散イベントとして同期的にレンダー・コミットされるので、
   * setTimeout のコールバック時点で DOM は更新済み。
   */
  const measure = useCallback((name: string, op: () => void) => {
    const t0 = now();
    op();
    setTimeout(() => {
      const ms = now() - t0;
      const result = {
        id: nextResultId.current++,
        label: `${name}（${fmtInt(committed.current.length)} 行）`,
        ms,
      };
      setResults((l) => [result, ...l].slice(0, 8));
    }, 0);
  }, []);

  const run = (action: Action) => {
    switch (action) {
      case "1,000 行作成":
        return setRows(build(1_000));
      case "10,000 行作成":
        return setRows(build(10_000));
      case "1,000 行追加": {
        const added = build(1_000);
        return setRows((r) => [...r, ...added]);
      }
      case "10 行ごとに更新":
        return setRows((r) => r.map((row, i) => (i % 10 === 0 ? { ...row, label: `${row.label} !!!` } : row)));
      case "2 行目と 999 行目を入替":
        return setRows((r) => {
          if (r.length <= 998) return r;
          const next = r.slice();
          next[1] = at(r, 998);
          next[998] = at(r, 1);
          return next;
        });
      case "全削除":
        return setRows([]);
    }
  };

  // 行に渡すコールバックは useCallback で固定しないと、memo が効かず全行が再レンダーされる
  const onSelect = useCallback((id: number) => setSelected(id), []);
  const onRemove = useCallback(
    (id: number) => measure("1 行削除", () => setRows((r) => r.filter((x) => x.id !== id))),
    [measure],
  );

  return (
    <>
      <PageHeader
        title="ベンチマーク"
        lead="js-framework-benchmark と同じ種類の操作を、このブラウザで実行して時間を測ります。行は memo 化したコンポーネントで、選択・削除のコールバックは useCallback で固定しています。"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ACTIONS.map((name, i) => (
              <button
                key={name}
                type="button"
                className={i < 2 ? BTN_PRIMARY : BTN}
                onClick={() => measure(name, () => run(name))}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="mt-4 h-[60vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            {rows.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-zinc-500">上のボタンで行を作成してください</p>
            ) : (
              // content-visibility: 画面外の行はレイアウト計算をスキップ
              <ul className="text-sm">
                {rows.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
                    selected={row.id === selected}
                    onSelect={onSelect}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
        <aside className="grid content-start gap-3">
          <Stat label="現在の行数" value={fmtInt(rows.length)} />
          <Card title="計測結果" note="クリックから DOM 更新完了まで" badge={<RenderBadge ref={renders} />}>
            <ol className="grid gap-1.5 text-sm">
              {results.map(({ id, label, ms }, i) => (
                <li key={id} className={`flex justify-between gap-2 ${i > 0 ? "text-zinc-500" : ""}`}>
                  <span className="truncate">{label}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">{ms.toFixed(1)} ms</span>
                </li>
              ))}
            </ol>
            {results.length === 0 && <p className="text-sm text-zinc-500">まだありません</p>}
          </Card>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ※ 開発サーバーでは React の開発用ビルドが使われ、遅くなります。正確な数値は npm run build && npm run preview
            で確認してください。右上の render は Benchmark コンポーネント自体のレンダー回数です。
          </p>
        </aside>
      </div>
    </>
  );
}
