import { type KeyboardEvent, memo, useCallback, useEffect, useRef, useState } from "react";
import { BTN_PRIMARY, INPUT, PageHeader } from "../ui";
import { storageGet, storageSet } from "../util";

const KEY = "react-demo-todos";

type Item = { readonly id: number; readonly text: string; readonly done: boolean };
type Filter = "all" | "active" | "done";

/** 保存形式は Leptos 版と同じ「1 行 = 1 件、先頭 1 文字が完了フラグ」 */
function load(): Item[] {
  const raw = storageGet(KEY) ?? "1React をインストールする\n0useState を理解する\n0アプリを公開する";
  return raw
    .split("\n")
    .filter((l) => l.length > 1)
    .map((l, i) => ({ id: i, text: l.slice(1), done: l.startsWith("1") }));
}

const TAB =
  "rounded-md px-3 py-1 text-sm text-zinc-500 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900 dark:aria-pressed:bg-zinc-800 dark:aria-pressed:text-zinc-100";
const TABS: [Filter, string][] = [
  ["all", "すべて"],
  ["active", "未完了"],
  ["done", "完了"],
];

export function Todo() {
  const [todos, setTodos] = useState(load);
  const nextId = useRef(todos.length);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // todos が変わるたびに保存 (配列ごと差し替えるので、どの項目の変更でもここに来る)
  useEffect(() => {
    storageSet(KEY, todos.map((it) => `${it.done ? 1 : 0}${it.text}`).join("\n"));
  }, [todos]);

  const add = () => {
    const text = draft.trim();
    if (text) {
      const id = nextId.current++;
      setTodos((t) => [...t, { id, text, done: false }]);
      setDraft("");
    }
  };
  // 行に渡すコールバックは useCallback で固定して、memo 化した Row の再レンダーを防ぐ
  const remove = useCallback((id: number) => setTodos((t) => t.filter((it) => it.id !== id)), []);
  const patch = useCallback(
    (id: number, p: Partial<Omit<Item, "id">>) =>
      setTodos((t) => t.map((it) => (it.id === id ? { ...it, ...p } : it))),
    [],
  );

  const remaining = todos.filter((it) => !it.done).length;
  const total = todos.length;
  const visible = todos.filter((it) => (filter === "all" ? true : filter === "active" ? !it.done : it.done));

  return (
    <>
      <PageHeader
        title="Todo"
        lead="ブラウザの localStorage に保存されます。ダブルクリックで編集、Enter で確定、Esc で取り消し。"
      />
      <div className="mx-auto max-w-2xl">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            className={INPUT}
            placeholder="やることを入力"
            aria-label="やること"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className={`${BTN_PRIMARY} shrink-0 px-4`}>
            追加
          </button>
        </form>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <div className="flex gap-1">
              {TABS.map(([f, label]) => (
                <button key={f} type="button" className={TAB} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {label}
                </button>
              ))}
            </div>
            <span className="text-sm text-zinc-500">
              残り <span className="font-mono tabular-nums">{remaining}</span> / {total} 件
            </span>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {visible.map((it) => (
              <Row key={it.id} it={it} patch={patch} remove={remove} />
            ))}
          </ul>
          {visible.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-zinc-500">表示する項目はありません</p>
          )}
          <div className="flex justify-between gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => {
                const allDone = remaining === 0;
                setTodos((t) => t.map((it) => ({ ...it, done: !allDone })));
              }}
            >
              すべて切り替え
            </button>
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-zinc-900 disabled:opacity-40 dark:hover:text-zinc-100"
              disabled={remaining === total}
              onClick={() => setTodos((t) => t.filter((it) => !it.done))}
            >
              完了済みを削除
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const Row = memo(function Row({
  it,
  patch,
  remove,
}: {
  it: Item;
  patch: (id: number, p: Partial<Omit<Item, "id">>) => void;
  remove: (id: number) => void;
}) {
  const [editing, setEditingState] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Esc で閉じた直後に入力欄が外れて blur が来ても確定しないよう、同期的に読めるフラグも持つ
  const editingNow = useRef(false);
  const setEditing = (v: boolean) => {
    editingNow.current = v;
    setEditingState(v);
  };

  const commit = () => {
    if (!editingNow.current) return;
    const v = input.current?.value.trim() ?? "";
    setEditing(false);
    if (v) patch(it.id, { text: v });
    else remove(it.id);
  };

  // 編集開始時に入力欄へフォーカス
  useEffect(() => {
    if (editing && input.current) {
      input.current.focus();
      input.current.select();
    }
  }, [editing]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    else if (e.key === "Escape") setEditing(false);
  };

  return (
    <li className="group flex items-center gap-3 px-4 py-2.5">
      <input
        type="checkbox"
        aria-label="完了"
        className="size-4 accent-zinc-800 dark:accent-zinc-200"
        checked={it.done}
        onChange={(e) => patch(it.id, { done: e.target.checked })}
      />
      {editing ? (
        <input
          ref={input}
          aria-label="編集"
          className={`${INPUT} flex-1 py-1`}
          defaultValue={it.text}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <span
          className={`flex-1 cursor-text select-none ${it.done ? "text-zinc-400 line-through" : ""}`}
          onDoubleClick={() => setEditing(true)}
        >
          {it.text}
        </span>
      )}
      <button
        type="button"
        className="text-zinc-400 opacity-100 transition hover:text-zinc-900 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:text-zinc-100"
        aria-label="削除"
        onClick={() => remove(it.id)}
      >
        ×
      </button>
    </li>
  );
});
