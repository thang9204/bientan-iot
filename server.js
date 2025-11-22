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

// Session
app.use(session({
  secret: "vfd_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// ✔ Đặt static file TRƯỚC middleware chặn login
app.use(express.static(path.join(__dirname, "public")));

// 🧱 Middleware kiểm tra login cho trang chính
function requireLogin(req, res, next) {
  if (!req.session.loggedIn) return res.redirect("/login.html");
  next();
}

// =======================================
// 🔐 API LOGIN CHUẨN JSON (KHÔNG REDIRECT)
// =======================================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === USER && password === PASS) {
    req.session.loggedIn = true;
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({
    ok: false,
    message: "❌ Sai thông tin đăng nhập!"
  });
});

// Trang login
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Trang chính
app.get("/", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// API VFD
// ===============================
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

app.get("/api/data", requireLogin, (req, res) => res.json(vfdData));
app.post("/api/setFreq", requireLogin, (req, res) => {
  vfdData.freqSet = req.body.freq;
  res.sendStatus(200);
});
app.post("/api/runFwd", requireLogin, (req, res) => { vfdData.status = "RUN_FWD"; res.sendStatus(200); });
app.post("/api/runRev", requireLogin, (req, res) => { vfdData.status = "RUN_REV"; res.sendStatus(200); });
app.post("/api/stop", requireLogin, (req, res) => { vfdData.status = "STOP"; res.sendStatus(200); });
app.post("/api/update", (req, res) => { vfdData = { ...vfdData, ...req.body }; res.json({ ok: true }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server chạy cổng ${PORT}`));
