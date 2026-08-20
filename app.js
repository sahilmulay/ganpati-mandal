/* Set FINANCIAL_PIN_HASH and optional cloud adapter values before sharing externally. */
const FINANCIAL_PIN_HASH = '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab'; // SHA-256 hash of '2026'

const CLOUD_CONFIG = {
  url: 'https://wrvvnqanjtrmmltoaxvg.supabase.co',
  publishableKey: 'sb_publishable_1isjm1Z4wAtnI0pdzGpmIg_Yc0Q7KSw'
};
const cloud = window.supabase?.createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.publishableKey);

/* Security Helper: HTML Escaping for XSS Prevention */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* Security Helper: SHA-256 Hash for Financial PIN Verification */
async function hashPin(pin) {
  const msgUint8 = new TextEncoder().encode(String(pin).trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Security Helper: Image Compression to prevent localStorage quota crash */
function compressImage(file, maxDimension = 1000, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) return resolve('');
    let reader = new FileReader();
    reader.onload = e => {
      let img = new Image();
      img.onload = () => {
        let canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        canvas.width = w;
        canvas.height = h;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve('');
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

const rupees = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const today = new Date().toISOString().slice(0, 10);

const seed = {
  donations: [
    { id: 'd23758', name: 'Patil Family', phone: '9876543210', amount: 5100, date: today, mode: 'UPI', note: 'Ganpati Sthapana' },
    { id: 'd23759', name: 'Ramesh Kulkarni', phone: '9876543211', amount: 2100, date: '2026-08-17', mode: 'Cash', note: '' },
    { id: 'd23760', name: 'A-204 Joshi Family', phone: '', amount: 1100, date: '2026-08-16', mode: 'UPI', note: '' },
    { id: 'd23761', name: 'Sharma Family', phone: '9876543213', amount: 2500, date: '2026-08-15', mode: 'Bank Transfer', note: '' }
  ],
  expenses: [
    { id: 'e1', category: 'Decoration', description: 'Mandap flowers & lighting', amount: 3200, paidBy: 'S. Jadhav', date: today, image: '' },
    { id: 'e2', category: 'Pooja Material', description: 'Pooja samagri', amount: 1850, paidBy: 'A. Patil', date: '2026-08-17', image: '' },
    { id: 'e3', category: 'Sound System', description: 'Speaker rental advance', amount: 2500, paidBy: 'M. More', date: '2026-08-16', image: '' },
    { id: 'e4', category: 'Prasad', description: 'Modak ingredients', amount: 900, paidBy: 'S. Jadhav', date: '2026-08-16', image: '' }
  ],
  aartis: [
    { id: 'a1', date: today, type: 'Morning', person: 'Sahil Mulay', time: '09:00', note: '' },
    { id: 'a2', date: today, type: 'Morning', person: 'Ayush Desai', time: '09:00', note: '' },
    { id: 'a3', date: today, type: 'Evening', person: 'Kulkarni Family', time: '20:00', note: '' },
    { id: 'a4', date: '2026-08-21', type: 'Morning', person: 'Joshi Family', time: '09:00', note: '' },
    { id: 'a5', date: '2026-08-21', type: 'Evening', person: 'Sharma Family', time: '20:00', note: '' }
  ],
  events: [
    { id: 'v1', title: 'भजन संध्या', date: '2026-08-20T20:00', description: 'सर्व भाविकांसाठी भक्तिमय भजन कार्यक्रम.', image: '' },
    { id: 'v2', title: 'महाप्रसाद वितरण', date: '2026-08-22T13:00', description: 'दुपारी १ वाजता महाप्रसाद.', image: '' },
    { id: 'v3', title: 'Committee Meeting', date: '2026-08-21T21:00', description: 'Visarjan route finalisation.', image: '' }
  ],
  contacts: [
    { id: 'c1', name: 'Sanjay Jadhav', role: 'President', phone: '9876543210' },
    { id: 'c2', name: 'Anita Patil', role: 'Treasurer', phone: '9876543211' },
    { id: 'c3', name: 'Mahesh More', role: 'Secretary', phone: '9876543212' },
    { id: 'c4', name: 'Neha Kulkarni', role: 'Event Coordinator', phone: '9876543213' }
  ]
};

let db = JSON.parse(localStorage.getItem('ganesh-mandal-data') || 'null') || seed;
db.aartis.forEach(a => a.time = a.type === 'Morning' ? '09:00' : '20:00');

/* Multi-Page Route Detection */
function detectCurrentPage() {
  let path = (window.location.pathname || '').split('/').pop().toLowerCase();
  if (path.includes('donations')) return 'donations';
  if (path.includes('expenses')) return 'expenses';
  if (path.includes('aarti')) return 'aarti';
  if (path.includes('events')) return 'events';
  if (path.includes('contacts')) return 'contacts';
  if (path.includes('reports')) return 'reports';
  return 'dashboard';
}

let pageName = detectCurrentPage();
let editing = null;
let aartiFilter = 'all';
let currentMsgType = 'Morning';
let currentMsgDate = today;

const tableName = { donation: 'donations', expense: 'expenses', aarti: 'aartis', event: 'events', contact: 'contacts' };
const listName = { donation: 'donations', expense: 'expenses', aarti: 'aartis', event: 'events', contact: 'contacts' };

function fromCloud(type, row) {
  if (type === 'expense') return { ...row, paidBy: row.paid_by, image: row.image_url };
  if (type === 'event') return { ...row, image: row.image_url };
  return row;
}

function toCloud(type, row) {
  let copy = { ...row };
  delete copy.id;
  delete copy.image;
  if (type === 'expense') {
    copy.paid_by = copy.paidBy;
    copy.image_url = row.image || '';
    delete copy.paidBy;
  }
  if (type === 'event') {
    copy.image_url = row.image || '';
  }
  delete copy.created_at;
  return copy;
}

async function loadCloud() {
  if (!cloud) return;
  try {
    let types = Object.keys(tableName);
    let results = await Promise.all(types.map(type => cloud.from(tableName[type]).select('*')));
    if (results.some(r => r.error)) throw results.find(r => r.error).error;
    types.forEach((type, index) => db[listName[type]] = results[index].data.map(row => fromCloud(type, row)));
    localStorage.setItem('ganesh-mandal-data', JSON.stringify(db));
    render();
  } catch (error) {
    console.warn('Cloud data unavailable:', error.message);
  }
}

function subscribeCloud() {
  if (!cloud) return;
  cloud.channel('mandal-live-updates').on('postgres_changes', { event: '*', schema: 'public' }, () => loadCloud()).subscribe();
}

function save() {
  localStorage.setItem('ganesh-mandal-data', JSON.stringify(db));
  window.dispatchEvent(new Event('storage'));
}

window.addEventListener('storage', () => {
  const d = localStorage.getItem('ganesh-mandal-data');
  if (d) {
    db = JSON.parse(d);
    render();
  }
});

const nav = [
  ['dashboard.html', 'dashboard', '⌂', 'Dashboard'],
  ['donations.html', 'donations', '₹', 'Donations'],
  ['expenses.html', 'expenses', '◫', 'Expenses'],
  ['aarti.html', 'aarti', '☀', 'Aarti Timetable'],
  ['events.html', 'events', '✦', 'Events & Notices'],
  ['contacts.html', 'contacts', '☏', 'Committee Contacts'],
  ['reports.html', 'reports', '▥', 'Reports']
];

function renderNav() {
  let activeId = detectCurrentPage();
  const make = ([url, id, icon, label]) => `
    <a href="${url}" class="nav-item ${activeId === id ? 'active' : ''}">
      <i>${icon}</i><span>${label}</span>
    </a>
  `;
  let desktopNav = navEl('nav');
  if (desktopNav) desktopNav.innerHTML = nav.map(make).join('');

  let mobileNav = navEl('mobileNav');
  if (mobileNav) mobileNav.innerHTML = nav.slice(0, 5).map(make).join('');
}

function navEl(id) { return document.getElementById(id); }

function go(url) {
  window.location.href = url;
}

function sum(list) { return list.reduce((a, x) => a + Number(x.amount || 0), 0); }

function dateLabel(d) {
  if (!d) return '';
  return new Date(d + 'T12:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function shell(title, sub, body, action = '') {
  return `<div class="page-wrap"><div class="page-heading"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(sub)}</p></div>${action}</div>${body}<div class="footer">वृंदावन कला, क्रीडा व सांस्कृतिक मंडळ Manager</div></div>`;
}

function render() {
  renderNav();
  pageName = detectCurrentPage();
  let p = { dashboard, donations, expenses, aarti, events, contacts, reports }[pageName] || dashboard;
  let target = document.getElementById('page');
  if (target) target.innerHTML = p();
}

/* Dashboard Page */
function dashboard() {
  let inc = sum(db.donations), exp = sum(db.expenses);
  let allAartis = [...db.aartis].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let up = db.events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  return shell(
    'नमस्कार, वृंदावन कला क्रीडा व सांस्कृतिक मंडळ परिवार!',
    'आजची माहिती आणि झटपट कामे',
    `<section class="welcome">
      <h2>॥ श्री गणेशाय नमः ॥</h2>
      <p>सेवा, श्रद्धा आणि एकतेने आपला उत्सव सुंदर करूया.</p>
    </section>
    <section class="stats">
      ${stat('Total Collection', '↗', rupees(inc), 'income')}
      ${stat('Total Expenses', '↘', rupees(exp), 'expense')}
      ${stat('Available Balance', '◈', rupees(inc - exp), 'balance')}
    </section>
    <section class="content-grid">
      <div>
        <div class="card">
          <div class="card-title">
            <h3>आरती वेळापत्रक (Aarti Timetable)</h3>
            <button class="text-link" onclick="go('aarti.html')">View timetable →</button>
          </div>
          ${allAartis.length ? allAartis.map(aartiSmall).join('') : '<div class="empty"><div class="empty-icon">🪔</div>आरती नोंदलेली नाही.</div>'}
        </div>
        <div class="quick-actions">
          <button class="quick-btn" onclick="openForm('donation')"><span>₹</span>Add Donation</button>
          <button class="quick-btn" onclick="openForm('expense')"><span>◫</span>Add Expense</button>
          <button class="quick-btn" onclick="openForm('aarti')"><span>🪔</span>Add Aarti</button>
          <button class="quick-btn highlight-quick" onclick="openPaymentQR()"><span>▣</span>Collect QR</button>
          <button class="quick-btn" onclick="openAartiMessageModal()"><span>💬</span>WhatsApp Message</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>Upcoming notices</h3>
          <button class="text-link" onclick="go('events.html')">View all →</button>
        </div>
        ${up.map(eventSmall).join('')}
      </div>
    </section>`
  );
}

function stat(label, icon, value, cl) {
  return `<div class="stat-card ${cl}"><div class="stat-head"><span>${escapeHtml(label)}</span><span class="stat-icon">${icon}</span></div><div class="money">${value}</div></div>`;
}

function aartiSmall(a) {
  let isToday = a.date === today;
  return `
    <div class="aarti-row">
      <div class="aarti-time">${time12(a.time)}</div>
      <div class="aarti-info">
        <strong>${escapeHtml(a.person)} ${isToday ? '<span class="tag morning">TODAY</span>' : `<span class="date-tag">${dateLabel(a.date)}</span>`}</strong>
        <span>${escapeHtml(a.note || (a.type + ' Aarti'))}</span>
      </div>
      <span class="tag ${a.type.toLowerCase()}">${escapeHtml(a.type)}</span>
    </div>
  `;
}

function eventSmall(e) {
  let d = new Date(e.date);
  return `<div class="announcement"><div class="ann-date"><b>${d.getDate()}</b>${d.toLocaleString('en', { month: 'short' }).toUpperCase()}</div><div class="ann-copy"><strong>${escapeHtml(e.title)}</strong><p>${escapeHtml(e.description)}</p></div></div>`;
}

function tableWrap(h) {
  return `<div class="table-scroll"><table class="data-table">${h}</table></div>`;
}

/* Marathi Date Formatters */
function marathiMonthName(m) {
  const months = ['', 'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
  return months[Number(m)] || '';
}

function marathiDayName(dateStr) {
  const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const d = new Date(dateStr + 'T12:00:00');
  return days[d.getDay()];
}

function dateLabelInMarathi(dStr) {
  if (!dStr) return '';
  let [y, m, d] = dStr.split('-');
  return `${Number(d)} ${marathiMonthName(m)} ${y}`;
}

function dateFullInMarathi(dStr) {
  if (!dStr) return '';
  let [y, m, d] = dStr.split('-');
  return `दिनांक ${Number(d)} ${marathiMonthName(m)} (${marathiDayName(dStr)})`;
}

/* Marathi Number to Words Converter */
function numberToMarathiWords(n) {
  n = Math.floor(Number(n) || 0);
  if (n <= 0) return 'शून्य रुपये मात्र';

  const units = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'];
  const tens = ['', 'दहा', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
  const teens = {
    11: 'अकरा', 12: 'बारा', 13: 'तेरा', 14: 'चौदा', 15: 'पंधरा', 16: 'सोळा', 17: 'सतरा', 18: 'अठरा', 19: 'एकोणीस',
    20: 'वीस', 21: 'एकवीस', 22: 'बावीस', 23: 'तेवीस', 24: 'चौवीस', 25: 'पंचवीस', 26: 'सव्वीस', 27: 'सत्तावीस', 28: 'अठ्ठावीस', 29: 'एकोणतीस',
    30: 'तीस', 31: 'एकतीस', 32: 'बत्तीस', 33: 'तेत्तीस', 34: 'चौतीस', 35: 'पस्तीस', 36: 'छत्तीस', 37: 'साडेतीस', 38: 'अडतीस', 39: 'एकोणचाळीस',
    40: 'चाळीस', 41: 'एकचाळीस', 42: 'बेचाळीस', 43: 'त्रेशेचाळीस', 44: 'चौचाळीस', 45: 'पंचेचाळीस', 46: 'सहाचाळीस', 47: 'सतचाळीस', 48: 'अठ्ठाचाळीस', 49: 'एकोणपन्नास',
    50: 'पन्नास', 51: 'एकपन्नास', 52: 'बावन्न', 53: 'त्रिपन्न', 54: 'चौपन्न', 55: 'पन्नस', 56: 'छप्पन्न', 57: 'सत्तावन्न', 58: 'अठ्ठावन्न', 59: 'एकोणसाठ',
    60: 'साठ', 61: 'एकसाठ', 62: 'बासाठ', 63: 'त्रेषठ', 64: 'चौसठ', 65: 'पासठ', 66: 'सहासाठ', 67: 'सदुसष्ट', 68: 'अडसष्ट', 69: 'एकोणसत्तर',
    70: 'सत्तर', 71: 'एकहत्तर', 72: 'बाहत्तर', 73: 'त्र्याहत्तर', 74: 'चौऱ्याहत्तर', 75: 'पंचहत्तर', 76: 'शहात्तर', 77: 'सतहत्तर', 78: 'अठ्ठाहत्तर', 79: 'एकोणऐंशी',
    80: 'ऐंशी', 81: 'एक्यऐंशी', 82: 'ब्याऐंशी', 83: 'त्र्याऐंशी', 84: 'चौऱ्याऐंशी', 85: 'पंच्याऐंशी', 86: 'शहाऐंशी', 87: 'सतऐंशी', 88: 'अठ्ठाऐंशी', 89: 'एकोणनव्वद',
    90: 'नव्वद', 91: 'एक्याण्णव', 92: 'ब्याण्णव', 93: 'त्र्याण्णव', 94: 'चौऱ्याण्णव', 95: 'पंच्याण्णव', 96: 'शहाण्णव', 97: 'सतण्णव', 98: 'अठ्ठाण्णव', 99: 'नव्व्याण्णव'
  };

  function convertTwoDigits(num) {
    if (num === 0) return '';
    if (teens[num]) return teens[num];
    if (num < 10) return units[num];
    let t = Math.floor(num / 10), u = num % 10;
    return (tens[t] + (u ? ' ' + units[u] : '')).trim();
  }

  let parts = [];
  if (n >= 100000) {
    let lakh = Math.floor(n / 100000);
    parts.push(convertTwoDigits(lakh) + ' लाख');
    n %= 100000;
  }
  if (n >= 1000) {
    let hazar = Math.floor(n / 1000);
    parts.push(convertTwoDigits(hazar) + ' हजार');
    n %= 1000;
  }
  if (n >= 100) {
    let she = Math.floor(n / 100);
    if (she === 1) parts.push('एकशे');
    else parts.push(units[she] + 'शे');
    n %= 100;
  }
  if (n > 0) {
    parts.push(convertTwoDigits(n));
  }

  return parts.join(' ') + ' रुपये मात्र';
}

/* Category Circle Donut Chart */
function expensePie(groups) {
  let total = groups.reduce((s, g) => s + g[1], 0) || 1;
  let colors = ['#d95629', '#ee982e', '#8b4630', '#f2ba58', '#6f9270', '#b36a92', '#927c63'];
  let current = 0;
  let slices = groups.map((g, i) => {
    let start = current;
    current += (g[1] / total) * 360;
    return `${colors[i % colors.length]} ${start}deg ${current}deg`;
  }).join(',');

  return `<div class="pie-container">
    <div class="pie-chart-wrap">
      <div class="pie-donut" style="background: conic-gradient(${slices});">
        <div class="pie-hole">
          <strong>${rupees(total)}</strong>
          <span>Total Expense</span>
        </div>
      </div>
    </div>
    <div class="pie-legend-list">
      ${groups.map((g, i) => `
        <div class="legend-item">
          <span class="legend-color" style="background:${colors[i % colors.length]}"></span>
          <span class="legend-label">${escapeHtml(g[0])}</span>
          <span class="legend-val">${rupees(g[1])}</span>
          <span class="legend-pct">${Math.round((g[1] / total) * 100)}%</span>
        </div>
      `).join('')}
    </div>
  </div>`;
}

/* Expenses Page */
function expenses() {
  let cats = ['Decoration', 'Prasad', 'Sound System', 'Pooja Material', 'Electricity', 'Transport', 'Other'];
  let list = [...db.expenses].sort((a, b) => b.date.localeCompare(a.date));
  let total = sum(list);
  let groups = cats.map(c => [c, sum(list.filter(x => x.category === c))]).filter(x => x[1]);

  let rows = list.map(e => `
    <tr>
      <td>${dateLabel(e.date)}</td>
      <td>
        <div class="trans-info">
          <strong>${escapeHtml(e.description)}</strong>
          <span>${escapeHtml(e.category)}${e.image ? ' • 📎 Bill Attached' : ''}</span>
        </div>
      </td>
      <td>${escapeHtml(e.paidBy)}</td>
      <td class="amount expense-t">${rupees(e.amount)}</td>
      <td>
        ${e.image ? `<button class="text-link view-bill-btn" onclick="openBill('${e.image}')">👁 View Bill</button>` : '<span class="muted-dash">—</span>'}
      </td>
      <td><button class="table-action" onclick="guardEdit('expense','${e.id}')">•••</button></td>
    </tr>
  `).join('');

  let cards = list.map(e => `
    <article class="expense-card">
      <div class="expense-card-main">
        <span class="expense-meta">${dateLabel(e.date)} · ${escapeHtml(e.category)}</span>
        <strong>${escapeHtml(e.description)}</strong>
        <small>Paid by ${escapeHtml(e.paidBy)}</small>
      </div>
      <div class="expense-card-actions">
        <b class="amount expense-t">${rupees(e.amount)}</b>
        ${e.image ? `<button class="text-link view-bill-btn" onclick="openBill('${e.image}')">👁 View Bill</button>` : ''}
        <button class="table-action" onclick="guardEdit('expense','${e.id}')">•••</button>
      </div>
    </article>
  `).join('');

  return shell(
    'Expenses',
    'सर्व खर्चाची सोपी नोंद आणि माहिती',
    `<div class="layout-split">
      <div class="card">
        <div class="toolbar">
          <input class="search" placeholder="Search expense, person or category…" oninput="filterTable(this,'expenseRows')">
          <button class="primary-btn" onclick="openForm('expense')">+ Add Expense</button>
        </div>
        <div class="desktop-expenses">
          ${tableWrap(`<thead><tr><th>Date</th><th>Expense details</th><th>Paid by</th><th>Amount</th><th>Bill Photo</th><th></th></tr></thead><tbody id="expenseRows">${rows}</tbody>`)}
        </div>
        <div class="expense-mobile-list">
          ${cards || '<div class="empty">No expenses recorded yet</div>'}
        </div>
        <div class="summary-row">
          <span>Total Expenses</span>
          <b>${rupees(total)}</b>
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <h3>Category-wise Expenses</h3>
        </div>
        ${groups.length ? expensePie(groups) : '<div class="empty">No expenses recorded yet</div>'}
      </div>
    </div>`
  );
}

/* Donations Page */
function donations() {
  let total = sum(db.donations);
  let list = [...db.donations].sort((a, b) => b.date.localeCompare(a.date));

  let rows = list.map(d => `
    <tr>
      <td>${dateLabel(d.date)}</td>
      <td>
        <strong>${escapeHtml(d.name)}</strong>
        ${d.phone ? `<br><small class="phone-note">📱 ${escapeHtml(d.phone)}</small>` : ''}
      </td>
      <td><span class="tag morning">${escapeHtml(d.mode)}</span></td>
      <td class="amount income-t">${rupees(d.amount)}</td>
      <td>
        <button class="whatsapp-btn-sm" onclick="openReceiptModal('${d.id}')">💬 WhatsApp Receipt</button>
      </td>
      <td><button class="table-action" onclick="guardEdit('donation','${d.id}')">•••</button></td>
    </tr>
  `).join('');

  let cards = list.map(d => `
    <article class="donation-card">
      <div class="donation-card-info">
        <strong>${escapeHtml(d.name)}</strong>
        <span>${dateLabel(d.date)} · <span class="tag morning">${escapeHtml(d.mode)}</span>${d.phone ? ` · 📱 ${escapeHtml(d.phone)}` : ''}</span>
      </div>
      <div class="donation-card-right">
        <b class="amount income-t">${rupees(d.amount)}</b>
        <button class="whatsapp-btn-sm" onclick="openReceiptModal('${d.id}')">💬 WhatsApp</button>
        <button class="table-action" onclick="guardEdit('donation','${d.id}')">•••</button>
      </div>
    </article>
  `).join('');

  return shell(
    'Donations & Collections',
    'देणगी नोंदी आणि उपलब्ध शिल्लक',
    `<section class="stats">
      <div class="stat-card income">
        <div class="stat-head"><span>Total Collection</span><span class="stat-icon">↗</span></div>
        <div class="money">${rupees(total)}</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-head"><span>Total Expenses</span><span class="stat-icon">↘</span></div>
        <div class="money">${rupees(sum(db.expenses))}</div>
      </div>
      <div class="stat-card balance">
        <div class="stat-head"><span>Available Balance</span><span class="stat-icon">◈</span></div>
        <div class="money">${rupees(total - sum(db.expenses))}</div>
      </div>
    </section>
    <div class="card">
      <div class="toolbar">
        <input class="search" placeholder="Search donor or payment mode…" oninput="filterTable(this,'donationRows')">
        <button class="outline-btn qr-btn-main" onclick="openPaymentQR()">▣ Collect Payment (QR)</button>
        <button class="primary-btn" onclick="openForm('donation')">+ Add Donation</button>
      </div>
      <div class="desktop-donations">
        ${tableWrap(`<thead><tr><th>Date</th><th>Contributor</th><th>Mode</th><th>Amount</th><th>WhatsApp Receipt</th><th></th></tr></thead><tbody id="donationRows">${rows}</tbody>`)}
      </div>
      <div class="donation-mobile-list">
        ${cards || '<div class="empty">No donations recorded yet</div>'}
      </div>
    </div>`
  );
}

/* Aarti Timetable Page */
function aarti() {
  let list = [...db.aartis].filter(a => aartiFilter === 'all' || a.type === aartiFilter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return shell(
    'Aarti Timetable',
    'सकाळची आणि सायंकाळची आरती',
    `<div class="card">
      <div class="toolbar">
        <div class="section-tabs">
          <button class="tab ${aartiFilter === 'all' ? 'active' : ''}" onclick="setAartiFilter('all')">All upcoming</button>
          <button class="tab ${aartiFilter === 'Morning' ? 'active' : ''}" onclick="setAartiFilter('Morning')">Morning Aarti</button>
          <button class="tab ${aartiFilter === 'Evening' ? 'active' : ''}" onclick="setAartiFilter('Evening')">Evening Aarti</button>
        </div>
        <button class="primary-btn" onclick="openForm('aarti')">+ Add Aarti</button>
      </div>
      <div class="aarti-list">
        ${list.length ? list.map(a => `
          <div class="aarti-row">
            <div class="date-box"><b>${new Date(a.date + 'T12:00').getDate()}</b>${new Date(a.date + 'T12:00').toLocaleString('en', { month: 'short' })}</div>
            <div class="aarti-info">
              <strong>${escapeHtml(a.person)} ${a.date === today ? '<span class="tag morning">TODAY</span>' : ''}</strong>
              <span>${time12(a.time)}${a.note ? ' • ' + escapeHtml(a.note) : ''}</span>
            </div>
            <span class="tag ${a.type.toLowerCase()}">${escapeHtml(a.type)}</span>
            <button class="whatsapp-btn-sm" onclick="openAartiMessageModal('${a.date}', '${a.type}')">💬 WhatsApp</button>
            <button class="table-action" onclick="editItem('aarti','${a.id}')">•••</button>
          </div>
        `).join('') : '<div class="empty"><div class="empty-icon">🪔</div>या प्रकारची आरती नोंदलेली नाही.</div>'}
      </div>
    </div>`
  );
}

function setAartiFilter(filter) { aartiFilter = filter; render(); }

/* Events Page */
function events() {
  return shell(
    'Events & Announcements',
    'मंडळाच्या कार्यक्रमांची माहिती',
    `<div class="toolbar">
      <input class="search" placeholder="Search notices…" oninput="filterCards(this,'eventCards')">
      <button class="primary-btn" onclick="openForm('event')">+ Add Announcement</button>
    </div>
    <div class="contacts" id="eventCards">
      ${db.events.sort((a, b) => a.date.localeCompare(b.date)).map(e => `
        <article class="contact">
          <div class="ann-date"><b>${new Date(e.date).getDate()}</b>${new Date(e.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</div>
          <div style="flex:1">
            <strong>${escapeHtml(e.title)}</strong>
            <span>${new Date(e.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span>${escapeHtml(e.description)}</span>
          </div>
          <button class="table-action" onclick="editItem('event','${e.id}')">•••</button>
        </article>
      `).join('') || '<div class="empty">No announcements yet</div>'}
    </div>`
  );
}

/* Contacts Page */
function contacts() {
  return shell(
    'Committee Contacts',
    'महत्वाच्या सदस्यांशी थेट संपर्क',
    `<div class="toolbar"><button class="primary-btn" onclick="openForm('contact')">+ Add Contact</button></div>
    <div class="contacts">
      ${db.contacts.map(c => `
        <article class="contact">
          <div class="contact-avatar">${escapeHtml(c.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</div>
          <div>
            <strong>${escapeHtml(c.name)}</strong>
            <span>${escapeHtml(c.role)}</span>
            <a href="tel:${escapeHtml(c.phone)}">☎ ${escapeHtml(c.phone)}</a>
          </div>
        </article>
      `).join('')}
    </div>`
  );
}

/* Reports Page */
function reports() {
  let inc = sum(db.donations), exp = sum(db.expenses), cats = {};
  db.expenses.forEach(e => cats[e.category] = (cats[e.category] || 0) + Number(e.amount));
  return shell(
    'Financial Reports',
    'देणगी आणि खर्चाचा स्पष्ट आढावा',
    `<div class="toolbar">
      <input class="filter" type="date" value="2026-08-01">
      <input class="filter" type="date" value="${today}">
      <button class="outline-btn" onclick="exportCSV()">↓ Export CSV</button>
      <button class="primary-btn" onclick="window.print()">Print / PDF</button>
    </div>
    <div class="card">
      <div class="report-totals">
        <div class="report-total"><span>Total Collection</span><b>${rupees(inc)}</b></div>
        <div class="report-total"><span>Total Expenses</span><b>${rupees(exp)}</b></div>
        <div class="report-total"><span>Available Balance</span><b>${rupees(inc - exp)}</b></div>
      </div>
    </div>
    <div class="layout-split" style="margin-top:17px">
      <div class="card">
        <div class="card-title"><h3>Recent Transactions</h3></div>
        ${tableWrap(`<thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead><tbody>${[...db.donations.map(x => ({ ...x, type: 'Donation', description: x.name, sign: 1 })), ...db.expenses.map(x => ({ ...x, type: 'Expense', description: x.description, sign: -1 }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(x => `<tr><td>${dateLabel(x.date)}</td><td><span class="tag ${x.sign > 0 ? 'morning' : 'evening'}">${escapeHtml(x.type)}</span></td><td>${escapeHtml(x.description)}</td><td class="amount ${x.sign > 0 ? 'income-t' : 'expense-t'}">${x.sign > 0 ? '+' : '−'}${rupees(x.amount)}</td></tr>`).join('')}</tbody>`)}
      </div>
      <div class="card">
        <div class="card-title"><h3>Expense Categories</h3></div>
        ${Object.entries(cats).map(([k, v]) => `<div class="summary-row"><span>${escapeHtml(k)}</span><b>${rupees(v)}</b></div>`).join('')}
      </div>
    </div>`
  );
}

function time12(t) {
  if (!t) return '';
  let [h, m] = t.split(':');
  return `${((+h + 11) % 12 + 1)}:${m} ${+h >= 12 ? 'PM' : 'AM'}`;
}

/* Modals & Forms */
function modal(title, body) {
  let modalEl = document.getElementById('modal');
  if (!modalEl) return;
  modalEl.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>${escapeHtml(title)}</h3>
        <button class="close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">${body}</div>
    </div>
  `;

  if (title.includes('Aarti')) {
    let timeField = [...document.querySelectorAll('#modal .field')].find(f => f.querySelector('label')?.textContent === 'Time');
    if (timeField) {
      timeField.remove();
      let type = document.querySelector('#modal select[name="type"]');
      if (type) type.insertAdjacentHTML('afterend', '<p class="fixed-time-note">Fixed timings: Morning 9:00 AM · Evening 8:00 PM</p>');
    }
  }

  modalEl.classList.add('open');
}

function closeModal() {
  let modalEl = document.getElementById('modal');
  if (modalEl) modalEl.classList.remove('open');
}

function previewBillInput(input) {
  let file = input.files && input.files[0];
  if (!file) return;
  compressImage(file, 1000, 0.75).then(compressedUrl => {
    let container = document.getElementById('billFormPreview');
    if (container && compressedUrl) {
      container.innerHTML = `
        <div class="bill-preview-box">
          <img src="${compressedUrl}" alt="Bill preview">
          <button type="button" class="text-link" onclick="openBill('${compressedUrl}')">👁 View Full Photo</button>
        </div>
      `;
    }
  });
}

function openForm(type, item = null) {
  let x = item || {};
  let fields = {
    donation: `
      <div class="field full"><label>Donor / contributor name</label><input name="name" required value="${escapeHtml(x.name || '')}" placeholder="e.g. Patil Family"></div>
      <div class="field"><label>Amount (₹)</label><input name="amount" type="number" required value="${x.amount || ''}" placeholder="0"></div>
      <div class="field"><label>WhatsApp Number (optional)</label><input name="phone" inputmode="tel" value="${escapeHtml(x.phone || '')}" placeholder="e.g. 9876543210"></div>
      <div class="field"><label>Date</label><input name="date" type="date" value="${x.date || today}"></div>
      <div class="field"><label>Payment mode</label><select name="mode">${['UPI', 'Cash', 'Bank Transfer', 'Other'].map(v => `<option ${x.mode === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field full"><label>Optional note</label><textarea name="note" placeholder="Add a note…">${escapeHtml(x.note || '')}</textarea></div>
    `,
    expense: `
      <div class="field"><label>Expense category</label><select name="category">${['Decoration', 'Prasad', 'Sound System', 'Pooja Material', 'Electricity', 'Transport', 'Other'].map(v => `<option ${x.category === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Amount (₹)</label><input name="amount" type="number" required value="${x.amount || ''}" placeholder="0"></div>
      <div class="field full"><label>Description</label><input name="description" required value="${escapeHtml(x.description || '')}" placeholder="What was this expense for?"></div>
      <div class="field"><label>Paid by</label><input name="paidBy" required value="${escapeHtml(x.paidBy || '')}" placeholder="Name"></div>
      <div class="field"><label>Date</label><input name="date" type="date" value="${x.date || today}"></div>
      <div class="field full"><label>Bill photo (optional)</label><input name="image" type="file" accept="image/*" onchange="previewBillInput(this)"></div>
      <div class="field full" id="billFormPreview">
        ${x.image ? `<div class="bill-preview-box"><img src="${x.image}" alt="Attached bill"><button type="button" class="text-link" onclick="openBill('${x.image}')">👁 View Full Photo</button></div>` : ''}
      </div>
    `,
    aarti: `
      <div class="field"><label>Date</label><input name="date" type="date" value="${x.date || today}"></div>
      <div class="field"><label>Aarti type</label><select name="type"><option ${x.type === 'Morning' ? 'selected' : ''}>Morning</option><option ${x.type === 'Evening' ? 'selected' : ''}>Evening</option></select></div>
      <div class="field"><label>Person / family</label><input name="person" required value="${escapeHtml(x.person || '')}" placeholder="e.g. Patil Family"></div>
      <div class="field"><label>Time</label><input name="time" type="time" value="${x.time || '08:00'}"></div>
      <div class="field full"><label>Optional custom note</label><textarea name="note">${escapeHtml(x.note || '')}</textarea></div>
    `,
    event: `
      <div class="field full"><label>Title</label><input name="title" required value="${escapeHtml(x.title || '')}" placeholder="e.g. Bhajan program"></div>
      <div class="field full"><label>Date & time</label><input name="date" type="datetime-local" value="${x.date || today + 'T19:00'}"></div>
      <div class="field full"><label>Description</label><textarea name="description" required>${escapeHtml(x.description || '')}</textarea></div>
      <div class="field full"><label>Event image (optional)</label><input name="image" type="file" accept="image/*"></div>
    `,
    contact: `
      <div class="field full"><label>Name</label><input name="name" required value="${escapeHtml(x.name || '')}"></div>
      <div class="field"><label>Role / designation</label><input name="role" required value="${escapeHtml(x.role || '')}"></div>
      <div class="field"><label>Phone number</label><input name="phone" required inputmode="tel" value="${escapeHtml(x.phone || '')}"></div>
    `
  }[type];

  let extraActions = type === 'donation' ? `<button type="button" class="outline-btn qr-inline" onclick="openPaymentQR()">▣ Show Payment QR</button>` : '';

  modal(
    (item ? 'Edit ' : 'Add ') + type.charAt(0).toUpperCase() + type.slice(1),
    `<form onsubmit="submitForm(event,'${type}','${x.id || ''}')">
      <div class="form-grid">${fields}</div>
      <div class="modal-actions">
        ${extraActions}
        <button type="button" class="outline-btn" onclick="closeModal()">Cancel</button>
        <button class="primary-btn">Save ${item ? 'changes' : ''}</button>
      </div>
    </form>`
  );
}

async function submitForm(ev, type, id) {
  ev.preventDefault();
  let f = new FormData(ev.target), o = Object.fromEntries(f.entries());
  if (type === 'aarti') o.time = o.type === 'Morning' ? '09:00' : '20:00';
  if (['donation', 'expense'].includes(type)) o.amount = Number(o.amount);
  
  let file = f.get('image');
  if (file && file.size && file.type.startsWith('image/')) {
    o.image = await compressImage(file, 1000, 0.75);
    saveItem(type, id, o);
  } else {
    saveItem(type, id, o);
  }
}

async function saveItem(type, id, o) {
  let list = db[listName[type]];
  let index = id ? list.findIndex(x => String(x.id) === String(id)) : -1;
  if (id) {
    o.id = id;
    o.image = o.image || (list[index] && list[index].image) || '';
    list[index] = o;
  } else {
    o.id = type[0] + (Date.now().toString().slice(-5));
    list.unshift(o);
  }
  save();
  closeModal();
  toast('Saved successfully');

  if (type === 'donation') {
    setTimeout(() => openReceiptModal(o.id), 300);
  }

  if (!cloud) return;
  let isCloudId = id && String(id).includes('-');
  let payload = toCloud(type, o);
  let query = isCloudId ? cloud.from(tableName[type]).update(payload).eq('id', id).select().single() : cloud.from(tableName[type]).insert(payload).select().single();
  let { data, error } = await query;

  // Smart retry: if 'phone' column hasn't been added to Supabase donations table yet, retry without 'phone'
  if (error && error.code === 'PGRST204' && type === 'donation' && 'phone' in payload) {
    delete payload.phone;
    let retryQuery = isCloudId ? cloud.from(tableName[type]).update(payload).eq('id', id).select().single() : cloud.from(tableName[type]).insert(payload).select().single();
    let res = await retryQuery;
    data = res.data;
    error = res.error;
  }

  if (error) {
    toast('Saved locally, but cloud sync failed.');
    console.warn('Supabase Error:', error);
    return;
  }
  let updated = fromCloud(type, data);
  let localIndex = list.findIndex(x => String(x.id) === String(o.id));
  if (localIndex >= 0) list[localIndex] = updated;
  save();
}

function guardEdit(type, id) {
  editing = { type, id };
  modal('Financial PIN Required', `<div class="pin-art">🔐</div><p class="pin-note">Enter the shared financial PIN to edit or delete this entry.</p><form onsubmit="checkPin(event)"><div class="field"><input class="pin-input" name="pin" type="password" inputmode="numeric" maxlength="4" autofocus placeholder="••••"></div><div class="modal-actions"><button class="primary-btn">Continue</button></div></form>`);
}

async function checkPin(e) {
  e.preventDefault();
  let enteredPin = new FormData(e.target).get('pin');
  let enteredHash = await hashPin(enteredPin);
  if (enteredHash === FINANCIAL_PIN_HASH) {
    let { type, id } = editing;
    closeModal();
    manageFinancial(type, id);
  } else {
    toast('Incorrect PIN. Please try again.');
  }
}

function manageFinancial(type, id) {
  modal('Manage financial entry', `<p class="delete-text">The financial PIN has been verified. You can now edit or remove this ${type} entry.</p><div class="modal-actions"><button class="outline-btn" onclick="openForm('${type}',getItem('${type}','${id}'))">Edit</button><button class="primary-btn" onclick="confirmDelete('${type}','${id}')">Delete</button></div>`);
}

function editItem(type, id) {
  let list = getItemList(type);
  let x = list.find(i => String(i.id) === String(id));
  if (type === 'donation' || type === 'expense') return manageFinancial(type, id);
  modal('Manage entry', `<p class="delete-text">Edit or remove this ${type} entry.</p><div class="modal-actions"><button class="outline-btn" onclick="openForm('${type}',getItem('${type}','${id}'))">Edit</button><button class="primary-btn" onclick="confirmDelete('${type}','${id}')">Delete</button></div>`);
}

function getItemList(type) {
  return { donation: db.donations, expense: db.expenses, aarti: db.aartis, event: db.events, contact: db.contacts }[type];
}

function getItem(type, id) {
  return getItemList(type).find(x => String(x.id) === String(id));
}

function confirmDelete(type, id) {
  modal('Delete entry?', `<p class="delete-text">This cannot be undone. Are you sure you want to delete this entry?</p><div class="modal-actions"><button class="outline-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="deleteItem('${type}','${id}')">Yes, Delete</button></div>`);
}

async function deleteItem(type, id) {
  let key = listName[type];
  db[key] = db[key].filter(x => String(x.id) !== String(id));
  save();
  closeModal();
  toast('Entry deleted');
  if (cloud && String(id).includes('-')) {
    let { error } = await cloud.from(tableName[type]).delete().eq('id', id);
    if (error) {
      toast('Cloud delete failed.');
      console.warn(error);
    }
  }
}

/* Payment QR Modal */
function openPaymentQR() {
  modal('Scan to Pay', `
    <div class="payment-qr">
      <img src="assets/payment-qr.png" alt="UPI payment QR code">
      <strong>Sahil Mulay</strong>
      <span class="upi-id-box">UPI ID: <b>sahilamulay-1@oksbi</b></span>
      <p>Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM) to donate.</p>
      <div class="modal-actions" style="justify-content:center; margin-top:14px;">
        <button class="outline-btn" onclick="navigator.clipboard.writeText('sahilamulay-1@oksbi');toast('UPI ID copied to clipboard!')">📋 Copy UPI ID</button>
        <button class="primary-btn" onclick="openForm('donation')">₹ Enter Donation</button>
      </div>
    </div>
  `);
}

function openBill(image) {
  if (!image) {
    toast('No bill photo attached');
    return;
  }
  modal('Bill Photo', `
    <div class="bill-modal-content">
      <img class="bill-preview" src="${image}" alt="Expense bill photo">
      <div class="modal-actions">
        <a class="primary-btn" href="${image}" download="expense-bill.jpg" target="_blank">Download Photo</a>
      </div>
    </div>
  `);
}

/* Digital Pavati HTML5 Canvas Image Generator */
function generateReceiptCanvas(d) {
  return new Promise((resolve) => {
    let img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let canvas = document.createElement('canvas');
      canvas.width = img.width;   // 920
      canvas.height = img.height; // 510
      let ctx = canvas.getContext('2d');

      // Draw background template image
      ctx.drawImage(img, 0, 0);

      let receiptNo = String(d.id).replace(/\D/g, '').slice(-5) || '23758';
      let dateStr = dateLabelInMarathi(d.date) || d.date;
      let nameStr = d.name || '';
      let amountStr = (d.amount || 0) + '/-';
      let wordsStr = (numberToMarathiWords(d.amount) || '') + ' फक्त';

      ctx.fillStyle = '#6b0d0d'; // Traditional Maroon color
      ctx.textBaseline = 'middle';

      // 1. Receipt No ( पावती क्र. )
      ctx.font = 'bold 20px "Noto Sans Devanagari", sans-serif';
      ctx.fillText(receiptNo, 440, 256);

      // 2. Date ( दिनांक )
      ctx.font = 'bold 18px "Noto Sans Devanagari", sans-serif';
      ctx.fillText(dateStr, 755, 256);

      // 3. Name ( श्री. )
      ctx.font = 'bold 22px "Noto Sans Devanagari", sans-serif';
      ctx.fillText(nameStr, 200, 306);

      // 4. Amount figures ( देणगी रक्कम अंकी )
      ctx.font = 'bold 22px "Noto Sans Devanagari", sans-serif';
      ctx.fillText(amountStr, 500, 356);

      // 5. Amount words ( देणगी रक्कम अक्षरी )
      ctx.font = 'bold 18px "Noto Sans Devanagari", sans-serif';
      ctx.fillText(wordsStr, 200, 408);

      // 6. Bottom Box ( रु. Box )
      ctx.font = 'bold 20px "Noto Sans Devanagari", sans-serif';
      ctx.fillText('रु. ' + amountStr, 60, 492);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = 'assets/receipt-template.jpg';
  });
}

/* WhatsApp Text Donation Receipt Generator */
function receiptText(d) {
  let receiptNo = String(d.id).replace(/\D/g, '').slice(-5) || '23758';
  return `॥ श्री गणेशाय नमः ॥\n\n*वृंदावन कला, क्रीडा व सांस्कृतिक मंडळ*\n\n*देणगी पावती क्र.:* ${receiptNo}\n*श्री/श्रीमती:* ${d.name}\n*रक्कम:* ${rupees(d.amount)}/-\n*अक्षरी:* ${numberToMarathiWords(d.amount)}\n*दिनांक:* ${dateLabelInMarathi(d.date)}\n\nआपल्या देणगीबद्दल मनःपूर्वक धन्यवाद!\n\n🙏 *वृंदावन कला, क्रीडा व सांस्कृतिक मंडळ* 🙏`;
}

function getWhatsAppReceiptUrl(d) {
  let phone = (d.phone || '').replace(/\D/g, '');
  if (phone && phone.length === 10) phone = '91' + phone;
  let text = encodeURIComponent(receiptText(d));
  return phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
}

function copyReceiptText(id) {
  let d = db.donations.find(x => String(x.id) === String(id));
  if (!d) return;
  navigator.clipboard.writeText(receiptText(d));
  toast('Receipt copied!');
}

async function openReceiptModal(id) {
  let d = db.donations.find(x => String(x.id) === String(id));
  if (!d) return;
  let text = receiptText(d);
  let waUrl = getWhatsAppReceiptUrl(d);
  let canvasDataUrl = await generateReceiptCanvas(d);

  modal(
    'Digital Donation Receipt (पावती)',
    `<div class="receipt-modal-wrap">
      ${canvasDataUrl ? `<div style="text-align:center; margin-bottom:12px;"><img src="${canvasDataUrl}" alt="Digital Pavati" style="max-width:100%; border-radius:10px; border:1px solid #e0cdbc; box-shadow:0 4px 15px rgba(0,0,0,0.08);"></div>` : ''}
      <div class="message-preview">${escapeHtml(text)}</div>
      <div class="modal-actions">
        ${canvasDataUrl ? `<a href="${canvasDataUrl}" download="pavati-${d.name.replace(/\s+/g, '_')}.png" class="outline-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">🖼️ Download Pavati Image</a>` : ''}
        <button class="outline-btn" onclick="copyReceiptText('${d.id}')">📋 Copy Text</button>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="primary-btn whatsapp-action-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px;">💬 Send on WhatsApp</a>
      </div>
    </div>`
  );
}

/* Grouped Aarti WhatsApp Message Generator with Filtered Assigned Dates Only */
function digitEmoji(num) {
  const digits = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '1️⃣0️⃣', '1️⃣1️⃣', '1️⃣2️⃣'];
  return digits[num - 1] || `${num}️⃣`;
}

function aartiWhatsAppMsg(type = 'Morning', targetDate = today) {
  let list = db.aartis.filter(a => a.date === targetDate && a.type === type);
  let timeText = type === 'Morning' ? 'सकाळी 9:00 वा.' : 'रात्री 8:00 वा.';
  let sessionName = type === 'Morning' ? 'सकाळी' : 'संध्याकाळी';
  let headerDate = dateFullInMarathi(targetDate);

  if (!list.length) {
    return `✨📿 || गणपती बाप्पा मोरया || 📿✨\n${headerDate} ${sessionName} कोणतीही आरती आयोजित केलेली नाही. 🪔\n\n🌺 गणपती बाप्पा मोरया 🌺\n🙏 वृंदावन मंडळ 🙏`;
  }

  let peopleText = list.map((a, i) => `${digitEmoji(i + 1)} ${a.person}`).join('\n');

  return `✨📿 || गणपती बाप्पा मोरया || 📿✨\n${headerDate} ${timeText} आरती होणार आहे. 🪔\n\n*आरती मानकरी:*\n${peopleText}\n\nसर्वांनी सहकुटुंब वेळेत उपस्थित राहावे, ही नम्र विनंती. 🌸\n\n🌺 गणपती बाप्पा मोरया 🌺\n🙏 वृंदावन मंडळ 🙏`;
}

function openAartiMessageModal(selectedDate = today, selectedType = 'Morning') {
  currentMsgDate = selectedDate;
  currentMsgType = selectedType;
  renderAartiMessageModal();
}

function renderAartiMessageModal() {
  let assignedDates = [...new Set(db.aartis.map(a => a.date))].sort();

  if (!assignedDates.length) {
    modal(
      'WhatsApp Aarti Message',
      `<div class="empty"><div class="empty-icon">🪔</div>कोणत्याही आरती नोंदी उपलब्ध नाहीत.</div>`
    );
    return;
  }

  if (!assignedDates.includes(currentMsgDate)) {
    currentMsgDate = assignedDates.includes(today) ? today : assignedDates[0];
  }

  let list = db.aartis.filter(a => a.date === currentMsgDate && a.type === currentMsgType);
  let hasAarti = list.length > 0;
  let text = aartiWhatsAppMsg(currentMsgType, currentMsgDate);

  let dateOptions = assignedDates.map(d => `
    <option value="${d}" ${d === currentMsgDate ? 'selected' : ''}>
      ${dateLabelInMarathi(d)} (${marathiDayName(d)})
    </option>
  `).join('');

  let waAartiUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  modal(
    'WhatsApp Aarti Message',
    `<div class="aarti-msg-modal">
      <div class="msg-type-tabs">
        <button class="tab ${currentMsgType === 'Morning' ? 'active' : ''}" onclick="switchMsgType('Morning')">🌅 Morning Aarti (९:०० AM)</button>
        <button class="tab ${currentMsgType === 'Evening' ? 'active' : ''}" onclick="switchMsgType('Evening')">🌆 Evening Aarti (८:०० PM)</button>
      </div>
      <div class="msg-date-select">
        <label>आरती दिनांक (Assigned Dates Only):</label>
        <select class="msg-date-dropdown" onchange="switchMsgDate(this.value)">
          ${dateOptions}
        </select>
      </div>
      <div class="message-preview ${!hasAarti ? 'empty-msg-preview' : ''}">${escapeHtml(text)}</div>
      ${!hasAarti ? `<p class="no-aarti-warning">⚠️ या सत्रासाठी (Session) आरती मानकरी नोंदवलेले नाहीत.</p>` : ''}
      <div class="modal-actions">
        <button class="outline-btn" ${!hasAarti ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="navigator.clipboard.writeText(aartiWhatsAppMsg('${currentMsgType}','${currentMsgDate}'));toast('Message copied!')">📋 Copy Message</button>
        <a href="${waAartiUrl}" target="_blank" rel="noopener noreferrer" class="primary-btn whatsapp-action-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; ${!hasAarti ? 'pointer-events:none;opacity:0.5;' : ''}">💬 Send on WhatsApp</a>
      </div>
    </div>`
  );
}

function switchMsgType(type) {
  currentMsgType = type;
  renderAartiMessageModal();
}

function switchMsgDate(d) {
  currentMsgDate = d;
  renderAartiMessageModal();
}

function filterTable(i, target) {
  let q = i.value.toLowerCase();
  document.querySelectorAll('#' + target + ' tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
}

function filterCards(i, target) {
  let q = i.value.toLowerCase();
  document.querySelectorAll('#' + target + ' .contact').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
}

function exportCSV() {
  let rows = [
    ['Date', 'Type', 'Description', 'Amount'],
    ...db.donations.map(x => [x.date, 'Donation', x.name, x.amount]),
    ...db.expenses.map(x => [x.date, 'Expense', x.description, -x.amount])
  ];
  let blob = new Blob([rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' });
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ganesh-mandal-report.csv';
  a.click();
  toast('CSV report downloaded');
}

function toast(t) {
  let el = document.getElementById('toast');
  if (!el) return;
  el.textContent = t;
  el.className = 'toast show';
  setTimeout(() => el.className = 'toast', 2400);
}

/* Event listeners */
document.addEventListener('DOMContentLoaded', () => {
  let menuBtn = document.getElementById('menuBtn');
  if (menuBtn) menuBtn.onclick = () => document.querySelector('.sidebar')?.classList.toggle('open');
  let settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.onclick = () => modal('Settings', `<p class="pin-note">Financial PIN is secured via SHA-256 hashing in <b>app.js</b>. Live shared data is connected to Supabase.</p><button class="outline-btn" onclick="closeModal()">Close</button>`);
  let modalEl = document.getElementById('modal');
  if (modalEl) modalEl.onclick = e => { if (e.target.id === 'modal') closeModal(); };

  render();
  loadCloud();
  subscribeCloud();
});

render();
loadCloud();
subscribeCloud();
