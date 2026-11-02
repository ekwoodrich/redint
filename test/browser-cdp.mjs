// Run against a Chromium browser with this extension loaded and a CDP port open.
// Example: REDINT_CDP=http://127.0.0.1:9222 node test/browser-cdp.mjs
import assert from 'node:assert/strict';

const base = process.env.REDINT_CDP;
if (!base) throw new Error('Set REDINT_CDP to a browser debugging endpoint');

class Cdp {
  constructor(url) {
    this.url = url;
    this.nextId = 0;
    this.pending = new Map();
    this.events = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
    this.socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        message.error ? pending.reject(message.error) : pending.resolve(message.result);
      } else {
        this.events.get(message.method)?.(message.params);
      }
    };
  }

  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(name, handler) {
    this.events.set(name, handler);
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(check, message) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

const browserInfo = await (await fetch(`${base}/json/version`)).json();
const browser = new Cdp(browserInfo.webSocketDebuggerUrl);
await browser.connect();
const extension = (await browser.call('Extensions.getExtensions')).extensions.find((item) => item.name === 'Redint');
assert.ok(extension?.enabled, 'Redint must be loaded');

const targets = await (await fetch(`${base}/json/list`)).json();
const tab = targets.find((item) => item.type === 'page' && (item.url.startsWith('https://www.reddit.com/') || item.url === 'about:blank'));
assert.ok(tab, 'A browser tab must be open');
const page = new Cdp(tab.webSocketDebuggerUrl);
await page.connect();

const fixtures = {
  HiddenTestAccount: '<!doctype html><html><body><main><h1>u/HiddenTestAccount</h1><p id="notice">This user keeps their posts hidden</p><a href="https://www.reddit.com/u/Bethplaysbanjo/" id="profile-link">u/Bethplaysbanjo</a></main></body></html>',
  VisibleTestUser: '<!doctype html><html><body><main><h1>u/VisibleTestUser</h1><p>Recent posts</p><a href="https://www.reddit.com/user/Bethplaysbanjo/" id="profile-link">u/Bethplaysbanjo</a></main></body></html>'
};

page.on('Fetch.requestPaused', ({ requestId, request }) => {
  const username = new URL(request.url).pathname.split('/')[2];
  const body = fixtures[username];
  if (!body) throw new Error(`Unexpected fixture request: ${request.url}`);
  page.call('Fetch.fulfillRequest', {
    requestId,
    responseCode: 200,
    responseHeaders: [{ name: 'content-type', value: 'text/html; charset=utf-8' }],
    body: Buffer.from(body).toString('base64')
  }).catch((error) => { throw error; });
});

async function evaluate(expression) {
  const response = await page.call('Runtime.evaluate', { expression, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

try {
  await page.call('Page.enable');
  await page.call('Fetch.enable', {
    patterns: [{ urlPattern: '*://www.reddit.com/user/*', resourceType: 'Document' }]
  });

  await page.call('Page.navigate', { url: 'https://www.reddit.com/user/HiddenTestAccount/' });
  const button = await waitFor(
    () => evaluate('document.querySelector("[data-redint-link]")?.href'),
    'Hidden profile did not get a Rosint button'
  );
  assert.equal(button, 'https://rosint.dev/?u=HiddenTestAccount');
  assert.equal(await evaluate('document.querySelector("#notice").nextElementSibling?.hasAttribute("data-redint-link")'), true);
  assert.equal(await evaluate('document.querySelectorAll("[data-redint-link]").length'), 1);
  console.log('PASS hidden profile: one button directly below the notice');

  await browser.call('Target.activateTarget', { targetId: tab.id });
  const initialTabs = (await (await fetch(`${base}/json/list`)).json()).filter((item) => item.type === 'page').length;
  const position = await evaluate('(() => { const box = document.querySelector("[data-redint-link]").getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()');
  await page.call('Input.dispatchMouseEvent', { type: 'mousePressed', x: position.x, y: position.y, button: 'left', clickCount: 1 });
  await page.call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: position.x, y: position.y, button: 'left', clickCount: 1 });
  await waitFor(async () => {
    const openTabs = (await (await fetch(`${base}/json/list`)).json()).filter((item) => item.type === 'page');
    return openTabs.length > initialTabs && openTabs.some((item) => item.url.startsWith('https://rosint.dev/?u=HiddenTestAccount'));
  }, 'Click did not open Rosint in a new tab');
  console.log('PASS button click: opened the expected Rosint URL in a new tab');

  await evaluate('history.pushState({}, "", "/user/VisibleTestUser/"); document.querySelector("main").innerHTML = "<h1>u/VisibleTestUser</h1><p>Recent posts</p>"');
  await waitFor(() => evaluate('!document.querySelector("[data-redint-link]")'), 'Button remained after a profile route change');
  console.log('PASS client-side route change: old button removed');

  await page.call('Page.navigate', { url: 'https://www.reddit.com/user/VisibleTestUser/' });
  await waitFor(() => evaluate('document.querySelector("h1")?.textContent === "u/VisibleTestUser"'), 'Visible fixture did not load');
  assert.equal(await evaluate('document.querySelector("[data-redint-link]")'), null);
  console.log('PASS ordinary profile: no button');
} finally {
  page.close();
  browser.close();
}
