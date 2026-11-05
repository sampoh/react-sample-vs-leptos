import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { BTN, Card, INPUT, PageHeader, RenderBadge, useRenderCount } from "../ui";
import { now } from "../util";

export function Reactivity() {
  return (
    <>
      <PageHeader
        title="リアクティビティ"
        lead="state が変わると、そのコンポーネント関数が丸ごと再実行 (再レンダー) され、仮想 DOM の差分が DOM に反映されます。各カード右上の数字がレンダー回数です。"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Counter />
        <Temperature />
        <div className="lg:col-span-2">
          <Wave />
        </div>
      </div>
    </>
  );
}

const num = (e: ChangeEvent<HTMLInputElement>) => {
  const v = Number.parseFloat(e.target.value);
  return Number.isNaN(v) ? null : v;
};

const logLine = (count: number) => `${now().toFixed(1).padStart(8)} ms  count = ${count}`;

function fizzBuzz(n: number): string {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}

function Counter() {
  const renders = useRenderCount<HTMLSpanElement>();
  const [count, setCount] = useState(0);
  // 派生値: 毎回のレンダーで計算される / キャッシュしたいときは useMemo (依存配列は手で書く)
  const double = count * 2;
  const parity = useMemo(() => (count % 2 === 0 ? "偶数" : "奇数"), [count]);
  const fizz = useMemo(() => fizzBuzz(count), [count]);

  // ログ。Leptos 版は Effect で count を追跡して書くが、React で Effect の中から setState すると
  // レンダーが連鎖するため非推奨。値を変えるイベントハンドラの中で一緒に追記する
  const [log, setLog] = useState(() => [logLine(0)]);
  const change = (next: number) => {
    setCount(next);
    setLog((l) => [logLine(next), ...l].slice(0, 5));
  };

  return (
    <Card
      title="カウンター と 派生値"
      note="ボタンを押すたびにこのコンポーネント全体が再レンダーされ、仮想 DOM の差分 (数値・2 倍・偶奇・FizzBuzz・ログ) だけが DOM に反映されます。"
      badge={<RenderBadge ref={renders} />}
    >
      <div className="flex items-center gap-3">
        <button type="button" className={BTN} onClick={() => change(count - 1)}>
          −1
        </button>
        <output className="min-w-16 text-center font-mono text-3xl tabular-nums">{count}</output>
        <button type="button" className={BTN} onClick={() => change(count + 1)}>
          +1
        </button>
        <button type="button" className={BTN} onClick={() => change(count + 100)}>
          +100
        </button>
        <button type="button" className={`${BTN} ml-auto`} onClick={() => change(0)}>
          リセット
        </button>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">× 2</dt>
          <dd className="font-mono text-lg tabular-nums">{double}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">偶奇</dt>
          <dd className="text-lg">{parity}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">FizzBuzz</dt>
          <dd className="font-mono text-lg">{fizz}</dd>
        </div>
      </dl>
      <pre className="mt-5 h-28 overflow-hidden rounded-md bg-zinc-100 p-3 font-mono text-xs leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        {log.join("\n")}
      </pre>
    </Card>
  );
}

function feelsLike(c: number): string {
  if (c < 0) return "氷点下";
  if (c < 15) return "寒い";
  if (c < 25) return "快適";
  if (c < 35) return "暑い";
  return "猛暑";
}

function Temperature() {
  const renders = useRenderCount<HTMLSpanElement>();
  const [celsius, setCelsius] = useState(25);
  const fahrenheit = (celsius * 9) / 5 + 32;

  return (
    <Card
      title="双方向バインディング"
      note="どちらに入力しても、もう一方とスライダーが即座に追従します。状態は 1 つの useState だけです。"
      badge={<RenderBadge ref={renders} />}
    >
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="text-zinc-500">摂氏 (°C)</span>
          <input
            type="number"
            step="0.1"
            className={`${INPUT} mt-1 font-mono`}
            value={celsius.toFixed(1)}
            onChange={(e) => {
              const v = num(e);
              if (v !== null) setCelsius(v);
            }}
          />
        </label>
        <label className="text-sm">
          <span className="text-zinc-500">華氏 (°F)</span>
          <input
            type="number"
            step="0.1"
            className={`${INPUT} mt-1 font-mono`}
            value={fahrenheit.toFixed(1)}
            onChange={(e) => {
              const v = num(e);
              if (v !== null) setCelsius(((v - 32) * 5) / 9);
            }}
          />
        </label>
      </div>
      <input
        type="range"
        min="-30"
        max="50"
        step="0.1"
        aria-label="摂氏"
        className="mt-6 w-full accent-zinc-700 dark:accent-zinc-300"
        value={celsius}
        onChange={(e) => {
          const v = num(e);
          if (v !== null) setCelsius(v);
        }}
      />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-500">体感</span>
        <span className="rounded-full border border-zinc-300 px-3 py-0.5 dark:border-zinc-700">
          {feelsLike(celsius)}
        </span>
      </div>
      {/* 温度に合わせて伸び縮みするバー */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-800 transition-[width] duration-150 dark:bg-zinc-300"
          style={{ width: `${Math.min(Math.max(((celsius + 30) / 80) * 100, 0), 100)}%` }}
        />
      </div>
    </Card>
  );
}

function wavePath(a: number, f: number, n: number, p: number): string {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 1000;
    const t = (i / n) * Math.PI * 2 * f + p;
    const y = 100 - (Math.sin(t) * 0.7 + Math.sin(t * 2.3 + p) * 0.3) * a * 90;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  digits = 2,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  digits?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="flex justify-between text-zinc-500">
        {label}
        <span className="font-mono tabular-nums">{value.toFixed(digits)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className="accent-zinc-700 dark:accent-zinc-300"
        value={value}
        onChange={(e) => {
          const v = num(e);
          if (v !== null) onChange(v);
        }}
      />
    </label>
  );
}

function Wave() {
  const renders = useRenderCount<HTMLSpanElement>();
  const [amp, setAmp] = useState(0.7);
  const [freq, setFreq] = useState(3);
  const [points, setPoints] = useState(400);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);

  // requestAnimationFrame ループ。止めるときとページを離れるときは cleanup でキャンセルする
  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      setPhase((p) => p + 0.04);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  // SVG の path 文字列は useMemo。依存配列のどれかが変わったときだけ再計算
  const path = useMemo(() => wavePath(amp, freq, points, phase), [amp, freq, points, phase]);

  return (
    <Card
      title="SVG アニメーション"
      note="毎フレーム最大 4,000 点のパスを JS で計算します。phase の state を毎フレーム更新するので、このカード全体 (スライダーも含む) が毎フレーム再レンダーされます。"
      badge={<RenderBadge ref={renders} />}
    >
      <svg viewBox="0 0 1000 200" className="h-40 w-full sm:h-56" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="100" x2="1000" y2="100" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" />
        <path
          d={path}
          fill="none"
          className="stroke-zinc-800 dark:stroke-zinc-200"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-4 grid gap-4 sm:grid-cols-4 sm:items-end">
        <Slider label="振幅" value={amp} min={0} max={1} step={0.01} onChange={setAmp} />
        <Slider label="周波数" value={freq} min={0.5} max={12} step={0.1} onChange={setFreq} />
        <Slider label="点の数" value={points} min={10} max={4000} step={10} digits={0} onChange={setPoints} />
        <button type="button" className={BTN} onClick={() => setPlaying((p) => !p)}>
          {playing ? "一時停止" : "再生"}
        </button>
      </div>
    </Card>
  );
}
