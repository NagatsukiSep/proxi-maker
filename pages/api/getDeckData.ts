import type { NextApiRequest, NextApiResponse } from 'next';
// import puppeteer from 'puppeteer-core';
// import chromium from '@sparticuz/chromium';

let chromium: { args: any; executablePath: any; headless: any; };
let puppeteer: { launch: (arg0: { args: any; executablePath: any; headless: any; }) => any; };

interface Card {
  src: string;
  name: string;
  count: number;
}

const isLocal = !process.env.AWS_LAMBDA_FUNCTION_NAME;
if (isLocal) {
  puppeteer = require('puppeteer');
}
else {
  chromium = require('@sparticuz/chromium');
  puppeteer = require('puppeteer-core');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const url = `https://www.pokemon-card.com/deck/confirm.html/deckID/${code}`;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  let browser;
  try {
    if (isLocal) {
      // ローカル環境でpuppeteerを使用
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.CHROMIUM_PATH,
        headless: true,
      });
    } else {
      // Vercel環境でchrome-aws-lambdaを使用

      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
    }
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
