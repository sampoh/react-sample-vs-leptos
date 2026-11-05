# React Demo (vs Leptos)

[Leptos デモアプリ](https://github.com/sampoh/leptos-sample) と同じものを React 19 (CSR) + TypeScript 7 + Tailwind CSS 4 で作った SPA です。ページ構成・見た目・機能を揃え、React らしい書き方 (useState / useMemo / memo / useCallback) で書き直しています。

Leptos 版: https://leptos-sample.takahara.workers.dev/

| ページ | 内容 |
| --- | --- |
| `/` 概要 | 読み込んだ JS / CSS のサイズと起動時間を Performance API で実測して表示 |
| `/reactivity` | useState / useMemo、双方向バインディング、rAF で動く SVG アニメーション。各カードにレンダー回数を表示 |
| `/benchmark` | js-framework-benchmark と同種の操作 (1,000〜10,000 行の作成・更新・入替・削除) の計測 |
| `/stress` | 最大 4,000 セルを毎フレーム更新しながら FPS を計測 |
| `/search` | 最大 100,000 件をキー入力ごとにフィルタ・ソート |
| `/todo` | localStorage に保存する Todo (編集・フィルタ・一括操作) |

## 使っているもの

| 種類 | パッケージ |
| --- | --- |
| 実行時 | `react` 19.3.1, `react-dom` 19.3.1, `react-router` 8.5.1 (宣言的ルーティングのみ使用) |
| 開発時 | `typescript` 7.0.2, `oxlint` 1.90.0, `vite` 8.3.5, `@vitejs/plugin-react` 6.2.1, `tailwindcss` / `@tailwindcss/vite` 4.3.4 |

バージョンはすべて `package.json` で完全固定しています。

## 開発・ビルド

```sh
npm ci
npm run dev        # http://localhost:5173 (開発用ビルドの React。計測には向かない)
npm run build      # tsc (型チェック) → vite build。dist/ に静的ファイルを出力
npm run preview    # ビルド結果を配信。計測するときはこちら
npm run lint       # oxlint
```

lint はエラー・警告ともゼロを保っています (CI では `--deny-warnings` で警告もエラー扱い)。`oxlint-disable` コメントも使っていません。

## Leptos 版との書き方の違い

| | Leptos | React (このリポジトリ) |
| --- | --- | --- |
| 状態 | `RwSignal` | `useState` |
| 派生値 | クロージャ / `Memo` (依存は自動追跡) | レンダー中に計算 / `useMemo` (依存配列を手で書く) |
| 更新の単位 | Signal を読んでいる DOM ノードだけ | コンポーネント関数を再実行し、仮想 DOM の差分を反映 |
| 行ごとの状態 (ベンチマーク・Todo) | 行ごとに Signal を持つ | イミュータブルな配列を差し替え、`memo` + `useCallback` で再レンダーを絞る |
| ストレステストのセル | セルごとに Signal | 1 つの `Uint8Array` を毎フレーム差し替え、`memo` 化した Cell |
| Effect でのログ書き込み (リアクティビティ) | `Effect` から Signal を更新 | Effect 内の setState は非推奨 (`react/set-state-in-effect`) なのでイベントハンドラで更新 |
| ソース行数 | `include_str!` + `const fn` でコンパイル時に計算 | `vite.config.ts` の `define` でビルド時に計算 |

## デプロイ (Cloudflare Workers)

`main` に push すると GitHub Actions (`.github/workflows/deploy.yml`) が lint → `npm run build` を実行し、`dist/` を Cloudflare Workers の Static Assets としてデプロイします。PR では lint とビルドの確認だけを行います。

- `wrangler.jsonc` … Worker 名 `react-sample-vs-leptos`、配信ディレクトリ `dist/`、SPA フォールバック
- `public/_headers` … 全レスポンスに `X-Robots-Tag` などを付与 (Vite が `dist/` にコピー)

初回のみ、GitHub リポジトリの Settings → Secrets and variables → Actions に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録してください (取得方法は Leptos 版の README と同じです)。

手元からデプロイする場合は `npm run deploy` です。

## 構成

```
index.html          Vite のエントリ (テーマのちらつき防止スクリプト、robots meta)
public/             robots.txt (全クローラー拒否)、_headers
vite.config.ts      React / Tailwind プラグイン、ソース行数の埋め込み
src/
  main.tsx          マウント
  App.tsx           ルーター、ヘッダー (モバイルメニュー)、テーマ切替、フッター
  boot.ts           起動時刻・初回描画の計測
  ui.tsx            共通 UI 部品とボタン等のクラス、レンダー回数カウンター
  util.ts           performance.now、localStorage、乱数 (Leptos 版と同じ xorshift32) などの小物
  index.css         Tailwind の入力 (ダークモードは html.dark で切り替え)
  pages/*.tsx       各ページ
```

## 配信時の注意

- パスベースのルーティングなので、静的ホスティングでは未知のパスを `index.html` に返す設定 (SPA フォールバック) が必要です
- クローラー対策は `robots.txt` と `<meta name="robots">` と `X-Robots-Tag` ヘッダーで行っています
