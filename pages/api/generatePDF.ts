import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';
import fetch from 'node-fetch';

// ミリメートルをポイントに変換
const mmToPt = (mm: number) => mm * 2.83465;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const data = req.body;
    // PDF ドキュメントを作成
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);

    // 画像のサイズをミリメートルで指定してページに描画
    const imageWidth = mmToPt(61);  // 61mm幅
    const imageHeight = mmToPt(86); // 86mm高さ


    let count = 0;
    await Promise.all(data.map(async (card: { src: any; count: number; }) => {
      const src = card.src;
      const response = await fetch(src);
      const imageBuffer = await response.arrayBuffer();
      const image = await pdfDoc.embedJpg(imageBuffer); // JPEG画像の埋め込み

      for (let i = 0; i < card.count; i++) {
        const x = mmToPt(15 + (count % 3) * 61);   // 左から20mm
        const y = mmToPt(20 + (2 - Math.floor(count % 9 / 3)) * 86); // 上から20mm

        if (count % 9 === 0 && count !== 0) {
          page = pdfDoc.addPage([595.28, 841.89]);
        }
        page.drawImage(image, {
          x: x,
          y: y,
          width: imageWidth,
          height: imageHeight,
        });
        count++;


      }
    }));


    // PDFをバイト配列として保存
    const pdfBytes = await pdfDoc.save();

    // PDFをクライアントに送信
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
    res.send(Buffer.from(pdfBytes));
  } else {
    res.status(405).send({ message: 'Method Not Allowed' });
  }


}