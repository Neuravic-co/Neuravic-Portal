"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

export type Theme = "light" | "dark" | "system";

const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "Match system", light: "Light", dark: "Dark" };
const ICON = { system: Monitor, light: Sun, dark: Moon };

/**
 * The choice lives in a plain cookie that the server reads, so the right theme is in the first byte of HTML and the
 * page never flashes the wrong colours. It holds no personal data.
 */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const Icon = ICON[theme];

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `nv_theme=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  }

  return (
    <button className="icon-btn" type="button" onClick={cycle} title={`Theme: ${LABEL[theme]}`} aria-label={`Theme: ${LABEL[theme]}. Change theme`}>
      <Icon aria-hidden="true" />
    </button>
  );
}
