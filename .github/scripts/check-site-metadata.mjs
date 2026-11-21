import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const readText = path => readFileSync(new URL(path, root), 'utf8');
const home = 'https://verityresearch.us/';
const brand = 'Verity Research';
const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(readText('index.html'))?.[1];
assert.ok(head, 'The homepage must have a static HTML head');

const meta = [...head.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]));

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(([, name, double, single]) => [name, double ?? single]));
}

function one(items, predicate, label) {
  const matches = items.filter(predicate);
  assert.equal(matches.length, 1, `Expected exactly one ${label}`);
  return matches[0];
}

function metadata(key) {
  const tag = one(meta, ({ name, property }) => name === key || property === key, key);
  assert.ok(tag.content?.trim(), `${key} needs a nonempty value`);
  return tag.content;
}

function checkPng(path, width, height) {
  const asset = readFileSync(new URL(path, root));
  assert.equal(asset.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${path} must be a PNG`);
  assert.equal(asset.toString('ascii', 12, 16), 'IHDR', `${path} must have a PNG header`);
  assert.equal(asset.readUInt32BE(16), width, `${path} width`);
  assert.equal(asset.readUInt32BE(20), height, `${path} height`);
}

const title = one([...head.matchAll(/<title>([^<]+)<\/title>/gi)], () => true, 'page title')[1];
assert.ok(title.startsWith(brand), 'Page title must identify Verity Research');
assert.equal(metadata('og:site_name'), brand);
assert.equal(metadata('og:title'), title);
assert.equal(metadata('twitter:title'), title);
assert.equal(metadata('og:description'), metadata('description'));
assert.equal(metadata('twitter:description'), metadata('description'));
assert.equal(metadata('og:type'), 'website');
assert.equal(metadata('og:url'), home);
assert.equal(one(links, ({ rel }) => rel === 'canonical', 'canonical link').href, home);
for (const { content, name } of meta) {
  if (/^(robots|googlebot)$/i.test(name ?? '')) {
    assert.doesNotMatch(content ?? '', /\b(?:noindex|none)\b/i, 'The public homepage must remain indexable');
  }
}

const siteData = [...head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs]) => attributes(attrs).type === 'application/ld+json')
  .map(([, , content]) => JSON.parse(content));
const website = one(siteData, item => item['@type'] === 'WebSite', 'WebSite structured data object');
assert.equal(website.name, brand);
assert.equal(website.url, home);

const preview = 'verity-research-preview.png';
assert.equal(metadata('og:image'), new URL(preview, home).href);
assert.equal(metadata('og:image:type'), 'image/png');
assert.equal(metadata('og:image:width'), '1200');
assert.equal(metadata('og:image:height'), '630');
assert.equal(metadata('twitter:card'), 'summary_large_image');
assert.equal(metadata('twitter:image'), metadata('og:image'));
assert.equal(metadata('twitter:image:alt'), metadata('og:image:alt'));
checkPng(preview, 1200, 630);

const icon = one(links, ({ rel }) => rel === 'icon', 'favicon link');
assert.equal(icon.href, '/favicon.png');
assert.equal(icon.type, 'image/png');
assert.equal(icon.sizes, '96x96');
checkPng('favicon.png', 96, 96);

const sitemap = readText('sitemap.xml');
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
assert.ok([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].some(([, loc]) => loc === home),
  'The sitemap must list the canonical homepage');
assert.ok(readText('robots.txt').split(/\r?\n/).includes(`Sitemap: ${home}sitemap.xml`),
  'robots.txt must advertise the sitemap');

console.log('Website metadata and published asset references passed.');
