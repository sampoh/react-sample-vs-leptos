import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";
import { getAppStart, getFirstFrame, subscribeFirstFrame } from "../boot";
import { BTN, BTN_PRIMARY, Card, Stat } from "../ui";
import { fmtBytes, fmtInt } from "../util";

/** このアプリ自身のソース行数 (vite.config.ts でビルド時に計算。ソース本文はバンドルに含まれない) */
const SRC_LINES = import.meta.env.SRC_LINES;

const LEPTOS_URL = "https://leptos-sample.takahara.workers.dev/";

const DEMOS = [
  [
    "/reactivity",
    "リアクティビティ",
    "useState と useMemo による更新。state が変わるとコンポーネントが再レンダーされ、仮想 DOM の差分だけが DOM に反映されます。",
  ],
  ["/benchmark", "ベンチマーク", "1,000〜10,000 行のテーブルを作成・更新・入れ替え。DOM 更新完了までの時間を実測します。"],
  ["/stress", "ストレステスト", "最大 4,000 セルを毎フレーム書き換えながら FPS を計測します。"],
  ["/search", "即時検索", "最大 100,000 件をキー入力ごとにフィルタ。計算時間もその場で表示します。"],
  ["/todo", "Todo", "localStorage に保存される定番の Todo アプリ。編集・フィルタ・一括操作つき。"],
] as const;

const DIFF = [
  [
    "仮想 DOM と再レンダー",
    "state が変わるとコンポーネント関数が丸ごと再実行され、新旧の仮想 DOM を比較して差分だけを DOM に反映します。Leptos はコンポーネントを 1 回だけ実行し、Signal に依存するノードを直接更新します。",
  ],
  [
    "最適化は開発者の仕事",
    "再レンダーの範囲は memo / useMemo / useCallback で絞り込みます。Leptos では細粒度の更新が既定なので、この作業が要りません。",
  ],
  [
    "JS だけで動く",
    "読み込むのは JS と CSS のみ。WASM のダウンロードとコンパイルを待たずに起動でき、ブラウザの開発者ツールでそのままデバッグできます。",
  ],
] as const;

type Asset = { file: string; enc: number; dec: number };

/** 読み込まれたリソース (js / css) のファイル名と転送サイズ・展開後サイズ */
function loadedAssets(): Asset[] {
  const out: Asset[] = [];
  for (const e of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
    const file = (e.name.split("/").pop() ?? "").split("?")[0] ?? "";
    const isAsset = [".wasm", ".js", ".css"].some((ext) => file.endsWith(ext));
    if (isAsset && !out.some((a) => a.file === file)) {
      out.push({ file, enc: e.encodedBodySize, dec: e.decodedBodySize });
    }
  }
  return out.toSorted((a, b) => b.dec - a.dec);
}

function assetKind(file: string): string {
  if (file.endsWith(".wasm")) return "WebAssembly";
  if (file.endsWith(".js")) return "JS (React + アプリ)";
  return "CSS (Tailwind)";
}

export function Home() {
  const [assets, setAssets] = useState(loadedAssets);
  // 起動直後は自身のエントリがまだ記録されていないことがあるので、少し後に取り直す
  useEffect(() => {
    const t = setTimeout(() => setAssets(loadedAssets()), 300);
    return () => clearTimeout(t);
  }, []);
  const firstFrame = useSyncExternalStore(subscribeFirstFrame, getFirstFrame);
  const total = (f: (a: Asset) => number) => fmtBytes(assets.reduce((s, a) => s + f(a), 0));

  return (
    <>
      <section className="py-6 sm:py-12">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
          React 19 · CSR · TypeScript 7 · Tailwind CSS 4
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          React デモアプリ
        </h1>
        <p className="mt-5 max-w-2xl text-zinc-600 sm:text-lg dark:text-zinc-400">
          このサイトは、
          <a href={LEPTOS_URL} target="_blank" rel="noopener" className="underline underline-offset-4">
            Leptos デモアプリ
          </a>
          と同じものを React で作った比較用の SPA です。ページ構成・見た目・機能はそのままに、仮想 DOM
          と再レンダーという React の流儀で書き直しています。6 ページ、ルーティング、ダークモード、レスポンシブ対応まで含めて、ソースは全部で{" "}
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtInt(SRC_LINES)} 行</strong>
          です。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/benchmark" className={`${BTN_PRIMARY} px-4 py-2`}>
            ベンチマークを試す →
          </Link>
          <a href={LEPTOS_URL} target="_blank" rel="noopener" className={`${BTN} px-4 py-2`}>
            Leptos 版と比べる
          </a>
          <a href="https://react.dev" target="_blank" rel="noopener" className={`${BTN} px-4 py-2`}>
            React 公式サイト
          </a>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card title="このページ自身の計測値" note="Performance API で、いま読み込まれたファイルを実測しています。">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2 font-medium">種類</th>
                    <th className="py-2 text-right font-medium">転送 (圧縮後)</th>
                    <th className="py-2 text-right font-medium">展開後</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {assets.map(({ file, enc, dec }) => (
                    <tr key={file} className="border-b border-zinc-100 dark:border-zinc-800/60">
                      <td className="py-2 pr-4 font-sans" title={file}>
                        {assetKind(file)}
                      </td>
                      {/* キャッシュから読み込まれた (304 など) ファイルはサイズ 0 で記録される */}
                      <td className="py-2 text-right whitespace-nowrap">{dec > 0 ? fmtBytes(enc) : "キャッシュ"}</td>
                      <td className="py-2 text-right whitespace-nowrap">{dec > 0 ? fmtBytes(dec) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2">合計</td>
                    <td className="py-2 text-right">{total((a) => a.enc)}</td>
                    <td className="py-2 text-right">{total((a) => a.dec)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              キャッシュから読み込んだファイルはサイズが記録されません。Ctrl + Shift + R で再読み込みすると計測できます。
              <br />
              {import.meta.env.DEV
                ? "※ いまは開発サーバーです。npm run build && npm run preview で本番ビルドを計測できます。"
                : "※ 本番ビルド (Vite / Rolldown で minify)。転送サイズは配信サーバーの圧縮設定で変わります。"}
            </p>
          </Card>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
          <Stat label="JS 実行開始 (ページ遷移開始から)" value={`${getAppStart().toFixed(0)} ms`} />
          <Stat label="初回描画" value={firstFrame === null ? "…" : `${firstFrame.toFixed(0)} ms`} />
          <Stat label="ソース行数 (TypeScript + CSS)" value={`${fmtInt(SRC_LINES)} 行`} />
          <Stat label="実行時の依存パッケージ" value="react を含め 3 個" />
        </div>
      </div>

      <h2 className="mt-16 text-xl font-semibold tracking-tight">デモ</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMOS.map(([href, title, desc]) => (
          <Link
            key={href}
            to={href}
            className="group rounded-xl border border-zinc-200 p-5 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
          >
            <h3 className="flex items-center justify-between font-medium">
              {title}
              <span className="text-zinc-400 transition group-hover:translate-x-0.5">→</span>
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-16 text-xl font-semibold tracking-tight">Leptos との違い</h2>
      <dl className="mt-4 grid gap-6 sm:grid-cols-3">
        {DIFF.map(([t, d]) => (
          <div key={t}>
            <dt className="font-medium">{t}</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{d}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
