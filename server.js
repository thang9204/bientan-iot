
const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const USER = "thang";
const PASS = "9204";

// 🧠 Dữ liệu biến tần
let vfdData = {
  voltage: 0,
  current: 0,
  power: 0,
  freq: 0,
  energy: 0,
  freqSet: 50,
  freqActual: 0,
  status: "STOP"
};
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Trang giám sát chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
let targetFreq = 50;

// ===============================
// 📲 Cấu hình Telegram Bot
// ===============================
// 👉 Thay TOKEN và CHAT_ID bằng của bạn
const TELEGRAM_TOKEN = "8031072140:AAFgdm-7zt1dKraIm6cddUn3JNf9XG7DPSo"; // <-- token thật của bạn
const CHAT_ID = "8359780065"; // <-- chat id thật của bạn
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

function sendAlert(message) {
  bot.sendMessage(CHAT_ID, `🚨 [VFD IoT] ${message}`);
  console.log("📤 Telegram:", message);
}

// ===============================
// ⚙️ Ngưỡng cảnh báo
// ===============================
const WARNING_CURRENT = 5.0;
const WARNING_VOLTAGE_LOW = 180;
const WARNING_VOLTAGE_HIGH = 250;

// ===============================
// 🔐 API đăng nhập
// ===============================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USER && password === PASS) {
    console.log(`✅ ${username} đăng nhập thành công`);
    res.sendStatus(200);
  } else {
    console.log(`❌ Đăng nhập thất bại từ: ${username}`);
    res.sendStatus(401);
  }
});

// ===============================
// 🌍 API điều khiển từ web
// ===============================
app.post('/api/setFreq', (req, res) => {
  const { freq } = req.body;
  if (typeof freq === 'number' && !isNaN(freq)) {
    vfdData.freqSet = freq;
    console.log("⚙️ Tần số mới từ web:", freq, "Hz");
    res.sendStatus(200);
  } else {
    console.log("❌ Lỗi: Không nhận được giá trị tần số hợp lệ!");
    res.sendStatus(400);
  }
});


app.post("/api/run", (req, res) => {
  vfdData.status = "RUN";
  console.log("🟢 RUN từ web!");
  if (bot) bot.sendMessage(CHAT_ID, "🟢 Biến tần RUN!");
  res.sendStatus(200);
});

// =======================
// ⏹️ NÚT STOP
// =======================
app.post("/api/stop", (req, res) => {
  vfdData.status = "STOP";
  vfdData.freqSet = 0; // dừng biến tần
  console.log("🔴 STOP từ web!");
  if (bot) bot.sendMessage(CHAT_ID, "🔴 Biến tần STOP!");
  res.sendStatus(200);
});

// ===============================
// 📡 ESP32 lấy tần số và trạng thái
// ===============================
app.get('/api/freq', (req, res) => {
  res.json({ freq: vfdData.freqSet, status: vfdData.status });
});

// ===============================
// 🛰️ ESP32 gửi dữ liệu đo
// ===============================
app.post("/api/update", (req, res) => {
  const data = req.body;
  console.log("📩 Nhận dữ liệu từ ESP32:", data);

  // 🔧 Cập nhật từng trường, KHÔNG ghi đè toàn bộ object
  vfdData.voltage = data.voltage;
  vfdData.current = data.current;
  vfdData.power = data.power;
  vfdData.energy = data.energy;
  vfdData.freq = data.freq;
  vfdData.freqSet = data.freqSet;
  vfdData.freqActual = data.freqActual;

  // 🧊 Nhiệt độ nếu có
  if (data.temperature !== undefined)
    vfdData.temperature = data.temperature;

  // ⚙️ Giữ trạng thái STOP nếu đang dừng
  if (vfdData.status === "STOP" && data.status === "RUN") {
    console.log("⛔ Bỏ qua trạng thái RUN vì đang ở STOP");
  } else {
    vfdData.status = data.status;
  }

  // ⚠️ Kiểm tra ngưỡng cảnh báo
  if (vfdData.current > WARNING_CURRENT)
    sendAlert(`⚠️ Dòng điện cao: ${vfdData.current.toFixed(2)}A`);
  if (vfdData.voltage < WARNING_VOLTAGE_LOW)
    sendAlert(`⚠️ Điện áp thấp: ${vfdData.voltage.toFixed(1)}V`);
  if (vfdData.voltage > WARNING_VOLTAGE_HIGH)
    sendAlert(`⚠️ Điện áp cao: ${vfdData.voltage.toFixed(1)}V`);

  res.json({ ok: true });
});


// ===============================
// 🔎 Web lấy dữ liệu để hiển thị
// ===============================
app.get("/api/data", (req, res) => res.json(vfdData));

// ===============================
// 🚀 Khởi động server
// ===============================
const PORT = 3000;
// Hiển thị trang đăng nhập
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.listen(PORT, () => console.log(`🌐 Server chạy tại http://localhost:${PORT}`));
