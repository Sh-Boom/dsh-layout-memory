# Sidebar memory

The Web GUI's layout state is transient: a reload restores the default left sidebar width, hides the right panel, and forgets dragged widths. This plugin keeps the sidebar layout the app otherwise resets.

## What it remembers

- Left sidebar width (264–420 px) and whether it was collapsed (`0`).
- Right sidebar width preference, re-applied when the panel is open with enough room.
- Whether the right panel was open or closed. On load, the plugin re-opens it for the on-screen session when that session has used the panel before; a session that never used it keeps its default. The panel's own per-session dock layout is preserved by the app itself.

State lives in `localStorage` under `dsh.layout-memory.v1`. On load the plugin re-applies the saved widths through the layout service, restores the right panel's open state once the session adopts its dock layout, and a 1-second poll saves later changes.

## How widths behave

- The remembered right width stays in force while the panel is open, until you drag the right divider yourself; that drag becomes the new remembered width.
- A value squeezed by the window's available space is never recorded. The middle column keeps at least 400 px and the left sidebar takes its width first, so a narrow window shows the right panel narrower than its remembered width without losing that width. Widen the window and the remembered width returns.
- Widths are only restored when the window is at least 1024 px wide, matching the layout's own auto-collapse rule.
- Layout state is per client profile (the desktop app's browser storage); the right panel's dock tabs are persisted per session by the app itself.
