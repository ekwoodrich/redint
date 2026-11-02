importScripts('profile.js');

const MENU_ID = 'redint-search-profile';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Search Reddit profile on Rosint',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*.reddit.com/user/*',
      '*://*.reddit.com/u/*'
    ]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.linkUrl) return;
  const username = Redint.usernameFromProfileUrl(info.linkUrl);
  if (username) chrome.tabs.create({ url: Redint.rosintUrl(username) });
});
