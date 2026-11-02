const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '../extension/profile.js'), 'utf8');
const context = vm.createContext({ URL, encodeURIComponent });
vm.runInContext(source, context);
const { usernameFromProfileUrl, rosintUrl, isHiddenPostsNotice } = context.Redint;

test('extracts usernames from Reddit profile links', () => {
  for (const url of [
    'https://www.reddit.com/user/Bethplaysbanjo',
    'https://reddit.com/u/Bethplaysbanjo/',
    'https://old.reddit.com/user/Bethplaysbanjo/comments/',
    'http://sh.reddit.com/user/Bethplaysbanjo?sort=new'
  ]) {
    assert.equal(usernameFromProfileUrl(url), 'Bethplaysbanjo');
  }
  assert.equal(rosintUrl('Bethplaysbanjo'), 'https://rosint.dev/?u=Bethplaysbanjo');
});

test('rejects links that are not a Reddit user profile', () => {
  for (const url of [
    'https://notreddit.com/user/Bethplaysbanjo',
    'https://reddit.com.evil.test/user/Bethplaysbanjo',
    'https://reddit.com/r/test',
    'https://reddit.com/user/me',
    'https://reddit.com/user/Beth%2Fother',
    'https://reddit.com/user/Beth%20other',
    'javascript:alert(1)',
    'not a URL'
  ]) {
    assert.equal(usernameFromProfileUrl(url), null, url);
  }
});

test('recognizes hidden-post notices without matching unrelated text', () => {
  for (const message of [
    'This user keeps their posts hidden',
    'This user has chosen to hide their posts and comments',
    'Their posts and comments are private',
    'Posts are hidden'
  ]) {
    assert.equal(isHiddenPostsNotice(message), true, message);
  }
  for (const message of [
    'No posts yet',
    'You have hidden this post',
    'This post was hidden by a moderator',
    'Comments are hidden'
  ]) {
    assert.equal(isHiddenPostsNotice(message), false, message);
  }
});
