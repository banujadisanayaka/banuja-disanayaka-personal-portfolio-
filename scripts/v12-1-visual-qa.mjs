import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.BROWSER_QA_BASE_URL || 'http://127.0.0.1:4173';
const out = 'qa-artifacts/v12-1';
await fs.mkdir(out, {recursive:true});

const browser = await chromium.launch();

async function prepare(page) {
  await page.goto(base + '/?intro=1', {waitUntil:'networkidle'});
  await page.locator('html[data-v121="on"]').waitFor();
  await page.waitForFunction(() => document.querySelector('link[data-v121-style]')?.sheet);
  await page.evaluate(() => { document.documentElement.dataset.motion = 'off'; });
}

async function capture(page, selector, kind, filename) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForFunction(expected => document.querySelector('.v121-stage')?.dataset.v121Kind === expected, kind);
  await page.waitForTimeout(120);
  await page.screenshot({path:`${out}/${filename}.png`, fullPage:false});
}

try {
  const desktop = await browser.newContext({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
  const desktopPage = await desktop.newPage();
  await prepare(desktopPage);
  await capture(desktopPage, '#opening', 'identity', 'identity-desktop');
  await capture(desktopPage, '#photography', 'photography', 'photography-desktop');
  await capture(desktopPage, '#about', 'about', 'about-desktop');
  await capture(desktopPage, '#ecosystem', 'ecosystem', 'veloria-desktop');
  await desktop.close();

  const mobile = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:1});
  const mobilePage = await mobile.newPage();
  await prepare(mobilePage);
  await capture(mobilePage, '#opening', 'identity', 'identity-mobile');
  await capture(mobilePage, '#photography', 'photography', 'photography-mobile');
  await mobile.close();

  console.log(`V12.1 visual QA captured 6 views in ${out}`);
} finally {
  await browser.close();
}
