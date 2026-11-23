import fs from "node:fs";
import path from "node:path";
import type { PluginOption } from "vite";
import { allThemes, defaultTheme } from "../themes";

function flattenColors(
  obj: Record<string, unknown>,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  for (const [key, val] of Object.entries(obj)) {
    const next = prefix ? `${prefix}-${key}` : key;
    if (typeof val === "string") {
      out[next] = val;
    } else if (val && typeof val === "object") {
      flattenColors(val as Record<string, unknown>, next, out);
    }
  }
  return out;
}

function formatVars(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([k, v]) => `  --color-${k}: ${v};`)
    .join("\n");
}

function buildThemesCSS(): string {
  const defaultColors = flattenColors(defaultTheme.extend.colors);
  const allKeys = new Set<string>(Object.keys(defaultColors));
  const themeBlocks: string[] = [
    `:root, .theme-default {\n${formatVars(defaultColors)}\n}`,
  ];

  for (const theme of allThemes) {
    const colors = flattenColors(theme.extend?.colors ?? {});
    for (const k of Object.keys(colors)) allKeys.add(k);
    const vars = formatVars(colors);
    if (vars) {
      themeBlocks.push(`${theme.selectors.join(", ")} {\n${vars}\n}`);
    }
  }

  const inlineTheme = Array.from(allKeys)
    .map((k) => `  --color-${k}: var(--color-${k});`)
    .join("\n");

  return `/* Auto-generated from themes/ — do not edit manually */\n${themeBlocks.join("\n\n")}\n\n@theme inline {\n${inlineTheme}\n}\n`;
}

export function tailwindThemesPlugin(): PluginOption {
  const outPath = path.resolve(
    import.meta.dirname,
    "../src/assets/css/themes.css",
  );

  const writeThemesIfChanged = () => {
    const next = buildThemesCSS();
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
    if (prev !== next) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, next, "utf8");
    }
  };

  writeThemesIfChanged();

  return {
    name: "tailwind-themes-v4",
    buildStart() {
      writeThemesIfChanged();
    },
  };
}
