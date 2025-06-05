import 'dotenv/config';
import express from 'express';
import { Telegraf, Markup } from 'telegraf';

// ✅ Load from .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;
const bot = new Telegraf(BOT_TOKEN);

// ✅ Express Keep-Alive
const app = express();
app.get('/', (req, res) => res.send('🤖 Bot is live!'));
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ✅ TeraBox URL Validation
const teraboxUrlRegex = /^https:\/\/(terabox\.com|1024terabox\.com|teraboxapp\.com|teraboxlink\.com|terasharelink\.com|terafileshare\.com)\/s\/[A-Za-z0-9-_]+$/;

// ✅ /start Command
bot.start((ctx) => {
    ctx.replyWithPhoto(
        { url: 'https://graph.org/file/4e8a1172e8ba4b7a0bdfa.jpg' },
        {
            caption: '👋 Welcome! Send a valid TeraBox link to get a direct download link.',
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('📌 Join Updates Channel', 'https://t.me/GenAIbetabot')]
            ])
        }
    );
});

// ✅ Message Handler
bot.on('text', async (ctx) => {
    const link = ctx.message.text;

    if (!teraboxUrlRegex.test(link)) {
        return ctx.reply('❌ Invalid TeraBox link!');
    }

    await ctx.reply('🔄 Processing your link...');

    try {
        const apiUrl = `https://wdzone-terabox-api.vercel.app/api?url=${encodeURIComponent(link)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        const info = Array.isArray(data["📜 Extracted Info"]) ? data["📜 Extracted Info"][0] : null;
        if (!info || !info["🔽 Direct Download Link"]) {
            return ctx.reply('⚠️ Could not extract download link.');
        }

        const downloadLink = info["🔽 Direct Download Link"];
        const filename = info["📂 Title"] || `video_${Date.now()}.mp4`;
        const size = info["📏 Size"] || "Unknown";
        const estimatedTime = calculateDownloadTime(size);

        await ctx.replyWithPhoto('https://graph.org/file/120e174a9161afae40914.jpg', {
            caption: `🎬 *File Ready!*\n\n📁 *Name:* ${filename}\n⚖ *Size:* ${size}\n⏳ *Estimated Time:* ${estimatedTime}`,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url(`⬇️ Download (${size})`, downloadLink)]
            ])
        });

    } catch (err) {
        console.error('Error:', err);
        ctx.reply('❌ Something went wrong. Please try again later.');
    }
});

// ✅ Estimated Download Time Calculator
function calculateDownloadTime(sizeStr) {
    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return "N/A";

    const [_, value, unit] = match;
    const sizeInBytes = parseFloat(value) * {
        B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3
    }[unit.toUpperCase()];

    const speedMbps = 10;
    const timeSec = (sizeInBytes * 8) / (speedMbps * 1024 * 1024);
    return timeSec < 60 ? `${Math.round(timeSec)} sec` : `${(timeSec / 60).toFixed(1)} min`;
}

// ✅ Error Catching
bot.catch(err => {
    console.error('Bot Error:', err);
});

// ✅ Launch Bot
bot.launch().then(() => {
    console.log('🤖 Bot is running!');
});
