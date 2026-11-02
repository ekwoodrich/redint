(() => {
  "use strict";

  function usernameFromProfileUrl(value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }

    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.hostname !== 'reddit.com' && !url.hostname.endsWith('.reddit.com')) return null;

    const match = /^\/(?:user|u)\/([^/]+)(?:\/|$)/i.exec(url.pathname);
    if (!match) return null;

    let username;
    try {
      username = decodeURIComponent(match[1]);
    } catch {
      return null;
    }

    if (!/^[A-Za-z0-9_-]{1,20}$/.test(username)) return null;
    if (username.toLowerCase() === 'me') return null;
    return username;
  }

  function rosintUrl(username) {
    return `https://rosint.dev/?u=${encodeURIComponent(username)}`;
  }

  function isHiddenPostsNotice(value) {
    const text = value.replace(/\s+/g, ' ').trim().toLowerCase();
    return [
      /posts?(?: and comments?)? (?:are|is) hidden/,
      /keeps? (?:their|his|her) posts?(?: and comments?)? hidden/,
      /(?:chose|chooses|chosen|decided|wants) to (?:keep|hide) (?:their|his|her) posts?(?: and comments?)?(?: hidden| private)?/,
      /(?:their|his|her) posts?(?: and comments?)? (?:are|is) private/,
      /has hidden (?:their|his|her) posts?/
    ].some((pattern) => pattern.test(text));
  }

  globalThis.Redint = { usernameFromProfileUrl, rosintUrl, isHiddenPostsNotice };
})();
