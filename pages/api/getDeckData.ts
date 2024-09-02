// pages/api/getDeckData.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

interface Card {
  src: string;
  name: string;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const url = `https://www.pokemon-card.com/deck/confirm.html/deckID/${code}`;

  const browser = await puppeteer.launch();
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

  await browser.close();

  res.status(200).json(cards);
}
