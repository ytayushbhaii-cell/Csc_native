---
name: Multi-theme system
description: How the 6-theme system is structured (ThemeContext, useColors, theme settings screen)
---

# Multi-theme system

**Why:** User requested 5+ themes with Light as default.

## Architecture
- Theme IDs: `light` (default), `dark`, `forest`, `sunset`, `ocean`, `purple`
- AsyncStorage key: `@csc_toolkit_theme` (stores theme ID string)
- All theme palettes defined in `hooks/useColors.ts` (THEMES record + ALL_THEMES metadata array)
- `ThemeContext.tsx` stores `themeId: string`, derives `isDark` via `getThemeMeta(themeId).isDark`
- `useColors()` hook returns `getThemeColors(themeId)` — full color palette
- `SettingsService.ThemeValue` is now `string` (was `'light' | 'dark'`)

## Backward compatibility
- `isDark` still exported from ThemeContext (derived from theme metadata)
- `toggleTheme()` still works — toggles between `light` and `dark` only
- All existing screens using `isDark` (for StatusBar) continue to work unchanged

## Circular import note
`ThemeContext` imports `getThemeMeta` from `hooks/useColors`; `useColors` imports `useTheme` from `ThemeContext`. Circular but safe — both are function references, not initialized values. Webpack resolves fine (confirmed working).

**How to apply:** When adding new themes, add to THEMES record and ALL_THEMES array in `hooks/useColors.ts` only. No other files need changes.
