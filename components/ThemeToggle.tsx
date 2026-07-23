"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const THEME_KEY = "hiring-assessment-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial =
      saved ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  };

  return (
    <button
      className="themeToggle"
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "black"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "black"} mode`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "◐"}</span>
      <b>{theme === "dark" ? "Light" : "Black"}</b>
    </button>
  );
}
