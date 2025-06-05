import 'dotenv/config';
import express from 'express';
import { Telegraf, Markup } from 'telegraf';
import fetch from 'node-fetch';

// ✅ Load .env values
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);

// ✅ Express keep-alive (Render/Termux support)
const app = express();
app.get('/', (_, res) => res.send('🤖 TeraBox Bot is running'));
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Valid TeraBox link checker
const isValidTeraBoxLink = (text) =>
  /^https:\/\/(terabox|1024terabox|teraboxapp|teraboxlink|terasharelink|terafileshare|teraboxshare)\.com\/s\/[A-Za-z0-9\-_]+$/.test(text);

// ✅ Start command
bot.start((ctx) => {
  ctx.reply(`👋 Welcome to TeraBox Bot!\n\nJust send a valid TeraBox link to get a direct download link.`);
});

// ✅ On message
bot.on('text', async (ctx) => {
  const link = ctx.message.text.trim();

  if (!isValidTeraBoxLink(link)) {
    return ctx.reply('❌ Invalid TeraBox link. Please send a correct link.');
  }

  await ctx.reply('⏳ Processing your link...');

  try {
    const apiUrl = `https://teraboxdown.pages.dev/api?url=${encodeURIComponent(link)}`;
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json || !json.success || !json.data || !json.data.length) {
      return ctx.reply('⚠️ Could not extract download link. Try again later.');
    }

    const file = json.data[0];
    const filename = file.fileName || 'Unknown File';
    const downloadUrl = file.downloadUrl;

    await ctx.replyWithMarkdown(
      `✅ *Download Link Found!*\n\n📁 *File:* ${filename}\n🔗 *Link:* [Click Here to Download](${downloadUrl})`,
      {
        disable_web_page_preview: false,
        ...Markup.inlineKeyboard([
          [Markup.button.url('⬇️ Download', downloadUrl)]
        ])
      }
    );
  } catch (err) {
    console.error('❌ Error:', err);
    ctx.reply('❌ Failed to fetch download link. Please try again later.');
  }
});

// ✅ Error handler
bot.catch((err) => {
  console.error('Bot Error:', err);
});

// ✅ Launch bot
bot.launch();
