import type { PluginOption } from "vite";
import { allThemes, defaultTheme } from "../themes";
import { colorToRgbString } from "../src/utils/format/color";

function flattenColors(
  obj: Record<string, unknown>,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  for (const [key, val] of Object.entries(obj)) {
    const next = prefix ? `${prefix}-${key}` : key;
    if (typeof val === "string") {
      out[next] = val;
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      flattenColors(val as Record<string, unknown>, next, out);
    }
  }
  return out;
}

export function buildThemesCSS(): string {
  const defaultColors = flattenColors(
    defaultTheme.extend.colors as Record<string, unknown>,
  );
  const allKeys = new Set<string>(Object.keys(defaultColors));
  const themeBlocks: string[] = [];

  const defaultVars = Object.entries(defaultColors)
    .map(([key, value]) => `  --colors-${key}: ${colorToRgbString(value)};`)
    .join("\n");
  themeBlocks.push(`:root, .theme-default {\n${defaultVars}\n}`);

  for (const theme of allThemes) {
    const colors = flattenColors(
      (theme.extend?.colors ?? {}) as Record<string, unknown>,
    );
    for (const key of Object.keys(colors)) allKeys.add(key);

    const selectors = (theme.selectors ?? [`.theme-${theme.name}`]).join(", ");
    const vars = Object.entries(colors)
      .map(([key, value]) => `  --colors-${key}: ${colorToRgbString(value)};`)
      .join("\n");

    if (vars) themeBlocks.push(`${selectors} {\n${vars}\n}`);
  }

  const inlineTheme = Array.from(allKeys)
    .map((key) => `  --color-${key}: rgb(var(--colors-${key}));`)
    .join("\n");

  return `${themeBlocks.join("\n\n")}\n\n@theme inline {\n${inlineTheme}\n}\n`;
}

export function tailwindThemesPlugin(): PluginOption {
  const virtualId = "virtual:themes.css";
  const resolvedVirtualId = "\0" + virtualId;

  return {
    name: "tailwind-themes-v4",
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId;
    },
    load(id) {
      if (id === resolvedVirtualId) return buildThemesCSS();
    },
  };
}
