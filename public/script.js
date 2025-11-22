const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
app.set("trust proxy", 1);

// Đọc JSON + form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: "vfd_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
  })
);

// Tài khoản đăng nhập
const USER = "thang";
const PASS = "9204";

// Dữ liệu biến tần
let vfdData = {
  voltage: 0,
  current: 0,
  power: 0,
  freq: 0,
  energy: 0,
  freqSet: 50,
  freqActual: 0,
  status: "STOP",
};

// Middleware chặn truy cập trái phép
function requireLogin(req, res, next) {
  if (!req.session.loggedIn) {
    return res.redirect("/login.html");
  }
  next();
}

// API login
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

// Kiểm tra session hợp lệ
app.get("/api/checkLogin", (req, res) => {
  res.json({ loggedIn: req.session.loggedIn === true });
});

// Chặn truy cập / và /index.html nếu chưa đăng nhập
app.use((req, res, next) => {
  if (!req.session.loggedIn && (req.path === "/" || req.path === "/index.html")) {
    return res.redirect("/login.html");
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ESP gửi dữ liệu
app.post("/api/update", (req, res) => {
  vfdData = { ...vfdData, ...req.body };
  res.sendStatus(200);
});

// Web lấy dữ liệu
app.get("/api/data", (req, res) => {
  res.json(vfdData);
});

// Web đặt tần số
app.post("/api/setFreq", requireLogin, (req, res) => {
  vfdData.freqSet = req.body.freq;
  res.sendStatus(200);
});

// RUN thuận
app.post("/api/runFwd", requireLogin, (req, res) => {
  vfdData.status = "RUN_FWD";
  res.sendStatus(200);
});

// RUN nghịch
app.post("/api/runRev", requireLogin, (req, res) => {
  vfdData.status = "RUN_REV";
  res.sendStatus(200);
});

// STOP
app.post("/api/stop", requireLogin, (req, res) => {
  vfdData.status = "STOP";
  res.sendStatus(200);
});

// ESP đọc tần số
app.get("/api/freq", (req, res) => {
  res.json({ freq: vfdData.freqSet, status: vfdData.status });
});

// RUN SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server chạy tại PORT ${PORT}`));
