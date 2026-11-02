(() => {
  "use strict";

  const LINK_SELECTOR = '[data-redint-link]';
  let timer;

  function hiddenNotice() {
    let best = null;
    for (const element of document.querySelectorAll('p, h1, h2, h3, [role="status"], div, span')) {
      if (element.closest(LINK_SELECTOR)) continue;
      const text = element.textContent?.trim();
      if (!text || text.length > 260 || !Redint.isHiddenPostsNotice(text)) continue;
      if (!best || text.length < best.textContent.trim().length) best = element;
    }
    return best;
  }

  function updateButton() {
    const username = Redint.usernameFromProfileUrl(location.href);
    const notice = username ? hiddenNotice() : null;
    const existing = document.querySelector(LINK_SELECTOR);

    if (!notice) {
      existing?.remove();
      return;
    }

    const href = Redint.rosintUrl(username);
    if (existing && existing.href === href && existing.previousElementSibling === notice) return;
    existing?.remove();

    const link = document.createElement('a');
    link.dataset.redintLink = '';
    link.className = 'redint-button';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Search u/${username} on Rosint`;
    link.setAttribute('aria-label', `Search u/${username} on Rosint (opens a new tab)`);
    notice.insertAdjacentElement('afterend', link);
  }

  function scheduleUpdate() {
    clearTimeout(timer);
    timer = setTimeout(updateButton, 100);
  }

  updateButton();
  new MutationObserver(scheduleUpdate).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener('popstate', scheduleUpdate);
})();
