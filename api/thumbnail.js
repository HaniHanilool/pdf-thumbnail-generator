import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  const pdfUrl = req.query.url;
  if (!pdfUrl) {
    return res.status(400).send("Missing 'url' query parameter.");
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 800, height: 600 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Open the PDF directly (render first page for thumbnail)
    await page.goto(pdfUrl, { waitUntil: 'networkidle2' });

    // Wait for the PDF to render - the Chromium PDF viewer uses canvas tag
    await page.waitForSelector('canvas');

    // Screenshot the first canvas (the thumbnail)
    const canvas = await page.$('canvas');
    const screenshot = await canvas.screenshot({ type: 'jpeg', quality: 80 });

    await browser.close();

    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(screenshot);
  } catch (err) {
    console.error('Thumbnail generation error:', err);
    res.status(500).send('Failed to generate thumbnail.');
  }
}
