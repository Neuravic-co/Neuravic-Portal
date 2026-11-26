"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HOME, MODULES } from "@/lib/nav";

const ITEMS = [HOME, ...MODULES];

/** Press Ctrl+K (or ⌘K) anywhere to jump to a page. Built on <dialog>, so focus and Escape are handled by the browser. */
export function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? ITEMS.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle)) : ITEMS;
  }, [query]);

  function open() {
    setQuery("");
    setActive(0);
    if (!dialog.current?.open) dialog.current?.showModal();
    input.current?.focus();
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    dialog.current?.close();
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  }

  return (
    <>
      <button className="search-btn" type="button" onClick={open} aria-label="Search the portal (Ctrl K)">
        <Search aria-hidden="true" />
        <span>Jump to…</span>
        <kbd>Ctrl K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="palette"
        aria-label="Jump to a page"
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      >
        <div className="palette__search">
          <Search aria-hidden="true" />
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-label="Search pages"
            placeholder="Search pages…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <ul className="palette__list" id={listId} role="listbox" aria-label="Pages">
          {results.length === 0 ? <li className="palette__empty">Nothing matches “{query}”.</li> : null}
          {results.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.href}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className="palette__item"
                onMouseMove={() => setActive(index)}
                onClick={() => go(item.href)}
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                {index === active ? <CornerDownLeft aria-hidden="true" /> : null}
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
