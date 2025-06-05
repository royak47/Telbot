import 'dotenv/config';
import express from 'express';
import { Telegraf } from 'telegraf';
import puppeteer from 'puppeteer';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);

// Express server (keep-alive)
const app = express();
app.get('/', (_, res) => res.send('🤖 TeraBox bot is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Function to fetch direct download link using Puppeteer
async function fetchDownloadLink(teraboxLink) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto('https://teraboxdown.pages.dev/', { waitUntil: 'networkidle2' });

  // Paste TeraBox link into input box
  await page.type('#url', teraboxLink);

  // Click the "Fetch File" button
  await page.click('#fetchFile');

  // Wait for result (selector may vary, verify in page)
  await page.waitForSelector('.result-download-link a', { timeout: 15000 });

  // Extract download URL
  const downloadLink = await page.$eval('.result-download-link a', el => el.href);

  await browser.close();
  return downloadLink;
}

// Link validation regex
const validLink = (text) =>
  /^https:\/\/(terabox|1024terabox|teraboxapp|teraboxlink|terasharelink|terafileshare)\.com\/s\/[A-Za-z0-9\-_]+$/.test(text);

// /start command
bot.start((ctx) => {
  ctx.reply(
    '👋 Welcome! Send me a valid TeraBox link, and I will fetch the direct download link for you.'
  );
});

// On text message
bot.on('text', async (ctx) => {
  const link = ctx.message.text.trim();

  if (!validLink(link)) {
    return ctx.reply('❌ Invalid TeraBox link! Please send a valid link.');
  }

  await ctx.reply('⏳ Processing your link, please wait...');

  try {
    const directLink = await fetchDownloadLink(link);
    await ctx.replyWithMarkdown(
      `✅ *Direct Download Link Found!*\n\n[Click here to download](${directLink})`
    );
  } catch (err) {
    console.error('Error fetching download link:', err);
    await ctx.reply('❌ Failed to fetch download link. Please try again later.');
  }
});

bot.launch();
