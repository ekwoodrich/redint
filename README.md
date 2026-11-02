# Redint

Redint is a small Chrome and Edge extension that opens Reddit profiles in [Rosint](https://rosint.dev/). Rosint searches independent archives; coverage varies, and it does not bypass Reddit access controls.

Its extension and context menu icons use the supplied orange artwork in `artwork/bot-artwork.png`.

## Features

- Right-click a Reddit profile link on Reddit and choose **u/USERNAME on Rosint**. On other websites, the item uses **Search Reddit profile on Rosint**.
- On a Reddit profile page that says the user's posts are hidden, use the **Search u/… on Rosint** button below the notice.

Both actions open `https://rosint.dev/?u=USERNAME` in a new tab. Redint does not fetch profile data or transmit browsing activity itself. Rosint handles the search after you choose to open it.

## Install locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this repository's `extension` directory.

Reload the extension after editing its files. Reload a Reddit tab to update its content script.

## Development

The extension uses Manifest V3 and has no build step or runtime dependencies. Node.js 20 or newer runs the checks:

```bash
npm test
npm run lint
```

`extension/profile.js` validates Reddit profile URLs and builds Rosint links. `background.js` owns the context menu. `content.js` adds the button when it finds a hidden-posts notice on a profile page.

For a browser check, start Chrome or Edge with a debugging port and load the unpacked extension, then run `REDINT_CDP=http://127.0.0.1:9222 npm run test:browser`. This checks button placement, a real mouse click, the opened Rosint tab, ordinary profiles, and a client-side profile route change. The test serves fixed page fixtures at Reddit profile URLs so it works even when Reddit challenges automation. Check the native context menu in a visible browser by right-clicking a Reddit profile link and selecting **u/USERNAME on Rosint**.

## Limits

The button depends on Reddit's displayed notice text and may need updating if Reddit changes its wording or page structure. A profile without that notice does not get a button. Reddit and Rosint can independently challenge or block automated browsing; this extension only supplies the Rosint URL.

Rosint is a separate open-source project: [zuxu4n/Rosint](https://github.com/zuxu4n/Rosint). Redint is an independent integration, not a fork or an official Rosint extension.
