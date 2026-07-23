---
name: Multi-theme system
description: How the 10-theme system is structured (ThemeContext, useColors, theme settings screen)
---

# Multi-theme system

**Why:** User requested 5+ themes with Light as default.

## Architecture
- Theme IDs: `light` (default), `dark`, `forest`, `sunset`, `ocean`, `purple`, `rose`, `slate`, `contrast`, `mint`
- AsyncStorage key: `@csc_toolkit_theme` (stores theme ID string)
- All theme palettes defined in `hooks/useColors.ts` (THEMES record + ALL_THEMES metadata array)
- `ThemeContext.tsx` stores `themeId: string`, explicitly defaults to Light rather than device mode, and derives `isDark` via `getThemeMeta(themeId).isDark`
- `useColors()` hook returns `getThemeColors(themeId)` — full color palette
- `SettingsService.ThemeValue` is now `string` (was `'light' | 'dark'`)

## Backward compatibility
- `isDark` still exported from ThemeContext (derived from theme metadata)
- `toggleTheme()` still works — toggles between `light` and `dark` only
- All existing screens using `isDark` (for StatusBar) continue to work unchanged

## Circular import note
`ThemeContext` imports `getThemeMeta` from `hooks/useColors`; `useColors` imports `useTheme` from `ThemeContext`. Circular but safe — both are function references, not initialized values. Webpack resolves fine (confirmed working).

**How to apply:** Add new themes to the THEMES record and ALL_THEMES array in `hooks/useColors.ts`. Theme cards apply and persist selections immediately; keep Light as the explicit fallback.
