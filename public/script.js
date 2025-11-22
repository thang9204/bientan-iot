// --- Biểu đồ công suất ---
const ctx = document.getElementById('powerChart');
const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
gradient.addColorStop(0, 'rgba(37,99,235,0.6)');
gradient.addColorStop(1, 'rgba(37,99,235,0.1)');

const powerChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Công suất (W)',
      data: [],
      borderColor: '#2563eb',
      backgroundColor: gradient,
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointRadius: 0
    }]
  },
  options: {
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  }
});

// --- Gauge Meter ---
const gaugeOptions = {
  chart: { type: 'radialBar', offsetY: 0, sparkline: { enabled: true } },
  plotOptions: {
    radialBar: {
      startAngle: -140, endAngle: 140,
      hollow: { size: '70%' },
      track: { background: '#e5e7eb' },
      dataLabels: {
        name: { show: true, offsetY: -10, color: '#4b5563', fontSize: '14px' },
        value: { show: true, color: '#111827', fontSize: '28px', fontWeight: 'bold', formatter: val => `${val} Hz` }
      }
    }
  },
  colors: ['#10b981'],
  labels: ['Tần số'],
  series: [50]
};
const gaugeChart = new ApexCharts(document.querySelector("#gaugeChart"), gaugeOptions);
gaugeChart.render();

// --- Cập nhật dữ liệu ---
async function updateData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return;

    const data = await res.json();

    // Cập nhật text
    document.getElementById('voltage').innerText = data.voltage?.toFixed(1) ?? "--";
    document.getElementById('current').innerText = data.current?.toFixed(2) ?? "--";
    document.getElementById('power').innerText = data.power?.toFixed(0) ?? "--";
    document.getElementById('freqActual').innerText = data.freq?.toFixed(1) ?? "--";
    document.getElementById('freqSet').innerText = data.freqSet?.toFixed(1) ?? "--";
    document.getElementById('temperature').innerText = data.temperature?.toFixed(1) ?? "--";
    document.getElementById('status').innerText = data.status ?? "--";

    // LED trạng thái
    const led = document.getElementById('led');
    led.className = "w-6 h-6 rounded-full shadow-inner transition-all duration-300";

    if (data.status === "RUN_FWD")
      led.classList.add("bg-green-500", "animate-pulse");
    else if (data.status === "RUN_REV")
      led.classList.add("bg-yellow-500", "animate-pulse");
    else if (data.status === "STOP")
      led.classList.add("bg-red-500");
    else
      led.classList.add("bg-gray-400");

    // Gauge cập nhật
    gaugeChart.updateSeries([data.freq?.toFixed(1) ?? 0]);

    // Biểu đồ công suất
    powerChart.data.labels.push('');
    powerChart.data.datasets[0].data.push(data.power ?? 0);

    if (powerChart.data.labels.length > 20) {
      powerChart.data.labels.shift();
      powerChart.data.datasets[0].data.shift();
    }

    powerChart.update();

    // Cảnh báo dòng cao
    const currentCard = document.getElementById('cardCurrent');
    if (data.current > 10) {
      currentCard.classList.remove('bg-white');
      currentCard.classList.add('bg-red-100', 'shadow-lg');
    } else {
      currentCard.classList.remove('bg-red-100');
      currentCard.classList.add('bg-white');
    }

  } catch (err) {
    console.error("❌ Lỗi cập nhật dữ liệu:", err);
  }
}

// --- Điều khiển ---
document.getElementById('freqSlider').addEventListener('input', async e => {
  const value = parseFloat(e.target.value);
  document.getElementById('freqValue').innerText = value.toFixed(1);

  await fetch('/api/setFreq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ freq: value })
  });
});

document.getElementById('runFwdBtn').addEventListener('click', async () => {
  await fetch('/api/runFwd', { method: 'POST' });
});

document.getElementById('runRevBtn').addEventListener('click', async () => {
  await fetch('/api/runRev', { method: 'POST' });
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  await fetch('/api/stop', { method: 'POST' });
});

// Cập nhật mỗi 2 giây
setInterval(updateData, 2000);

// Hiển thị tên người dùng
const username = localStorage.getItem('username') || 'Người dùng';
document.getElementById('userDisplay').innerText = `👤 ${username}`;

// Đăng xuất
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm("Bạn có chắc muốn đăng xuất không?")) {
    localStorage.removeItem('auth');
    localStorage.removeItem('username');
    window.location.href = "/login.html";
  }
});
