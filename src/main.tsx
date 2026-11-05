import "./index.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { markAppStart } from "./boot";

markAppStart();

// StrictMode は付けない: 開発時にレンダーと Effect が 2 回ずつ走り、
// レンダー回数の表示が本番と食い違って比較しにくくなるため
createRoot(document.getElementById("root") as HTMLElement).render(
  // useTransitions={false}: ページ遷移を startTransition (低優先度) で包まない。
  // 包むと、ストレステストのように毎フレーム setState するページでは、遷移が毎フレームの更新に
  // 後回しにされ続け、URL だけ変わって画面が切り替わらなくなる (遷移は即座に反映したい操作なので同期で処理する)
  <BrowserRouter useTransitions={false}>
    <App />
  </BrowserRouter>,
);
