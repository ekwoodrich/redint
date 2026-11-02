# Agent notes

- This is a dependency-free Manifest V3 Chrome/Edge extension. Load the `extension/` directory unpacked; there is no build output.
- `artwork/bot-artwork.png` is the original supplied icon. `extension/icons/` contains 16, 32, 48, and 128 px PNG derivatives; the 16 px manifest icon is used by Chromium's context menu.
- Regenerate the icon sizes with `ffmpeg -i artwork/bot-artwork.png -vf scale=SIZE:SIZE:flags=lanczos -frames:v 1 -pix_fmt rgba extension/icons/icon-SIZE.png` for each listed size. Preserve the source artwork and alpha channel.
- Run `npm test` and `npm run lint` after edits. Browser verification should cover both the context menu and hidden-profile button.
- `profile.js` is loaded by both the service worker and the content script. Keep URL validation and Rosint URL construction centralized there.
- The content script intentionally runs only on Reddit. The context menu can appear on Reddit profile links on any website.
- Reddit's hidden-profile copy and DOM can change. Test against a live hidden profile when available and keep a fixture-based browser check for predictable coverage.
- `test/browser-cdp.mjs` requires Node.js 24 and a running Chromium debugging endpoint with Redint already loaded. During initial verification on 2026-11-02, automated Reddit navigation showed “Prove your humanity” and Rosint showed a Cloudflare challenge. Browser fixtures and a visible Chromium native context-menu click verified both extension surfaces without bypassing either challenge.
- Rosint uses the `u` query parameter to preload a search. Its public README states archive coverage varies and access controls are not bypassed.
