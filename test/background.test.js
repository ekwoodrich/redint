const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('context menu opens Rosint only for valid profile links', () => {
  const handlers = {};
  const menus = [];
  const tabs = [];
  const context = vm.createContext({
    URL,
    encodeURIComponent,
    chrome: {
      runtime: { onInstalled: { addListener: (handler) => { handlers.installed = handler; } } },
      contextMenus: {
        create: (menu) => menus.push(menu),
        onClicked: { addListener: (handler) => { handlers.clicked = handler; } }
      },
      tabs: { create: (tab) => tabs.push(tab) }
    }
  });
  context.importScripts = (filename) => {
    vm.runInContext(readFileSync(path.join(__dirname, '../extension', filename), 'utf8'), context);
  };
  vm.runInContext(readFileSync(path.join(__dirname, '../extension/background.js'), 'utf8'), context);

  handlers.installed();
  assert.equal(menus.length, 1);
  assert.equal(menus[0].contexts[0], 'link');
  handlers.clicked({ menuItemId: 'redint-search-profile', linkUrl: 'https://www.reddit.com/user/Bethplaysbanjo/' });
  assert.equal(tabs[0].url, 'https://rosint.dev/?u=Bethplaysbanjo');
  handlers.clicked({ menuItemId: 'redint-search-profile', linkUrl: 'https://reddit.com/r/test' });
  handlers.clicked({ menuItemId: 'other', linkUrl: 'https://reddit.com/u/OtherUser' });
  assert.equal(tabs.length, 1);
});
