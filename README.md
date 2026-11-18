# Session shortcuts · 会话切换快捷键

Cycle through visible sessions in the DSH Web Workspace sidebar. DSH Web 0.2.2-rc.3 presents a single active conversation, so the sidebar's displayed session order defines the cycle. Archived sessions and sessions hidden by filtering, collapsed groups, or a closed sidebar are skipped. The cycle wraps at both ends.

| Direction | Tab shortcut | Web fallback |
| --- | --- | --- |
| Next | `Ctrl+Tab` | `Ctrl+Alt+→` |
| Previous | `Ctrl+Shift+Tab` | `Ctrl+Alt+←` |

Browsers often reserve `Ctrl+Tab`, `Ctrl+Shift+Tab`, and `Ctrl+PageDown`/`Ctrl+PageUp` for browser tabs. The Tab bindings work when the browser delivers those keys to the page. The plugin uses the arrow bindings as the fallback and does not bind PageDown or PageUp. An operating system or browser extension can also intercept the fallback. The shortcuts pause during text composition, inside terminals, and while a modal is active.

## Local installation and testing

In DSH Web, open **Plugins → Add plugin** and select the absolute path to this directory. Open the Workspace sidebar with at least two nonarchived session rows visible. Test both directions and wrapping with the arrow shortcuts. The package is ready to install without a separate build step. Run `npm test` for the automated checks.

## 中文说明

在 DSH Web 的工作区侧栏中，按 `Ctrl+Alt+→` 切换到下一个可见会话，按 `Ctrl+Alt+←` 切换到上一个，首尾循环。浏览器若把按键交给页面，`Ctrl+Tab` 和 `Ctrl+Shift+Tab` 也可使用。请打开工作区侧栏，并确保至少两个未归档会话可见。已归档、被筛选隐藏或在折叠分组内的会话会被跳过。
