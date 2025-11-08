const express = require("express");
const path = require("path");
const session = require("express-session");
const TelegramBot = require("node-telegram-bot-api");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 🧠 Cấu hình đăng nhập
const USER = "thang";
const PASS = "9204";
app.use(session({
  secret: "vfd_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// ⚠️ Kiểm tra đăng nhập TRƯỚC khi phục vụ static file
app.use((req, res, next) => {
  if (!req.session.loggedIn && (req.path === "/" || req.path === "/index.html")) {
    return res.redirect("/login.html");
  }
  next();
});
app.use(express.static(path.join(__dirname, "public")));
// 🧱 Middleware kiểm tra login
function requireLogin(req, res, next) {
  if (!req.session.loggedIn) return res.redirect("/login.html");
  next();
}

// ==================================================
// 🧠 Dữ liệu biến tần
// ==================================================
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

let targetFreq = 50;

// ==================================================
// 📲 Cấu hình Telegram Bot
// ==================================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

function sendAlert(message) {
  if (bot && CHAT_ID)
    bot.sendMessage(CHAT_ID, `🚨 [VFD IoT] ${message}`);
  console.log("📤 Telegram:", message);
}

// ==================================================
// ⚙️ Ngưỡng cảnh báo
// ==================================================
const WARNING_CURRENT = 5.0;
const WARNING_VOLTAGE_LOW = 180;
const WARNING_VOLTAGE_HIGH = 250;

// ==================================================
// 🔐 Xử lý đăng nhập
// ==================================================
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USER && password === PASS) {
    req.session.loggedIn = true;
    console.log(`✅ ${username} đăng nhập thành công`);
    return res.redirect("/index.html");
  } else {
    console.log(`❌ Đăng nhập thất bại từ: ${username}`);
    return res.send(
      '<script>alert("Sai tài khoản hoặc mật khẩu!"); window.location="/login.html";</script>'
    );
  }
});

// Đăng xuất
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login.html");
  });
});

// ==================================================
// 🏠 Trang giám sát chính (yêu cầu login)
// ==================================================
app.get("/", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================================================
// 🌍 API điều khiển từ web
// ==================================================
app.post('/api/setFreq', requireLogin, (req, res) => {
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

app.post("/api/run", requireLogin, (req, res) => {
  vfdData.status = "RUN";
  console.log("🟢 RUN từ web!");
  if (bot) bot.sendMessage(CHAT_ID, "🟢 Biến tần RUN!");
  res.sendStatus(200);
});

app.post("/api/stop", requireLogin, (req, res) => {
  vfdData.status = "STOP";
  vfdData.freqSet = 0;
  console.log("🔴 STOP từ web!");
  if (bot) bot.sendMessage(CHAT_ID, "🔴 Biến tần STOP!");
  res.sendStatus(200);
});

// ==================================================
// 📡 ESP32 lấy tần số và trạng thái
// ==================================================
app.get("/api/freq", (req, res) => {
  res.json({ freq: vfdData.freqSet, status: vfdData.status });
});

// ==================================================
// 🛰️ ESP32 gửi dữ liệu đo
// ==================================================
app.post("/api/update", (req, res) => {
  const data = req.body;
  console.log("📩 Nhận dữ liệu từ ESP32:", data);

  vfdData.voltage = data.voltage;
  vfdData.current = data.current;
  vfdData.power = data.power;
  vfdData.energy = data.energy;
  vfdData.freq = data.freq;
  vfdData.freqSet = data.freqSet;
  vfdData.freqActual = data.freqActual;
  if (data.temperature !== undefined) vfdData.temperature = data.temperature;

  if (vfdData.status === "STOP" && data.status === "RUN") {
    console.log("⛔ Bỏ qua trạng thái RUN vì đang ở STOP");
  } else {
    vfdData.status = data.status;
  }

  if (vfdData.current > WARNING_CURRENT)
    sendAlert(`⚠️ Dòng điện cao: ${vfdData.current.toFixed(2)}A`);
  if (vfdData.voltage < WARNING_VOLTAGE_LOW)
    sendAlert(`⚠️ Điện áp thấp: ${vfdData.voltage.toFixed(1)}V`);
  if (vfdData.voltage > WARNING_VOLTAGE_HIGH)
    sendAlert(`⚠️ Điện áp cao: ${vfdData.voltage.toFixed(1)}V`);

  res.json({ ok: true });
});

// ==================================================
// 🔎 Web lấy dữ liệu để hiển thị
// ==================================================
app.get("/api/data", requireLogin, (req, res) => res.json(vfdData));

// ==================================================
// 🚀 Khởi động server
// ==================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server đang chạy trên cổng ${PORT}`));
