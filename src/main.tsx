import "./index.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { markAppStart } from "./boot";

markAppStart();

// StrictMode は付けない: 開発時にレンダーと Effect が 2 回ずつ走り、
// レンダー回数の表示が本番と食い違って比較しにくくなるため
createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
