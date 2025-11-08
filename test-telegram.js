const TelegramBot = require('node-telegram-bot-api');

// Dán token và chat ID thật của bạn để test
const TELEGRAM_TOKEN = '8031072140:AAFgdm-7zt1dKraIm6cddUn3JNf9XG7DPSo';
const CHAT_ID = '8359780065';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

bot.sendMessage(CHAT_ID, '✅ Kiểm tra kết nối Telegram từ Node.js!')
  .then(() => console.log('📤 Gửi thành công!'))
  .catch(err => console.error('🚫 Lỗi gửi:', err));
