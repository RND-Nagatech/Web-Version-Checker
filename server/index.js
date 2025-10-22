require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function friendlyErrorMessage(err) {
  const msg = (err && err.message) ? err.message : String(err);
  if (msg.includes('net::ERR_NAME_NOT_RESOLVED')) return 'Alamat web tidak ditemukan';
  if (msg.includes('net::ERR_CONNECTION_REFUSED')) return 'Server menolak koneksi';
  if (/Timeout|Navigation timeout/i.test(msg)) return 'Koneksi terlalu lama / timeout';
  return msg;
}

async function checkOne(url) {
  // Fungsi ini sekarang menerima browser sebagai argumen
  // ...existing code...
}

app.post('/api/check', async (req, res) => {
  try {
    const urls = req.body.urls;
    if (!Array.isArray(urls)) return res.status(400).json({ error: 'Field `urls` harus array.' });
    // Jalankan pengecekan paralel dengan concurrency limit
    const urlList = urls.map(u => {
      let url = (u || '').trim();
      if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
      return url;
    });
    console.log('Checking URLs:', urlList);

    // Batasi concurrency
    const CONCURRENCY = parseInt(process.env.CHECK_CONCURRENCY) || 5;
    // Satu browser instance untuk semua pengecekan
    const headless = process.env.PUPPETEER_HEADLESS !== 'false';
    const args = process.env.PUPPETEER_ARGS ? process.env.PUPPETEER_ARGS.split(',') : ['--no-sandbox','--disable-setuid-sandbox'];
    const browser = await puppeteer.launch({
    headless: "new",
    args,
    });


    async function checkOneTab(url) {
      let page;
      let lastError = null;
      let lastDuration = 0;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const startTime = Date.now();
        let page;
        try {
          page = await browser.newPage();
          const navigationTimeout = parseInt(process.env.NAVIGATION_TIMEOUT) || 90000;
          await page.goto(url, { waitUntil: 'networkidle0', timeout: navigationTimeout });
          try {
            const waitTimeout = parseInt(process.env.WAIT_TIMEOUT) || 30000;
            await page.waitForFunction(
              () =>
                /versi\s*klien/i.test(document.body.innerText) ||
                /versi\s*server/i.test(document.body.innerText) ||
                /client\s*version/i.test(document.body.innerText) ||
                /server\s*version/i.test(document.body.innerText),
              { timeout: waitTimeout }
            );
          } catch (e) {
            // continue
            console.warn('waitForFunction timeout for', url);
          }
          const delayMs = parseInt(process.env.DELAY_MS) || 2000;
          await delay(delayMs);
          const data = await page.evaluate(() => {
            const teks = document.body.innerText || '';
            const c1 = teks.match(/Versi\s*Klien\s*:\s*([\d.]+)/i) ||
                       teks.match(/Client\s*Version\s*:\s*([\d.]+)/i) ||
                       teks.match(/ClientVersion\s*:?\s*([\d.]+)/i) ||
                       teks.match(/Client\s*:\s*([\d.]+)/i);
            const s1 = teks.match(/Versi\s*Server\s*:\s*([\d.]+)/i) ||
                       teks.match(/Server\s*Version\s*:\s*([\d.]+)/i) ||
                       teks.match(/ServerVersion\s*:?\s*([\d.]+)/i) ||
                       teks.match(/Server\s*:\s*([\d.]+)/i);
            return {
              versi_klien: c1 ? c1[1] : null,
              versi_server: s1 ? s1[1] : null
            };
          });
          await page.close();
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);
          console.log(`[CHECK] ${url} selesai dalam ${duration} detik (percobaan ke-${attempt})`);
          return { url, ...data, duration: Number(duration), attempt };
        } catch (err) {
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);
          lastDuration = duration;
          const friendly = friendlyErrorMessage(err);
          lastError = friendly;
          if (page) try { await page.close(); } catch(e){}
          console.log(`[CHECK] ${url} ERROR dalam ${duration} detik (percobaan ke-${attempt}): ${friendly}`);
          // Jika error timeout, lakukan retry (maksimal 2x retry)
          if (attempt < 3 && friendly === 'Koneksi terlalu lama / timeout') {
            continue;
          } else {
            return { url, error: friendly, duration: Number(duration), attempt };
          }
        }
      }
      // Jika tetap gagal setelah 3 percobaan
      return { url, error: lastError, duration: Number(lastDuration), attempt: 3 };
    }

    async function runBatch(items, fn, batchSize) {
      const results = [];
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
      }
      return results;
    }

    const results = await runBatch(urlList, checkOneTab, CONCURRENCY);
    await browser.close();
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
