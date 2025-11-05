const TelegramBot = require('node-telegram-bot-api');

// 🔧 Thay token và chat ID của bạn
const TOKEN = '8031072140:AAFgdm-7zt1dKraIm6cddUn3JNf9XG7DPSo';
const CHAT_ID = '8359780065';

const bot = new TelegramBot(TOKEN, { polling: false });

bot.sendMessage(CHAT_ID, '🚀 Test thành công: Hệ thống VFD IoT kết nối Telegram OK!')
  .then(() => console.log('✅ Đã gửi tin nhắn Telegram thành công!'))
  .catch(err => console.error('❌ Lỗi gửi tin nhắn:', err));
