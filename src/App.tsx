import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router";
import { Benchmark } from "./pages/Benchmark";
import { Home } from "./pages/Home";
import { Reactivity } from "./pages/Reactivity";
import { Search } from "./pages/Search";
import { Stress } from "./pages/Stress";
import { Todo } from "./pages/Todo";
import { storageSet } from "./util";

const LINKS = [
  ["/", "概要"],
  ["/reactivity", "リアクティビティ"],
  ["/benchmark", "ベンチマーク"],
  ["/stress", "ストレステスト"],
  ["/search", "即時検索"],
  ["/todo", "Todo"],
] as const;

export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reactivity" element={<Reactivity />} />
          <Route path="/benchmark" element={<Benchmark />} />
          <Route path="/stress" element={<Stress />} />
          <Route path="/search" element={<Search />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const NAV_LINK =
  "rounded-md px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 aria-[current=page]:bg-zinc-100 aria-[current=page]:font-medium aria-[current=page]:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:aria-[current=page]:bg-zinc-800 dark:aria-[current=page]:text-zinc-100";

// NavLink は現在のページで aria-current="page" を付ける (Leptos の <A> と同じ)
const navLinks = (onNavigate?: () => void) =>
  LINKS.map(([href, label]) => (
    <NavLink key={href} to={href} end className={NAV_LINK} onClick={onNavigate}>
      {label}
    </NavLink>
  ));

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-zinc-900 font-mono text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
            R
          </span>
          React Demo
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">{navLinks()}</nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
            aria-label="メニュー"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        // リンクをタップしたらメニューを閉じる
        <nav className="grid gap-1 border-t border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
          {navLinks(() => setMenuOpen(false))}
        </nav>
      )}
    </header>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    storageSet("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      aria-label="テーマ切り替え"
      title="テーマ切り替え"
      onClick={() => setDark((d) => !d)}
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-zinc-400">
        <p>React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4</p>
        {/* CSS だけで現在のブレークポイントを表示 (JS 不要) */}
        <p className="font-mono text-xs">
          {"breakpoint: "}
          <span className="sm:hidden">xs</span>
          <span className="hidden sm:inline md:hidden">sm</span>
          <span className="hidden md:inline lg:hidden">md</span>
          <span className="hidden lg:inline xl:hidden">lg</span>
          <span className="hidden xl:inline">xl</span>
        </p>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-mono text-5xl font-semibold">404</p>
      <p className="mt-3 text-zinc-500">ページが見つかりません。</p>
      <Link to="/" className="mt-6 inline-block underline underline-offset-4">
        概要へ戻る
      </Link>
    </div>
  );
}
