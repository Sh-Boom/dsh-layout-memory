# dsh-layout-memory

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) client plugin that remembers your sidebar layout across reloads — the Web GUI forgets it by default.

默认情况下，DSH Web 界面的侧边栏布局是临时状态：刷新/重启后左栏回到默认宽度、右栏收起、拖过的宽度丢失。这个插件把布局记下来。

## What it remembers / 记住什么

- Left sidebar width (264–420 px) and whether it was collapsed. 左栏宽度与折叠状态。
- Right panel width, re-applied whenever the panel is open with enough room. 右栏宽度。
- Whether the right panel was open or closed. 右栏的打开/关闭状态。

State is stored per client in `localStorage` under `dsh.layout-memory.v1`. A one-second poll records changes; nothing is written when nothing changed.

## Behaviour notes / 行为说明

- The remembered right width stays in force while the panel is open, until you drag the right divider yourself — that drag becomes the new remembered width.
- Space-squeezed values are never recorded. The layout always reserves at least 400 px for the centre column and the left sidebar takes its width first, so in a narrow window the right panel can render narrower than its remembered width. The remembered width is not lost; it comes back when there is room.
- The right panel's dock contents (tabs, split ratios, floating panes) are already persisted per session by DSH itself; this plugin only adds the column width and open/closed state.
- Widths are restored only when the window is at least 1024 px wide, matching DSH's own auto-collapse rule.
- The right panel open state is restored once per page load, for the session on screen at startup, and only if that session has used the panel before.

## Install / 安装

Requires a DeepSeek Harness installation with a profile (Desktop or `dsh web`), running DSH 0.2.x. Tested with the Windows Desktop app.

### Through the agent (recommended)

Ask your DSH agent:

> Install the DSH plugin from `https://github.com/Sh-Boom/dsh-layout-memory`

The agent runs `plugin_manager` `install_bundle` with that URL as the target. Restart DSH when the result asks for it.

### Manually into a profile

1. Copy this repository folder to `<profile-dir>/local-plugins/dsh-layout-memory`.
2. Link it into the profile's `node_modules` (`<profile-dir>/node_modules/dsh-layout-memory` → the folder above).
3. Add to `<profile-dir>/package.json`:
   - `"dependencies": { "dsh-layout-memory": "file:./local-plugins/dsh-layout-memory" }`
   - `"dsh": { "profile": { "bundles": [ ..., "dsh-layout-memory" ] } }`
4. Restart DSH (or let HMR pick up the profile change).

## Uninstall / 卸载

Remove the bundle name from `dsh.profile.bundles`, remove the dependency, delete the copied package and the `node_modules` link, then restart DSH. The saved layout key `dsh.layout-memory.v1` can be cleared from the browser storage if desired.

## How it works / 实现

| File | Role |
|---|---|
| `index.js` | Empty Host half; the Client module owns everything. |
| `client.js` | Client plugin: reads/writes the layout through `ctx.layout`, restores the right panel through `ctx.sidebarRight`, and polls the frame's grid columns. |
| `cordis.patch.yml` | Bundle patch inserting the `layout-memory` plugin row. |
| `locale/*.json` | Plugin title/description shown in the Plugins page. |
| `docs/DETAIL.md` | Longer detail document. |
| `icon.svg` | Plugin icon. |

The plugin reads the frame's `grid-template-columns` for widths, calls `layout.panels.setSidebar()` / `setRightbar()` to restore them, and uses `sidebarRight.isExpanded()` / `toggleExpanded()` for the panel state. All restoration goes through DSH's own layout actions rather than DOM overrides.

## Compatibility / 兼容性

- Built and verified against `@deepseek-ai/dsh-client-ui-layout` and `@deepseek-ai/dsh-client-ui-sidebar-right` from DSH `0.2.2-rc.3` and `0.2.2-rc.5`. Other versions may move the internal actions used for width restore; the open/closed and width saving keep working as long as the frame attributes are unchanged.
- Client-side only: no Host code, no dependencies, no network access.

## License

MIT
