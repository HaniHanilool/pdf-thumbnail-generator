import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  const pdfUrl = req.query.url;
  if (!pdfUrl) return res.status(400).send("Missing 'url' query parameter.");

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 800, height: 600 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const viewerUrl = `https://${req.headers.host}/viewer.html?pdf=${encodeURIComponent(pdfUrl)}`;
    await page.goto(viewerUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#pdf-canvas');

    const canvas = await page.$('#pdf-canvas');
    const screenshot = await canvas.screenshot({ type: 'jpeg', quality: 80 });

    await browser.close();

    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(screenshot);
  } catch (err) {
    console.error('Thumbnail generation error:', err);
    res.status(500).send('Failed to generate thumbnail.');
  }
}
