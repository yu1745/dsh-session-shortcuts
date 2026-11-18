import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');

function mount({ selected = 'b', ids = ['a', 'a', 'b', 'archived', 'hidden', 'c'] } = {}) {
  let plugin;
  let listener;
  let active = selected;
  const opened = [];
  const disposed = [];
  const effects = [];
  const commands = [];
  const document = {
    querySelectorAll: () => ids.map(id => ({
      getClientRects: () => id === 'hidden' ? [] : [1],
      getAttribute: name => name === 'data-row-key' ? `session:${id}` : String(id === active),
    })),
  };
  runInNewContext(source, { window: { document, __ModuleLoader__: { load: ({ factory }) => { plugin = factory(); } } } });
  plugin.apply({
    effect: callback => effects.push(callback()),
    locale: { register: () => () => disposed.push('locale'), bind: () => key => key },
    shortcuts: {
      registerFixed: command => { commands.push(command); return () => disposed.push(command.id); },
      observeFixedInput: callback => { listener = callback; return () => { listener = undefined; disposed.push('observer'); }; },
    },
    workspaces: { list: { getSnapshot: () => ({ archivedSessionIds: ['archived'] }) } },
    uiWorkspace: { openSession: id => { opened.push(id); active = id; } },
  });
  function press(code, gesture = {}, context = {}) {
    let consumed = false;
    listener?.({
      type: 'keydown',
      gesture: { code, control: true, ...gesture },
      context: { modal: null, region: 'page', ...context },
      consume: () => { consumed = true; },
    });
    return consumed;
  }
  return { press, opened, disposed, commands, dispose: () => effects.reverse().forEach(cleanup => cleanup()) };
}

test('cycles both directions and wraps in displayed order', () => {
  const app = mount();
  assert.equal(app.press('Tab'), true);
  assert.equal(app.press('ArrowRight', { alt: true }), true);
  assert.equal(app.press('Tab', { shift: true }), true);
  assert.equal(app.press('ArrowLeft', { alt: true }), true);
  assert.deepEqual(app.opened, ['c', 'a', 'c', 'b']);
});

test('falls back to the nearest end if no session is selected', () => {
  const app = mount({ selected: 'missing' });
  assert.equal(app.press('Tab', { shift: true }), true);
  assert.deepEqual(app.opened, ['c']);
});

test('ignores unrelated chords, repeats, composition, and locally owned input', () => {
  const app = mount();
  for (const [code, gesture, context] of [
    ['Tab', { control: false }], ['Tab', { meta: true }], ['Tab', { alt: true }],
    ['Tab', { defaultPrevented: true }], ['Tab', { composing: true }], ['Tab', { repeat: true }],
    ['ArrowRight'], ['ArrowLeft', { alt: true, shift: true }], ['PageDown'],
    ['Tab', {}, { modal: 'settings' }], ['Tab', {}, { region: 'terminal' }],
  ]) assert.equal(app.press(code, gesture, context), false);
  assert.deepEqual(app.opened, []);
});

test('leaves the shortcut unconsumed when fewer than two candidates are visible', () => {
  const app = mount({ ids: ['a', 'a', 'hidden', 'archived'] });
  assert.equal(app.press('Tab'), false);
  assert.deepEqual(app.opened, []);
});

test('registers both actions and releases registrations when disposed', () => {
  const app = mount();
  assert.deepEqual(app.commands.map(command => command.id), ['yu-session-switch.next', 'yu-session-switch.previous']);
  app.dispose();
  assert.deepEqual(app.disposed, ['observer', 'yu-session-switch.previous', 'yu-session-switch.next', 'locale']);
  assert.equal(app.press('Tab'), false);
});
