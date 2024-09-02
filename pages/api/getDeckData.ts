import type { NextApiRequest, NextApiResponse } from 'next';
// import puppeteer from 'puppeteer-core';
// import chromium from '@sparticuz/chromium';


interface Card {
  src: string;
  name: string;
  count: number;
}

const isLocal = !process.env.AWS_LAMBDA_FUNCTION_NAME;

const CHROMIUM_PATH = "https://vomrghiulbmrfvmhlflk.supabase.co/storage/v1/object/public/chromium-pack/chromium-v123.0.0-pack.tar";
async function getBrowser() {
  if (!isLocal) {
    const chromium = await import("@sparticuz/chromium-min").then(
      (mod) => mod.default
    );

    const puppeteerCore = await import("puppeteer-core").then(
      (mod) => mod.default
    );

    const executablePath = await chromium.executablePath(CHROMIUM_PATH);

    const browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });
    return browser;
  } else {
    const browser = await require('puppeteer').launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
    });
    return browser;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const url = `https://www.pokemon-card.com/deck/confirm.html/deckID/${code}`;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const cards: Card[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tr.imgBlockArea')).map(row => {
      const imgElement = row.querySelector('img');
      const spanElement = row.nextElementSibling?.querySelector('span');

      return {
        src: "https://www.pokemon-card.com" + imgElement?.getAttribute('src') || '',
        name: imgElement?.getAttribute('alt') || '',
        count: (spanElement?.textContent?.replace('枚', '').trim() || '0') as unknown as number,
      };
    });
  });
  res.status(200).json(cards);
}
