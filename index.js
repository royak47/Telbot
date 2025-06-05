import 'dotenv/config';
import express from 'express';
import { Telegraf, Markup } from 'telegraf';
import fetch from 'node-fetch';

// ✅ Load env
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(BOT_TOKEN);

// ✅ Web keep-alive
const app = express();
app.get('/', (_, res) => res.send('🤖 TeraBox bot running'));
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));

// ✅ TeraBox link checker (updated to include teraboxshare.com)
const validLink = (text) =>
  /^https:\/\/(terabox|1024terabox|teraboxapp|teraboxlink|terasharelink|terafileshare|teraboxshare)\.com\/s\/[A-Za-z0-9\-_]+$/.test(text);

// ✅ /start command
bot.start((ctx) =>
  ctx.reply(
    `👋 Welcome to *TeraBox Bot!*\n\nJust send a valid TeraBox link to get the direct download link.`,
    { parse_mode: 'Markdown' }
  )
);

// ✅ On message
bot.on('text', async (ctx) => {
  const link = ctx.message.text;

  if (!validLink(link)) {
    return ctx.reply('❌ Invalid TeraBox link!');
  }

  await ctx.reply('⏳ Processing your link...');

  try {
    const res = await fetch(`https://teraboxdown.pages.dev/api?url=${encodeURIComponent(link)}`);
    const json = await res.json();

    if (!json || !json.success || !json.data?.length) {
      return ctx.reply('⚠️ Could not extract download link.');
    }

    const file = json.data[0];
    const downloadLink = file.downloadUrl;
    const filename = file.fileName || 'TeraBox_File';

    await ctx.reply(
      `✅ *Link Extracted!*\n\n📁 *File:* ${filename}\n🔗 *Download:* [Click Here](${downloadLink})`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        ...Markup.inlineKeyboard([
          [Markup.button.url('⬇️ Download', downloadLink)]
        ])
      }
    );
  } catch (err) {
    console.error('Fetch Error:', err);
    ctx.reply('❌ Error processing the link. Try again later.');
  }
});

// ✅ Catch all errors
bot.catch((err) => {
  console.error('Bot Error:', err);
});

// ✅ Start
bot.launch();
