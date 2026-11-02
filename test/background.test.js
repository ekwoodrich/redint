const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('context menu opens Rosint only for valid profile links', () => {
  const handlers = {};
  const menus = [];
  const tabs = [];
  const updates = [];
  const context = vm.createContext({
    URL,
    encodeURIComponent,
    chrome: {
      runtime: {
        onInstalled: { addListener: (handler) => { handlers.installed = handler; } },
        onMessage: { addListener: (handler) => { handlers.message = handler; } }
      },
      contextMenus: {
        create: (menu) => menus.push(menu),
        update: (id, properties) => { updates.push({ id, ...properties }); return Promise.resolve(); },
        onClicked: { addListener: (handler) => { handlers.clicked = handler; } }
      },
      tabs: {
        create: (tab) => tabs.push(tab),
        onActivated: { addListener: (handler) => { handlers.activated = handler; } },
        onUpdated: { addListener: (handler) => { handlers.updated = handler; } }
      }
    }
  });
  context.importScripts = (filename) => {
    vm.runInContext(readFileSync(path.join(__dirname, '../extension', filename), 'utf8'), context);
  };
  vm.runInContext(readFileSync(path.join(__dirname, '../extension/background.js'), 'utf8'), context);

  handlers.installed();
  assert.equal(menus.length, 1);
  assert.equal(menus[0].contexts[0], 'link');
  handlers.message({ type: 'redint-link-target', url: 'https://www.reddit.com/u/Bethplaysbanjo/' });
  assert.equal(updates.at(-1).title, 'u/Bethplaysbanjo on Rosint');
  handlers.activated();
  assert.equal(updates.at(-1).title, 'Search Reddit profile on Rosint');
  handlers.message({ type: 'redint-link-target', url: 'https://www.reddit.com/u/OtherUser/' });
  handlers.updated(1, { status: 'loading' });
  assert.equal(updates.at(-1).title, 'Search Reddit profile on Rosint');
  handlers.clicked({ menuItemId: 'redint-search-profile', linkUrl: 'https://www.reddit.com/user/Bethplaysbanjo/' });
  assert.equal(tabs[0].url, 'https://rosint.dev/?u=Bethplaysbanjo');
  handlers.clicked({ menuItemId: 'redint-search-profile', linkUrl: 'https://reddit.com/r/test' });
  handlers.clicked({ menuItemId: 'other', linkUrl: 'https://reddit.com/u/OtherUser' });
  assert.equal(tabs.length, 1);
});
