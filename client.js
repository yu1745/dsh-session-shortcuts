window.__ModuleLoader__.load({
  id: '@yu1745/dsh-session-shortcuts',
  factory() {
    const namespace = 'shortcuts.yu-session-switch';
    const rowPrefix = 'session:';
    const rowsSelector = '[data-sidebar-list-area] [role="treeitem"][data-row-key^="session:"]';
    return {
      inject: ['shortcuts', 'locale', 'uiWorkspace', 'workspaces'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(namespace, {
          en: { next: 'Next visible session', previous: 'Previous visible session' },
          zh: { next: '下一个可见会话', previous: '上一个可见会话' },
        }));
        const t = ctx.locale.bind(namespace);
        for (const [key, arrow, shift] of [
          ['next', 'ArrowRight', false],
          ['previous', 'ArrowLeft', true],
        ]) {
          ctx.effect(() => ctx.shortcuts.registerFixed({
            id: `yu-session-switch.${key}`,
            label: () => t(key),
            keys: [shift ? 'Ctrl+Shift+Tab' : 'Ctrl+Tab', `Ctrl+Alt+${arrow === 'ArrowRight' ? '→' : '←'}`],
            bindings: [
              { code: 'Tab', modifiers: shift ? ['control', 'shift'] : ['control'] },
              { code: arrow, modifiers: ['control', 'alt'] },
            ],
            group: 'application',
          }));
        }
        ctx.effect(() => ctx.shortcuts.observeFixedInput(input => {
          if (input.type !== 'keydown' || input.context.modal !== null || input.context.region === 'terminal') return;
          const { code, control, alt, shift, meta, composing, repeat, defaultPrevented } = input.gesture;
          if (!control || meta || composing || repeat || defaultPrevented) return;
          const direction = code === 'Tab' && !alt ? (shift ? -1 : 1)
            : alt && !shift && code === 'ArrowLeft' ? -1
              : alt && !shift && code === 'ArrowRight' ? 1 : 0;
          if (!direction) return;

          const archived = new Set(ctx.workspaces.list.getSnapshot().archivedSessionIds);
          const visibleIds = new Set();
          let activeId;
          for (const row of window.document.querySelectorAll(rowsSelector)) {
            if (row.getClientRects().length === 0) continue;
            const id = row.getAttribute('data-row-key').slice(rowPrefix.length);
            if (!id || archived.has(id)) continue;
            visibleIds.add(id);
            if (row.getAttribute('aria-selected') === 'true') activeId = id;
          }
          const ids = [...visibleIds];
          if (ids.length < 2) return;
          const current = ids.indexOf(activeId);
          const next = current < 0 ? (direction > 0 ? 0 : ids.length - 1)
            : (current + direction + ids.length) % ids.length;
          ctx.uiWorkspace.openSession(ids[next]);
          input.consume();
        }));
      },
    };
  },
});
