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

// ❗ Static files đặt trước, để login.html load bình thường
app.use(express.static(path.join(__dirname, "public")));

// Middleware yêu cầu đăng nhập
function requireLogin(req, res, next) {
  if (!req.session.loggedIn) return res.redirect("/login.html");
  next();
}

// API login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "thang" && password === "9204") {
    req.session.loggedIn = true;
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({
    ok: false,
    message: "❌ Sai thông tin đăng nhập!"
  });
});

// Chặn truy cập vào index.html
app.get("/", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== API VFD ======

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

app.post("/api/update", (req, res) => {
  vfdData = { ...vfdData, ...req.body };
  res.sendStatus(200);
});

app.get("/api/data", requireLogin, (req, res) => res.json(vfdData));

app.post("/api/setFreq", requireLogin, (req, res) => {
  vfdData.freqSet = req.body.freq;
  res.sendStatus(200);
});

app.post("/api/runFwd", requireLogin, (req, res) => {
  vfdData.status = "RUN_FWD";
  res.sendStatus(200);
});

app.post("/api/runRev", requireLogin, (req, res) => {
  vfdData.status = "RUN_REV";
  res.sendStatus(200);
});

app.post("/api/stop", requireLogin, (req, res) => {
  vfdData.status = "STOP";
  res.sendStatus(200);
});

app.get("/api/freq", requireLogin, (req, res) => {
  res.json({ freq: vfdData.freqSet, status: vfdData.status });
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌐 Server chạy tại PORT ${PORT}`)
);
