import 'dotenv/config';
import express from 'express';
import { Telegraf, Markup } from 'telegraf';
import puppeteer from 'puppeteer';

// ✅ Load ENV
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(BOT_TOKEN);

// ✅ Keep-alive express server
const app = express();
app.get('/', (_, res) => res.send('🤖 TeraBox bot is running!'));
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));

// ✅ TeraBox link checker
const validLink = (text) =>
  /^https:\/\/(terabox|1024terabox|teraboxapp|teraboxlink|terasharelink|terafileshare|teraboxshare)\.com\/s\/[A-Za-z0-9\-_]+$/.test(text);

// ✅ Start command
bot.start((ctx) =>
  ctx.reply(
    `👋 Welcome to *TeraBox Downloader Bot*!\n\n📥 Just send a valid TeraBox link to get the download link.`,
    { parse_mode: 'Markdown' }
  )
);

// ✅ Message Handler
bot.on('text', async (ctx) => {
  const link = ctx.message.text.trim();

  if (!validLink(link)) {
    return ctx.reply('❌ Invalid TeraBox link!');
  }

  await ctx.reply('⏳ Scraping download link, please wait...');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/chromium', // For Termux, update path if needed
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://teraboxdown.pages.dev/', { waitUntil: 'networkidle2' });

    await page.type('input[type="text"]', link);
    await page.click('button:has-text("Fetch Files")');

    await page.waitForSelector('a[href^="https://"]', { timeout: 15000 });

    const fileData = await page.evaluate(() => {
      const anchor = document.querySelector('a[href^="https://"]');
      const name = anchor?.textContent?.trim();
      const url = anchor?.href;
      return { name, url };
    });

    await browser.close();

    if (!fileData?.url) {
      return ctx.reply('⚠️ Could not extract the download link. Try again later.');
    }

    await ctx.reply(
      `✅ *Download Ready!*\n\n📁 *File:* ${fileData.name || 'Unknown'}\n🔗 [Click Here to Download](${fileData.url})`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        ...Markup.inlineKeyboard([[Markup.button.url('⬇️ Download Now', fileData.url)]]),
      }
    );
  } catch (err) {
    console.error('Scrape Error:', err);
    ctx.reply('❌ Failed to scrape the download link. Please try again later.');
  }
});

// ✅ Error handling
bot.catch((err) => console.error('Bot Error:', err));

// ✅ Start the bot
bot.launch();
