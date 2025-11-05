const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let vfdData = {
  voltage: 0, current: 0, power: 0, freq: 0,
  energy: 0, freqSet: 50, freqActual: 0, status: "STOP"
};

// ESP32 gửi dữ liệu lên
app.post('/api/update', (req, res) => {
  vfdData = { ...vfdData, ...req.body };
  res.sendStatus(200);
});

// Web đọc dữ liệu
app.get('/api/data', (req, res) => {
  res.json(vfdData);
});

// Web đặt tần số mới
app.post('/api/setFreq', (req, res) => {
  vfdData.freqSet = req.body.freq;
  res.sendStatus(200);
});

// Web nhấn RUN
app.post('/api/run', (req, res) => {
  vfdData.status = "RUN";
  res.sendStatus(200);
});

// Web nhấn STOP
app.post('/api/stop', (req, res) => {
  vfdData.status = "STOP";
  res.sendStatus(200);
});

// ESP32 đọc tần số và trạng thái
app.get('/api/freq', (req, res) => {
  res.json({ freq: vfdData.freqSet, status: vfdData.status });
});

app.listen(3000, () => console.log('🌐 Server chạy tại http://localhost:3000'));
