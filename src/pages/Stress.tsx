import { memo, useEffect, useRef, useState } from "react";
import { BTN, BTN_PRIMARY, PageHeader, Stat } from "../ui";
import { Rng, fmtInt, now } from "../util";

const SIZES = [
  [20, 20],
  [40, 25],
  [50, 40],
  [80, 50],
] as const;
type Size = (typeof SIZES)[number];

function makeCells(n: number, rng: Rng): Uint8Array {
  const cells = new Uint8Array(n);
  for (let i = 0; i < n; i++) cells[i] = rng.next() & 0xff;
  return cells;
}

/** 1 セル。値が同じなら memo で再レンダーを省く (差分比較そのものは毎フレーム全セルぶん走る) */
const Cell = memo(function Cell({ v }: { v: number }) {
  return <div className="aspect-square rounded-[1px] bg-zinc-900 dark:bg-zinc-100" style={{ opacity: (v / 255).toFixed(2) }} />;
});

export function Stress() {
  const [size, setSize] = useState<Size>(SIZES[1]);
  // 乱数器は描画に使わないミュータブルなオブジェクトなので、初期化時に 1 回だけ作って持ち続ける
  const [rng] = useState(() => new Rng(7));
  // 状態は 1 つの配列。毎フレームコピーして書き換え、新しい配列で setState する
  const [cells, setCells] = useState(() => makeCells(SIZES[1][0] * SIZES[1][1], rng));
  const [perFrame, setPerFrame] = useState(300);
  const [running, setRunning] = useState(true);
  const [fps, setFps] = useState(0);

  // rAF ループからは最新の値を ref 経由で読む (クロージャに古い state が閉じ込められるのを避ける)。
  // ref はイベントハンドラと rAF の中でだけ書き換える
  const cellsRef = useRef(cells);
  const perFrameRef = useRef(perFrame);
  useEffect(() => {
    perFrameRef.current = perFrame;
  }, [perFrame]);

  useEffect(() => {
    if (!running) return;
    let id = 0;
    let t0 = now();
    let frames = 0;
    const frame = () => {
      const next = cellsRef.current.slice();
      for (let i = 0, m = Math.min(perFrameRef.current, next.length); i < m; i++) {
        next[rng.below(next.length)] = rng.next() & 0xff;
      }
      cellsRef.current = next;
      setCells(next);

      const t = now();
      if (t - t0 >= 500) {
        setFps((frames * 1000) / (t - t0));
        t0 = t;
        frames = 0;
      } else {
        frames++;
      }
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [running, rng]);

  const total = size[0] * size[1];
  const changeSize = (s: Size) => {
    setSize(s);
    const next = makeCells(s[0] * s[1], rng);
    cellsRef.current = next;
    setCells(next);
    setPerFrame((k) => Math.min(k, s[0] * s[1]));
  };

  return (
    <>
      <PageHeader
        title="ストレステスト"
        lead="グリッドの状態は 1 つの配列です。毎フレーム、ランダムに選んだセルを書き換えた新しい配列で setState します。memo 化した Cell は値の変わったセルだけ再レンダーされますが、全セルの props 比較は毎フレーム行われます。"
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="FPS" value={fps.toFixed(0)} />
        <Stat label="セル数" value={fmtInt(total)} />
        <Stat label="更新 / フレーム" value={fmtInt(perFrame)} />
        <Stat label="更新 / 秒" value={fmtInt(Math.trunc(fps * perFrame))} />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={`${s[0]}x${s[1]}`}
              type="button"
              className={size === s ? BTN_PRIMARY : BTN}
              onClick={() => changeSize(s)}
            >
              {s[0]}×{s[1]}
            </button>
          ))}
        </div>
        <label className="grid flex-1 gap-1 text-sm">
          <span className="text-zinc-500">1 フレームで更新するセル数</span>
          <input
            type="range"
            min="1"
            max={total}
            className="accent-zinc-700 dark:accent-zinc-300"
            value={perFrame}
            onChange={(e) => setPerFrame(Number(e.target.value))}
          />
        </label>
        <button type="button" className={BTN} onClick={() => setRunning((r) => !r)}>
          {running ? "停止" : "開始"}
        </button>
      </div>

      <div
        className="mt-6 grid gap-px overflow-hidden rounded-xl border border-zinc-200 p-1 dark:border-zinc-800"
        style={{ gridTemplateColumns: `repeat(${size[0]}, minmax(0, 1fr))` }}
      >
        {Array.from(cells, (v, i) => (
          // セルは位置そのものが識別子なので添字 key が正しい
          <Cell key={i} v={v} />
        ))}
      </div>
    </>
  );
}
