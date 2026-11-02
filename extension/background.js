importScripts('profile.js');

const MENU_ID = 'redint-search-profile';
const DEFAULT_TITLE = 'Search Reddit profile on Rosint';

function setMenuTitle(username) {
  const title = username ? `u/${username} on Rosint` : DEFAULT_TITLE;
  chrome.contextMenus.update(MENU_ID, { title }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: DEFAULT_TITLE,
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*.reddit.com/user/*',
      '*://*.reddit.com/u/*'
    ]
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'redint-link-target') return;
  setMenuTitle(Redint.usernameFromProfileUrl(message.url));
});

chrome.tabs.onActivated.addListener(() => setMenuTitle(null));
chrome.tabs.onUpdated.addListener((_tabId, change) => {
  if (change.status === 'loading') setMenuTitle(null);
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.linkUrl) return;
  const username = Redint.usernameFromProfileUrl(info.linkUrl);
  if (username) chrome.tabs.create({ url: Redint.rosintUrl(username) });
});
