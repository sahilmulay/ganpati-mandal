/* Set FINANCIAL_PIN_HASH and optional cloud adapter values before sharing externally. */
// PIN hash is now dynamic — loaded from mandals table after login
function getFinancialPinHash() { return sessionStorage.getItem('mandal_pin_hash') || '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab'; }

const CLOUD_CONFIG = {
  url: 'https://wrvvnqanjtrmmltoaxvg.supabase.co',
  publishableKey: 'sb_publishable_1isjm1Z4wAtnI0pdzGpmIg_Yc0Q7KSw'
};
const cloud = window.supabase?.createClient(CLOUD_CONFIG.url, CLOUD_CONFIG.publishableKey);

/* ── Multi-Mandal Auth Session ─────────────────────────────────────────────── */
// currentMandal is populated from sessionStorage after login.
// On public.html it is loaded by slug from URL param instead.
const currentMandal = {
  get id()       { return sessionStorage.getItem('mandal_id')       || '00000000-0000-0000-0000-000000000001'; },
  get slug()     { return sessionStorage.getItem('mandal_slug')     || 'vrindavan'; },
  get name()     { return sessionStorage.getItem('mandal_name')     || 'वृंदावन कला, क्रीडा व सांस्कृतिक मंडळ'; },
  get city()     { return sessionStorage.getItem('mandal_city')     || 'Kavlapur, Miraj, Sangli'; },
  get phone()    { return sessionStorage.getItem('mandal_phone')    || ''; },
  get nondani()  { return sessionStorage.getItem('mandal_nondani')  || 'महा/220/14'; },
  get pin_hash() { return sessionStorage.getItem('mandal_pin_hash') || '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab'; },
  get passHash() { return sessionStorage.getItem('mandal_pass_hash') || ''; }
};

/* Auth guard — redirect to login if no session (skip on login.html and public.html) */
(function authGuard() {
  let path = (window.location.pathname || '').toLowerCase();
  let isPublic = path.includes('public.html') || path.includes('login.html');
  if (!isPublic && !sessionStorage.getItem('mandal_id')) {
    window.location.href = 'login.html';
  }
})();

/* Logout */

function confirmLogoutGlobal() {
  modal('Logout (लॉगआउट)', `
    <p class="delete-text">तुम्हाला <b>${escapeHtml(currentMandal.name)}</b> मधून खरोखर लॉगआउट करायचे आहे का?</p>
    <div class="modal-actions" style="justify-content:center; gap:10px;">
      <button class="outline-btn" onclick="closeModal()">Cancel</button>
      <button class="primary-btn" style="background:#dc2626; border-color:#dc2626; color:#fff;" onclick="logoutMandal()">⏏ Yes, Logout</button>
    </div>
  `);
}

function logoutMandal() {
  sessionStorage.clear();
  localStorage.removeItem('ganesh-mandal-data-' + (currentMandal.id || ''));
  window.location.href = 'login.html';
}



/* Service Worker Registration for PWA & Push Notifications */
let swRegistration = null;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      swRegistration = reg;
      console.log('[PWA] ServiceWorker active for offline mandap & push alerts:', reg.scope);
    }).catch(err => {
      console.warn('[PWA] ServiceWorker registration skipped:', err);
    });
  });
}

/* Web Push Notification Request Handler */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    toast('Notifications not supported on this browser.');
    return;
  }

  try {
    let permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast('🔔 Notifications enabled successfully!');
      sendLocalNotification(
        '॥ श्री गणेशाय नमः ॥',
        `${currentMandal.name} नोटिफिकेशन्स सक्रिय झाले आहेत. आरती व महत्वाच्या सूचना मिळतील.`
      );
      render();
    } else {
      toast('Notification permission denied or dismissed.');
    }
  } catch (err) {
    console.warn('Notification permission error:', err);
  }
}

/* Interactive Background Notification Tester (Triggers after 5 seconds so user can close app) */
function testDelayedNotification() {
  if (!('Notification' in window)) {
    toast('Notifications not supported on this browser.');
    return;
  }
  if (Notification.permission !== 'granted') {
    requestNotificationPermission().then(() => {
      if (Notification.permission === 'granted') testDelayedNotification();
    });
    return;
  }

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_TEST_NOTIFICATION' });
  } else if (swRegistration) {
    setTimeout(() => {
      swRegistration.showNotification('॥ श्री गणेशाय नमः ॥', {
        body: '🪔 संध्याकाळची महाआरती रात्री ८:०० वाजता सुरू होत आहे. सहकुटुंब उपस्थित राहावे!',
        icon: 'assets/icon.svg',
        badge: 'assets/icon.svg',
        vibrate: [200, 100, 200]
      });
    }, 5000);
  } else {
    setTimeout(() => {
      sendLocalNotification('॥ श्री गणेशाय नमः ॥', '🪔 संध्याकाळची महाआरती रात्री ८:०० वाजता सुरू होत आहे. सहकुटुंब उपस्थित राहावे!');
    }, 5000);
  }

  toast('⏱️ Timer started! Minimize or close the app right now.');
}

function sendLocalNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  if (swRegistration && swRegistration.showNotification) {
    swRegistration.showNotification(title, {
      body: body,
      icon: 'assets/icon.svg',
      badge: 'assets/icon.svg',
      vibrate: [200, 100, 200]
    });
  } else {
    new Notification(title, { body: body, icon: 'assets/icon.svg' });
  }
}

/* Fixed Receipt Alignment Coordinates */
const RECEIPT_CONFIG = {
  DATE_X: 761,
  DATE_Y: 325,
  DATE_FONT_SIZE: 22,

  NAME_X: 406,
  NAME_Y: 355,
  NAME_FONT_SIZE: 24,

  AMOUNT_X: 537,
  AMOUNT_Y: 430,
  AMOUNT_FONT_SIZE: 24,

  AMOUNT_WORDS_X: 352,
  AMOUNT_WORDS_Y: 472,
  AMOUNT_WORDS_FONT_SIZE: 20,

  BOTTOM_AMOUNT_X: 190,
  BOTTOM_AMOUNT_Y: 553,
  BOTTOM_AMOUNT_FONT_SIZE: 24,

  TEXT_COLOR: '#941838', // Original dark red/maroon ink color
  FONT_FAMILY: '"Noto Sans Devanagari", sans-serif'
};

let currentModalReceiptData = null; // Stores pre-rendered receipt data for instant popup-safe sharing

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

/* Security Helper: Image Compression with Safe Fallback for Any Format */
function compressImage(file, maxDimension = 1200, quality = 0.78) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    let reader = new FileReader();
    reader.onload = e => {
      let rawData = e.target.result;
      let img = new Image();
      img.onload = () => {
        try {
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
        } catch (err) {
          resolve(rawData);
        }
      };
      img.onerror = () => resolve(rawData); // Fallback to raw data url for non-standard formats
      img.src = rawData;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}


function isPdfData(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function hasValidImage(img) {
  if (!img) return false;
  if (typeof img !== 'string') return false;
  let s = img.trim();
  if (!s || s === '{}' || s === '[]' || s === 'null' || s === 'undefined' || s === '[object Object]') return false;
  return true;
}

const rupees = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const today = new Date().toISOString().slice(0, 10);

const FESTIVAL_DATES = [
  { date: '2026-09-14', marathi: '१४ सप्टेंबर (सोमवार)', title: '१४ सप्टेंबर (सोमवार) - श्री गणेश स्थापना व प्रथम दिवस' },
  { date: '2026-09-15', marathi: '१५ सप्टेंबर (मंगळवार)', title: '१५ सप्टेंबर (मंगळवार) - द्वितीय दिन' },
  { date: '2026-09-16', marathi: '१६ सप्टेंबर (बुधवार)', title: '१६ सप्टेंबर (बुधवार) - तृतीय दिन' },
  { date: '2026-09-17', marathi: '१७ सप्टेंबर (गुरुवार)', title: '१७ सप्टेंबर (गुरुवार) - चतुर्थ दिन' },
  { date: '2026-09-18', marathi: '१८ सप्टेंबर (शुक्रवार)', title: '१८ सप्टेंबर (शुक्रवार) - पाचवा दिवस / गौरी विसर्जन' },
  { date: '2026-09-19', marathi: '१९ सप्टेंबर (शनिवार)', title: '१९ सप्टेंबर (शनिवार) - सहावा दिवस' },
  { date: '2026-09-20', marathi: '२० सप्टेंबर (रविवार)', title: '२० सप्टेंबर (रविवार) - अनंत चतुर्दशी / महाविसर्जन' }
];

const seed = {
  donations: [],
  expenses: [],
  aartis: [],
  events: [],
  contacts: [],
  alankar: [],
  documents: [],
  settings: {
    morningAartiTime: '09:00',
    eveningAartiTime: '20:00',
    waTemplate: ''
  }
};

// Automatic one-time client reset for fresh production festival records
const DATA_VERSION = '2026-mandal-prod-v19';
const LOCAL_STORAGE_KEY = 'ganesh-mandal-data-' + (sessionStorage.getItem('mandal_id') || 'default');
if (localStorage.getItem('mandal-data-version-' + (sessionStorage.getItem('mandal_id') || 'default')) !== DATA_VERSION) {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.setItem('mandal-data-version-' + (sessionStorage.getItem('mandal_id') || 'default'), DATA_VERSION);
}

let db = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || 'null') || seed;
if (!db.alankar) db.alankar = [];
if (!db.documents) db.documents = [];
if (!db.donations) db.donations = [];
if (!db.expenses) db.expenses = [];
if (!db.aartis) db.aartis = [];
if (!db.events) db.events = [];
if (!db.contacts) db.contacts = [];
// Aarti times are per-record and configurable; not forced-overridden.
if (!db.settings) db.settings = seed.settings;
if (!db.settings.morningAartiTime) db.settings.morningAartiTime = '09:00';
if (!db.settings.eveningAartiTime) db.settings.eveningAartiTime = '20:00';
if (db.settings.waTemplate === undefined) db.settings.waTemplate = '';
if (Array.isArray(db.expenses)) {
  db.expenses.forEach(e => {
    if (!hasValidImage(e.image)) e.image = '';
  });
}

/* Multi-Page Route Detection */
function detectCurrentPage() {
  let path = (window.location.pathname || '').split('/').pop().toLowerCase();
  if (path.includes('public')) return 'public';
  if (path.includes('donations')) return 'donations';
  if (path.includes('expenses')) return 'expenses';
  if (path.includes('aarti')) return 'aarti';
  if (path.includes('events')) return 'events';
  if (path.includes('contacts')) return 'contacts';
  if (path.includes('reports')) return 'reports';
  if (path.includes('documents')) return 'documents';
  if (path.includes('settings')) return 'settings';
  return 'dashboard';
}

let pageName = detectCurrentPage();
let editing = null;
let aartiFilter = 'all';
let currentMsgType = 'Morning';
let currentMsgDate = today;

const tableName = { donation: 'donations', expense: 'expenses', aarti: 'aartis', event: 'events', contact: 'contacts', alankar: 'alankar', document: 'documents' };
const listName = { donation: 'donations', expense: 'expenses', aarti: 'aartis', event: 'events', contact: 'contacts', alankar: 'alankar', document: 'documents' };

const preloadedReceiptImg = new Image();
preloadedReceiptImg.src = 'assets/receipt_template.png';

function formatPhoneWithCountryCode(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    let num = digits.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  if (digits.startsWith('91') && digits.length > 10) {
    return `+91 ${digits.slice(2)}`;
  }
  return `+91 ${digits}`;
}

function getCleanWhatsAppDigits(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.startsWith('91')) return digits;
  return '91' + digits;
}

function formatDateTimeLocal(dateStr) {
  if (!dateStr) {
    let now = new Date();
    let y = now.getFullYear();
    let m = String(now.getMonth() + 1).padStart(2, '0');
    let d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T19:00`;
  }
  if (dateStr.length === 16 && dateStr.includes('T')) return dateStr;
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 16);
  let y = d.getFullYear();
  let m = String(d.getMonth() + 1).padStart(2, '0');
  let day = String(d.getDate()).padStart(2, '0');
  let h = String(d.getHours()).padStart(2, '0');
  let min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatEventDateTimeDisplay(dateStr) {
  if (!dateStr) return '';
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  let datePart = `${d.getDate()} ${marathiMonthName(d.getMonth() + 1)} ${d.getFullYear()}`;
  let hours = d.getHours();
  let mins = String(d.getMinutes()).padStart(2, '0');
  let ampm = hours >= 12 ? 'PM' : 'AM';
  let h12 = ((hours + 11) % 12 + 1);
  return `${datePart} · ${h12}:${mins} ${ampm}`;
}

function fromCloud(type, row) {
  let img = hasValidImage(row.image) ? row.image.trim() : (hasValidImage(row.image_url) ? row.image_url.trim() : '');
  if (type === 'expense') return { ...row, paidBy: row.paid_by, image: img, image_url: img };
  if (type === 'event') return { ...row, date: formatDateTimeLocal(row.date), image: img, image_url: img };
  if (type === 'document') return {
    ...row,
    outwardNo: row.outward_no || row.outwardNo || '',
    issuedBy: row.issued_by || row.issuedBy || '',
    validFrom: row.valid_from || row.validFrom || '',
    validUntil: row.valid_until || row.validUntil || '',
    image: img,
    image_url: img
  };
  if (type === 'alankar') return { ...row, image: img, image_url: img };
  return row;
}

function toCloud(type, row) {
  let copy = { ...row };
  delete copy.id;
  delete copy.image;
  let img = hasValidImage(row.image) ? row.image.trim() : (hasValidImage(row.image_url) ? row.image_url.trim() : '');
  if (type === 'expense') {
    copy.paid_by = copy.paidBy || copy.paid_by || 'Mandal';
    copy.image_url = img;
    delete copy.image;
    delete copy.paidBy;
  }
  if (type === 'event') {
    copy.image_url = img;
    delete copy.image;
    if (row.date) {
      let d = new Date(row.date);
      if (!isNaN(d.getTime())) copy.date = d.toISOString();
    }
  }
  if (type === 'document') {
    copy.outward_no = row.outwardNo || row.outward_no || '';
    copy.issued_by = row.issuedBy || row.issued_by || '';
    copy.valid_from = row.validFrom || row.valid_from || '';
    copy.valid_until = row.validUntil || row.valid_until || '';
    copy.image = img;
    delete copy.image_url;
    delete copy.outwardNo;
    delete copy.issuedBy;
    delete copy.validFrom;
    delete copy.validUntil;
  }
  if (type === 'alankar') {
    copy.image = img;
    delete copy.image_url;
  }
  delete copy.created_at;
  copy.mandal_id = currentMandal.id;
  return copy;
}

/* Helper: Sort items so newest entries ALWAYS come to top (Date DESC, then created_at / ID DESC) */
function sortByNewest(list) {
  return [...list].sort((a, b) => {
    let dateCmp = (b.date || b.validFrom || '').localeCompare(a.date || a.validFrom || '');
    if (dateCmp !== 0) return dateCmp;
    let timeB = b.created_at || b.id || '';
    let timeA = a.created_at || a.id || '';
    return timeB.localeCompare(timeA);
  });
}

/* Helper: Sort upcoming events in chronological order (earliest date first, e.g. 14th Sept first, then 20th Sept) */
function sortEventsChronological(list) {
  return [...list].sort((a, b) => {
    let dateA = a.date || '';
    let dateB = b.date || '';
    let dateCmp = dateA.localeCompare(dateB);
    if (dateCmp !== 0) return dateCmp;
    let timeA = a.created_at || a.id || '';
    let timeB = b.created_at || b.id || '';
    return timeA.localeCompare(timeB);
  });
}

/* ── Fingerprint to detect real changes before re-rendering ─────── */
let _lastCloudFp = '';
function _cloudFingerprint() {
  return Object.values(listName).map(k => {
    let list = db[k] || [];
    return list.length + (list[0] ? '-' + list[0].id : '');
  }).join('|');
}

async function loadCloud() {
  if (!cloud) return;
  let types = Object.keys(tableName);

  let updatedAny = false;
  await Promise.allSettled(types.map(async (type) => {
    try {
      let { data, error } = await cloud.from(tableName[type]).select('*').eq('mandal_id', currentMandal.id);
      if (error) {
        if (error.code === 'PGRST205') return;
        console.warn(`Supabase ${type} fetch error:`, error.message);
        return;
      }
      if (Array.isArray(data)) {
        let cloudRows = data.map(row => fromCloud(type, row));
        if (cloudRows.length > 0) {
          db[listName[type]] = cloudRows;
          updatedAny = true;
        } else if (db[listName[type]] && db[listName[type]].length > 0) {
          if (type === 'document' && cloud) {
            db[listName[type]].forEach(localDoc => {
              let p = {
                id: localDoc.id,
                mandal_id: currentMandal.id,
                title: localDoc.title || '',
                category: localDoc.category || '',
                icon: localDoc.icon || '📁',
                outward_no: localDoc.outwardNo || '',
                issued_by: localDoc.issuedBy || '',
                valid_from: localDoc.validFrom || '',
                valid_until: localDoc.validUntil || '',
                status: localDoc.status || 'Pending',
                note: localDoc.note || '',
                image: localDoc.image || ''
              };
              cloud.from('documents').upsert(p).then(() => {});
            });
          }
        } else {
          db[listName[type]] = [];
        }
      }
    } catch (err) {
      console.warn(`Cloud load error for ${type}:`, err);
    }
  }));

  if (updatedAny) {
    let newFp = _cloudFingerprint();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
    if (newFp !== _lastCloudFp) {
      _lastCloudFp = newFp;
      render(); // Only re-render if record counts or IDs actually changed
    }
  }
}

function subscribeCloud() {
  if (!cloud) return;
  cloud.channel('mandal-live-updates').on('postgres_changes', { event: '*', schema: 'public' }, () => loadCloud()).subscribe();
}

/* Background Polling & Window Focus Listeners for Multi-Device Sync */
setInterval(loadCloud, 30000); // Reduced from 8s → 30s to avoid hammering DB and blocking main thread
window.addEventListener('focus', loadCloud);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') loadCloud();
});

/* ── Prevent double render: save() dispatches a storage event which
       would trigger a second render() in the same tab. Block it.  ── */
let _isSaving = false;

function save() {
  try {
    _isSaving = true;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.warn('localStorage quota note:', err);
  } finally {
    _isSaving = false;
  }
}

window.addEventListener('storage', () => {
  if (_isSaving) return; // Same-tab save — skip to avoid double render
  const d = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (d) {
    db = JSON.parse(d);
    render();
  }
});


const nav = [
  ['dashboard.html', 'dashboard', '⌂', 'Dashboard'],
  ['donations.html', 'donations', '₹', 'Donations'],
  ['expenses.html', 'expenses', '💸', 'Expenses'],
  ['aarti.html', 'aarti', '☀', 'Aarti Timetable'],
  ['events.html', 'events', '✦', 'Events & Notices'],
  ['documents.html', 'documents', '📁', 'Official Documents'],
  ['contacts.html', 'contacts', '☏', 'Committee Contacts'],
  ['reports.html', 'reports', '▥', 'Reports'],
  ['public.html?mandal=' + currentMandal.slug, 'public', '🌺', 'Public Portal'],
  ['settings.html', 'settings', '⚙', 'Settings']
];


/* Update dynamic mandal name, location, and page title on all pages */
function updatePageHeaderAndBrand() {
  let name = currentMandal.name || 'मंडळ व्यवस्थापक';
  let city = currentMandal.city || '';
  let slug = currentMandal.slug || '';

  document.querySelectorAll('.brand strong, #sidebarMandalName').forEach(el => el.textContent = name);
  document.querySelectorAll('.location span, #topbarMandalName').forEach(el => el.textContent = name);
  document.querySelectorAll('.location small, #topbarLocation').forEach(el => el.textContent = (city ? city + ' • ' : '') + 'Private Portal');
  document.querySelectorAll('.side-foot').forEach(el => {
    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div><span class="online-dot"></span> ${escapeHtml(slug)}</div>
        <button onclick="confirmLogoutGlobal()" style="background:#dc2626; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">⏏ Logout</button>
      </div>
    `;
  });
  if (detectCurrentPage() !== 'public') {
    document.title = name + ' - Manager';
  }
}

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
  return `<div class="page-wrap"><div class="page-heading"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(sub)}</p></div>${action}</div>${body}<div class="footer">${currentMandal.name} Manager</div></div>`;
}

function render() {
  pageName = detectCurrentPage();
  updatePageHeaderAndBrand();
  if (pageName === 'public') {
    let target = document.getElementById('page');
    if (target) target.innerHTML = publicView();
    return;
  }

  renderNav();
  if (pageName === 'settings') { renderNav(); return; }
  let p = { dashboard, donations, expenses, aarti, events, documents, contacts, reports, public: publicView }[pageName] || dashboard;
  let target = document.getElementById('page');
  if (target) target.innerHTML = p();
}

/* OFFICIAL DOCUMENT STORAGE VAULT */
function documents() {
  let docs = db.documents || [];
  let notifGranted = ('Notification' in window) && Notification.permission === 'granted';

  let notifBanner = !notifGranted ? `
    <div class="notif-banner">
      <div class="notif-text">
        <strong>🔔 Get Mandap & Aarti Push Alerts on this Device</strong>
        <span>Receive daily Aarti reminders and urgent announcements even when this app is closed.</span>
      </div>
      <button class="notif-btn" onclick="requestNotificationPermission()">Enable Notifications</button>
    </div>
  ` : '';

  let cards = docs.length ? docs.map(doc => {
    let hasPhoto = hasValidImage(doc.image);
    let isPdf = isPdfData(doc.image);
    return `
    <div class="doc-card">
      <div class="doc-header">
        <div class="doc-icon">${doc.icon || '📁'}</div>
        <div class="doc-meta">
          <h4>${escapeHtml(doc.title)}</h4>
          <span>${escapeHtml(doc.issuedBy || 'Official Authority')}</span>
          <div class="outward-no">${escapeHtml(doc.outwardNo || '')}</div>
        </div>
      </div>
      
      <div class="doc-status-row">
        <span>वैधता: <b>${escapeHtml(doc.validUntil || 'कायमस्वरूपी')}</b></span>
        <span class="doc-status-badge ${doc.status === 'Approved' ? 'approved' : 'pending'}">● ${escapeHtml(doc.status || 'Approved')}</span>
      </div>

      <div style="margin: 8px 0;">
        ${hasPhoto ? (isPdf ? `<span class="doc-badge has-photo" style="display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#1d4ed8; background:#dbeafe; padding:3px 10px; border-radius:6px; font-weight:700;">📄 PDF Attached</span>` : `<span class="doc-badge has-photo" style="display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#15803d; background:#dcfce7; padding:3px 10px; border-radius:6px; font-weight:700;">📎 Photo Attached</span>`) : `<span class="no-bill-badge" style="font-size:11px;">⏳ No file uploaded yet</span>`}
      </div>

      ${doc.note ? `<p style="margin:0 0 8px 0; font-size:12px; color:#5c473e; line-height:1.4;">${escapeHtml(doc.note)}</p>` : ''}

      <div class="doc-actions" style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
        <button class="primary-btn" onclick="openDocumentModal('${doc.id}')" style="background:#8b1e3f; color:#fff; flex:1; min-width:120px;">👁️ View Document</button>
        <button class="outline-btn" style="color:#8b261e;" onclick="openDocForm(getItem('document','${doc.id}'))">✏️ Edit / File</button>
        <button class="outline-btn" style="color:#dc2626; border-color:#fca5a5;" onclick="confirmDelete('document','${doc.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `;}).join('') : `
    <div class="empty" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
      <div class="empty-icon" style="font-size:48px; margin-bottom:8px;">📁</div>
      <h3 style="color:#7d1c12; margin:0 0 6px 0;">अद्याप कोणतीही अधिकृत परवानगी जोडलेली नाही</h3>
      <p style="color:#6e584f; font-size:13px; margin:0 0 16px 0;">मंडळाच्या पोलीस, ग्रामपंचायत, वीज वितरण परवानग्यांचे फोटो किंवा PDF अपलोड करण्यासाठी खालील बटण दाबा.</p>
      <button class="primary-btn" onclick="openDocForm()">+ Upload New Permission</button>
    </div>
  `;

  return shell(
    'Official Permissions & Document Vault',
    'पोलीस ठाणे, ग्रामपंचायत, वीज वितरण व इतर कायदेशीर परवानग्यांचे फोटो व PDF',
    `${notifBanner}
    <div class="card">
      <div class="toolbar">
        <input class="search" placeholder="Search official permissions or outward no…" oninput="filterCards(this,'docsGrid')">
        <button class="primary-btn" onclick="openDocForm()">+ Upload New Permission</button>
      </div>
      <div class="docs-grid" id="docsGrid">
        ${cards}
      </div>
    </div>`
  );
}

/* Dedicated High-Res Document Viewer & Pending Status Modal */
function openDocumentModal(docId) {
  let doc = (db.documents || []).find(x => String(x.id) === String(docId));
  if (!doc) return toast('Document not found');

  if (hasValidImage(doc.image)) {
    let isPdf = isPdfData(doc.image);
    modal('Official Document View', `
      <div class="bill-modal-content">
        <div style="margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
          <h3 style="margin:0 0 4px 0; color:#8b261e; font-size:18px;">${escapeHtml(doc.title)}</h3>
          <span style="font-size:12px; color:#6b7280;">${escapeHtml(doc.outwardNo || '')} • ${escapeHtml(doc.issuedBy || '')}</span>
        </div>
        ${isPdf ? `
          <div style="text-align:center; padding:8px 0;">
            <div style="font-size:48px; margin-bottom:8px;">📄</div>
            <p style="font-weight:700; color:#7d1c12; margin:0 0 12px 0;">PDF Document Attached</p>
            <iframe src="${doc.image}" style="width:100%; height:420px; border:1.5px solid #e5e7eb; border-radius:10px;" title="Document PDF"></iframe>
          </div>
        ` : `
          <div style="text-align:center; background:#fafafa; border-radius:10px; padding:6px; border:1px solid #eee;">
            <img class="bill-preview" src="${doc.image}" alt="${escapeHtml(doc.title)}" style="max-height:68vh; max-width:100%; object-fit:contain; border-radius:6px;">
          </div>
        `}
        <div class="modal-actions" style="margin-top:16px; justify-content:center; gap:10px; flex-wrap:wrap;">
          <a class="primary-btn" href="${doc.image}" download="${(doc.title || 'mandal-doc').replace(/\s+/g, '_')}${isPdf ? '.pdf' : '.jpg'}" target="_blank" style="text-decoration:none;">⬇️ Download / Open Full File</a>
          <button class="outline-btn" onclick="openDocForm(getItem('document','${doc.id}'))">✏️ Edit / Replace File</button>
          <button class="outline-btn" onclick="closeModal()">Close</button>
        </div>
      </div>
    `);
  } else {
    modal('Official Permission Status', `
      <div class="bill-modal-content no-bill-view">
        <div class="no-bill-icon">📄</div>
        <h4 style="color:#8b261e; margin:0 0 6px 0;">No document file uploaded yet</h4>
        <p style="color:#b45309; font-weight:600; font-size:13px; margin:0 0 12px 0;">⏳ Permission Pending (परवानगी प्रलंबित)</p>
        <p style="font-size:13px; color:#6e584f; margin:0 0 16px 0; line-height:1.5;">
          <b>${escapeHtml(doc.title)}</b> साठी कागदपत्राचा फोटो किंवा PDF अद्याप जोडलेली नाही.
        </p>

        <div style="background:#fff7ed; border-radius:8px; padding:12px 14px; text-align:left; font-size:13px; margin-bottom:18px; border:1px solid #fed7aa;">
          <div style="margin-bottom:4px;"><b>विभाग / कार्यालय:</b> ${escapeHtml(doc.issuedBy || 'अधिकृत विभाग')}</div>
          <div style="margin-bottom:4px;"><b>जावक क्र.:</b> ${escapeHtml(doc.outwardNo || 'उपलब्ध नाही')}</div>
          <div style="margin-bottom:4px;"><b>वैधता:</b> ${escapeHtml(doc.validUntil || 'कायमस्वरूपी')}</div>
          <div><b>स्थिती:</b> <span class="doc-status-badge ${doc.status === 'Approved' ? 'approved' : 'pending'}">● ${escapeHtml(doc.status || 'Pending')}</span></div>
        </div>

        <div class="modal-actions" style="justify-content:center; gap:10px;">
          <button class="primary-btn" onclick="openDocForm(getItem('document','${doc.id}'))">📎 Upload Permission Photo / PDF</button>
          <button class="outline-btn" onclick="closeModal()">Close</button>
        </div>
      </div>
    `);
  }
}

function openDocForm(item = null) {
  let x = item || {};
  let validImg = hasValidImage(x.image) ? x.image : '';
  let isPdf = isPdfData(validImg);
  modal(
    (item ? 'Edit ' : 'Upload ') + 'Official Permission / Document',
    `<form onsubmit="submitDocForm(event,'${x.id || ''}')" novalidate>
      <div class="form-grid">
        <div class="field full">
          <label>परवानगी प्रकार (Permission Category)</label>
          <select name="category" onchange="let tf=this.form.querySelector('input[name=title]'); if(tf && !tf.value) { tf.value = this.options[this.selectedIndex].text.split('(')[0].trim(); }">
            <option value="Police Permission" ${(x.category || '') === 'Police Permission' ? 'selected' : ''}>🚓 पोलीस ठाणे परवानगी (Police Permission)</option>
            <option value="Gram Panchayat NOC" ${(x.category || '') === 'Gram Panchayat NOC' ? 'selected' : ''}>🏛️ ग्रामपंचायत / पालिका नाहरकत (Gram Panchayat NOC)</option>
            <option value="MSEDCL Electricity" ${(x.category || '') === 'MSEDCL Electricity' ? 'selected' : ''}>⚡ महावितरण तात्पुरती वीज जोडणी (Electricity Connection)</option>
            <option value="Sound / Loudspeaker" ${(x.category || '') === 'Sound / Loudspeaker' ? 'selected' : ''}>🔊 ध्वनीक्षेपक / लाऊडस्पीकर परवानगी (Sound Permission)</option>
            <option value="Fire Safety NOC" ${(x.category || '') === 'Fire Safety NOC' ? 'selected' : ''}>🚒 अग्निशामक दल नाहरकत (Fire Safety NOC)</option>
            <option value="Trust Registration" ${(x.category || '') === 'Trust Registration' ? 'selected' : ''}>📜 मंडळ अधिकृत नोंदणी (Trust Registration)</option>
            <option value="Other" ${(x.category || '') === 'Other' ? 'selected' : ''}>📁 इतर अधिकृत परवानगी (Other Permission)</option>
          </select>
        </div>
        <div class="field full">
          <label>परवानगीचे नाव / शीर्षक (Document Title)</label>
          <input name="title" required value="${escapeHtml(x.title || '')}" placeholder="उदा. ग्रामपंचायत नाहरकत दाखला / पोलीस परवानगी">
        </div>
        <div class="field"><label>Outward / Ref Number (जावक क्र.)</label><input name="outwardNo" value="${escapeHtml(x.outwardNo || '')}" placeholder="e.g. जावक क्र. ४५/२०२६"></div>
        <div class="field full"><label>Issuing Authority / Office</label><input name="issuedBy" required value="${escapeHtml(x.issuedBy || '')}" placeholder="e.g. मिरज ग्रामीण पोलीस ठाणे / ग्रामपंचायत"></div>
        <div class="field"><label>Valid From</label><input name="validFrom" type="date" value="${x.validFrom || today}"></div>
        <div class="field"><label>Valid Until / Expiry</label><input name="validUntil" value="${escapeHtml(x.validUntil || '2026-08-30')}" placeholder="e.g. 2026-08-30 किंवा कायमस्वरूपी"></div>
        <div class="field"><label>Status</label><select name="status"><option ${x.status === 'Approved' ? 'selected' : ''}>Approved</option><option ${x.status === 'Pending' ? 'selected' : ''}>Pending</option></select></div>
        <div class="field full">
          <label>Permission Document (Upload Photo or PDF in any format)</label>
          <input name="image" type="file" accept="image/*,application/pdf,.pdf,*/*" onchange="previewBillInput(this)">
          <div style="font-size:11px; color:#8b261e; margin-top:4px;">📷 फोटो (Camera/Gallery) किंवा 📄 PDF फाइल निवडू शकता</div>
        </div>
        <div class="field full" id="billFormPreview">
          ${validImg ? (isPdf ? `
            <div class="bill-preview-box" style="text-align:center; padding:12px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px;">
              <div style="font-size:32px;">📄</div>
              <strong style="color:#0369a1; font-size:13px;">PDF Document Attached</strong>
              <div style="margin-top:6px;">
                <button type="button" class="text-link" onclick="openBill('${validImg}')">👁 View PDF</button>
              </div>
            </div>
          ` : `
            <div class="bill-preview-box">
              <img src="${validImg}" alt="Attached Document">
              <button type="button" class="text-link" onclick="openBill('${validImg}')">👁 View Full Photo</button>
            </div>
          `) : ''}
        </div>
        <div class="field full"><label>Notes / Terms</label><textarea name="note" placeholder="e.g. रात्री १०:०० वाजेपर्यंत ध्वनीक्षेपक कायदेशीर मंजुरी.">${escapeHtml(x.note || '')}</textarea></div>
      </div>
      <div class="modal-actions" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        ${item && item.id ? `<button type="button" class="outline-btn" style="color:#dc2626; border-color:#fca5a5;" onclick="confirmDelete('document','${x.id}')">🗑️ Delete</button>` : '<div></div>'}
        <div style="display:flex; gap:8px;">
          <button type="button" class="outline-btn" onclick="closeModal()">Cancel</button>
          <button type="submit" class="primary-btn">Save Document</button>
        </div>
      </div>
    </form>`
  );
}

async function submitDocForm(ev, id) {
  ev.preventDefault();
  let f = new FormData(ev.target), o = Object.fromEntries(f.entries());

  if (!o.title || !o.title.trim()) {
    toast('कृपया परवानगीचे शीर्षक प्रविष्ट करा (Please enter title)');
    return;
  }

  let list = db.documents || [];
  let existing = id ? list.find(x => String(x.id) === String(id)) : null;

  showLoader('कागदपत्र सेव्ह होत आहे... (Saving document...)');

  let file = f.get('image');
  if (file && file.size) {
    let isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      if (file.size > 10 * 1024 * 1024) {
        hideLoader();
        toast('कृपया 10MB पेक्षा लहान PDF निवडा (Please choose PDF under 10MB)');
        return;
      }
      o.image = await readFileAsDataUrl(file);
    } else {
      try {
        let compressed = await compressImage(file, 1200, 0.78);
        o.image = hasValidImage(compressed) ? compressed : await readFileAsDataUrl(file);
      } catch(err) {
        o.image = await readFileAsDataUrl(file);
      }
    }
  } else {
    o.image = (existing && hasValidImage(existing.image)) ? existing.image : '';
  }

  let cat = o.category || '';
  let docIcon = cat.includes('Police') ? '🚓' : cat.includes('Gram') ? '🏛️' : cat.includes('Electricity') ? '⚡' : cat.includes('Sound') ? '🔊' : cat.includes('Fire') ? '🚒' : cat.includes('Trust') ? '📜' : '📁';

  let index = id ? list.findIndex(x => String(x.id) === String(id)) : -1;
  if (index >= 0) {
    o.id = id;
    o.icon = docIcon;
    list[index] = { ...list[index], ...o };
  } else {
    o.id = 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    o.icon = docIcon;
    list.unshift(o);
  }
  db.documents = list;
  save();

  // Sync document to Supabase cloud
  if (cloud) {
    let docPayload = {
      id: o.id,
      mandal_id: currentMandal.id,
      title: o.title || '',
      category: o.category || '',
      icon: o.icon || '📁',
      outward_no: o.outwardNo || '',
      issued_by: o.issuedBy || '',
      valid_from: o.validFrom || '',
      valid_until: o.validUntil || '',
      status: o.status || 'Pending',
      note: o.note || '',
      image: o.image || ''
    };
    try {
      let { error } = await cloud.from('documents').upsert(docPayload);
      if (error && error.code !== 'PGRST205') {
        console.warn('Doc cloud upsert error:', error.message || error);
      }
    } catch(err) {
      console.warn('Doc cloud sync exception:', err);
    }
  }

  hideLoader();
  closeModal();
  toast('✅ अधिकृत कागदपत्र जतन झाले! (Saved successfully)');
  render();
}

/* PUBLIC DEVOTEE & TRANSPARENCY DASHBOARD */
function publicView() {
  // On public.html the mandal name comes from the URL param (loaded by loadPublicMandalData)
  let inc = sum(db.donations), exp = sum(db.expenses), bal = inc - exp;
  let alankars = sortByNewest(db.alankar || []);
  let sortedDonations = sortByNewest(db.donations);
  let sortedExpenses = sortByNewest(db.expenses);
  let upcomingEvents = sortEventsChronological(db.events).slice(0, 6);
  let contactsList = db.contacts && db.contacts.length ? db.contacts : [];


  // ── Swipeable Gallery ────────────────────────────────────────────
  let galleryImages = alankars.filter(a => hasValidImage(a.image));
  let galleryHtml = galleryImages.length ? galleryImages.map((item, idx) => `
    <div class="alankar-card" onclick="openGallery(${idx})">
      <div class="alankar-img-wrap">
        <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">
        <span class="alankar-date-tag">📅 ${dateLabelInMarathi(item.date)}</span>
        <span class="gallery-counter-badge">${idx + 1}/${galleryImages.length}</span>
      </div>
      <div class="alankar-info">
        <strong>${escapeHtml(item.title)}</strong>
        ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
      </div>
    </div>
  `).join('') : '<div class="empty"><div class="empty-icon">🌺</div>अद्याप दैनंदिन मुखदर्शन फोटो अपलोड केलेले नाहीत.</div>';


  let donationRows = sortedDonations.map((d, index) => {
    let isExtra = index >= 4;
    return `
      <tr class="${isExtra ? 'extra-donation-row' : ''}" style="${isExtra ? 'display:none;' : ''}">
        <td>${dateLabelInMarathi(d.date)}</td>
        <td><strong>${escapeHtml(d.name)}</strong></td>
        <td><span class="tag morning">${escapeHtml(d.mode)}</span></td>
        <td class="amount income-t">${rupees(d.amount)}</td>
      </tr>
    `;
  }).join('');

  let expenseRows = sortedExpenses.map((e, index) => {
    let isExtra = index >= 4;
    return `
      <tr class="${isExtra ? 'extra-expense-row' : ''}" style="${isExtra ? 'display:none;' : ''}">
        <td>${dateLabelInMarathi(e.date)}</td>
        <td>
          <strong>${escapeHtml(e.description)}</strong>
          <br><small class="muted">${escapeHtml(e.category)} • Paid by ${escapeHtml(e.paidBy)}</small>
        </td>
        <td class="amount expense-t">${rupees(e.amount)}</td>
        <td>${hasValidImage(e.image) ? `<button class="text-link view-bill-btn" onclick="openBill('${escapeHtml(e.image)}')">👁 Bill</button>` : '<span class="no-bill-badge">No bill available</span>'}</td>
      </tr>
    `;
  }).join('');

  let aartiScheduleHtml = FESTIVAL_DATES.map((fd, index) => {
    let isExtra = index >= 2;
    let dayAartis = (db.aartis || []).filter(a => a.date === fd.date);
    let morningAartis = dayAartis.filter(a => a.type === 'Morning');
    let eveningAartis = dayAartis.filter(a => a.type === 'Evening');

    return `
      <div class="aarti-day-card ${isExtra ? 'extra-aarti-card' : ''}" style="${isExtra ? 'display:none;' : ''}">
        <div class="aarti-day-title">
          <span>🪔 <b>${fd.title}</b></span>
        </div>
        <div style="padding:8px 14px; font-size:12px;">
          <div style="margin-bottom:6px;">
            <span style="color:#8b261e; font-weight:700;">🌅 सकाळ (${time12(db.settings?.morningAartiTime || '09:00')}):</span>
            ${morningAartis.length ? morningAartis.map(a => `<span style="font-weight:700; margin-left:6px; color:#2c1b18;">👤 ${escapeHtml(a.person)}</span>`).join(', ') : '<span style="color:#8c7166; font-style:italic; margin-left:6px;">मानकरी उपलब्ध</span>'}
          </div>
          <div>
            <span style="color:#8b261e; font-weight:700;">🌆 सायंकाळ (${time12(db.settings?.eveningAartiTime || '20:00')}):</span>
            ${eveningAartis.length ? eveningAartis.map(a => `<span style="font-weight:700; margin-left:6px; color:#2c1b18;">👤 ${escapeHtml(a.person)}</span>`).join(', ') : '<span style="color:#8c7166; font-style:italic; margin-left:6px;">मानकरी उपलब्ध</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="public-container">
      <!-- Public Header Banner -->
      <div class="public-header">
        <div style="font-size:30px; margin-bottom:2px;">॥ श्री गणेशाय नमः ॥</div>
        <h1>${currentMandal.name}</h1>
        <p style="margin:4px 0 10px 0; opacity:0.9; font-size:12px;">${currentMandal.city}${currentMandal.nondani ? ' | <b>नोंदणी क्र. ' + currentMandal.nondani + '</b>' : ''}</p>
        <span class="public-header-badge">🌸 भक्त व ग्रामस्थ पारदर्शक माहिती दालन (Public Portal) 🌸</span>
      </div>

      <!-- Section 1: Daily Bappa Alankar & Mukh Darshan Gallery -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <h3>🌺 श्री बाप्पा दैनंदिन मुखदर्शन व पूजा अलंकार (${galleryImages.length} फोटो)</h3>
          <span style="font-size:11px; color:#8b261e; font-weight:600;">👆 फोटोवर टॅप करा — स्लाइड करा (Swipe Gallery)</span>
        </div>
        <div class="alankar-grid">
          ${galleryHtml}
        </div>
      </div>


      <!-- Section 2: Financial Summary Cards -->
      <section class="stats" style="margin-bottom:20px;">
        <div class="stat-card income">
          <div class="stat-head"><span>एकूण जमा (Total Collection)</span><span class="stat-icon">↗</span></div>
          <div class="money">${rupees(inc)}</div>
        </div>
        <div class="stat-card expense">
          <div class="stat-head"><span>एकूण खर्च (Total Expenses)</span><span class="stat-icon">↘</span></div>
          <div class="money">${rupees(exp)}</div>
        </div>
        <div class="stat-card balance">
          <div class="stat-head"><span>शिल्लक (Net Balance)</span><span class="stat-icon">◈</span></div>
          <div class="money">${rupees(bal)}</div>
        </div>
      </section>

      <!-- Section 3: Aarti Timetable (2 Days Shown + View More Toggle) & Announcements -->
      <div class="layout-split" style="margin-bottom:20px;">
        <div class="card">
          <div class="card-title"><h3>🪔 श्री गणेश महाआरती वेळापत्रक (Aarti Timetable)</h3></div>
          <div style="margin-top:10px;">
            ${aartiScheduleHtml}
            <div style="text-align:center; margin-top:10px; padding-top:6px; border-top:1px dashed #e8d5c4;">
              <button id="publicAartiToggleBtn" class="text-link" style="font-weight:700; color:#8b261e; font-size:12px; cursor:pointer;" onclick="togglePublicAartis()">
                ▼ View all 7 days aarti (सर्व ७ दिवसांचे वेळापत्रक पहा)
              </button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h3>✦ कार्यक्रम व सूचना (Announcements)</h3></div>
          ${upcomingEvents.length ? upcomingEvents.map(eventSmall).join('') : '<div class="empty"><div class="empty-icon">📢</div>अद्याप कोणतीही सूचना नाही.</div>'}
        </div>
      </div>

      <!-- Section 4: Transparency Financial Ledgers -->
      <div class="layout-split" style="margin-bottom:20px;">
        <div class="card">
          <div class="card-title"><h3>₹ देणगी व वर्गणी सूची (Donation Ledger)</h3></div>
          ${tableWrap(`<thead><tr><th>दिनांक</th><th>देणगीदार</th><th>प्रकार</th><th>रक्कम</th></tr></thead><tbody>${donationRows || '<tr><td colspan="4" class="empty">अद्याप देणगी नोंद नाही</td></tr>'}</tbody>`)}
          ${sortedDonations.length > 4 ? `
            <div style="text-align:center; margin-top:12px; padding-top:8px; border-top:1px dashed #e8d5c4;">
              <button id="publicDonationToggleBtn" class="text-link" style="font-weight:700; color:#8b261e; font-size:12px; cursor:pointer;" onclick="togglePublicDonations()">
                ▼ View all donations (सर्व देणगीदार पहा - ${sortedDonations.length})
              </button>
            </div>
          ` : ''}
        </div>
        <div class="card">
          <div class="card-title"><h3>💸 खर्च नोंदी व बिल माहिती (Expense Ledger)</h3></div>
          ${tableWrap(`<thead><tr><th>दिनांक</th><th>खर्च तपशील</th><th>रक्कम</th><th>बिल</th></tr></thead><tbody>${expenseRows}</tbody>`)}
          ${sortedExpenses.length > 4 ? `
            <div style="text-align:center; margin-top:12px; padding-top:8px; border-top:1px dashed #e8d5c4;">
              <button id="publicExpenseToggleBtn" class="text-link" style="font-weight:700; color:#8b261e; font-size:12px; cursor:pointer;" onclick="togglePublicExpenses()">
                ▼ View all expenses (सर्व खर्च पहा - ${sortedExpenses.length})
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Section 5: Official Permissions & Documents -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <h3>📁 अधिकृत परवानग्या व कागदपत्रे (Official Permissions)</h3>
          <span style="font-size:11px; color:#8b261e; font-weight:600;">(मंडळाच्या कायदेशीर परवानग्यांची यादी)</span>
        </div>
        ${(db.documents && db.documents.length) ? `
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; margin-top:10px;">
            ${db.documents.map(doc => {
              let hasPhoto = hasValidImage(doc.image);
              let isPdf = isPdfData(doc.image);
              let statusColor = doc.status === 'Approved' ? '#15803d' : '#b45309';
              let statusBg   = doc.status === 'Approved' ? '#dcfce7' : '#fef3c7';
              return `
              <div style="background:#fff8f5; border:1px solid #f0d9cc; border-radius:12px; padding:14px 14px 12px 14px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                  <span style="font-size:26px;">${doc.icon || '📁'}</span>
                  <div>
                    <div style="font-weight:700; font-size:13px; color:#2c1b18; line-height:1.3;">${escapeHtml(doc.title)}</div>
                    <div style="font-size:11px; color:#6e584f; margin-top:2px;">${escapeHtml(doc.issuedBy || 'अधिकृत विभाग')}</div>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:11px; padding:3px 10px; border-radius:6px; font-weight:700; background:${statusBg}; color:${statusColor};">● ${escapeHtml(doc.status || 'Pending')}</span>
                  ${doc.validUntil ? `<span style="font-size:11px; color:#6e584f;">वैधता: ${escapeHtml(doc.validUntil)}</span>` : ''}
                </div>
                ${hasPhoto ? `
                  <div style="margin-top:10px;">
                    <button class="text-link" style="font-weight:700; color:#8b261e; font-size:12px;" onclick="openBill('${escapeHtml(doc.image)}')">
                      ${isPdf ? '📄 View PDF Document' : '🖼️ View Permission Photo'}
                    </button>
                  </div>
                ` : `<div style="margin-top:8px; font-size:11px; color:#9ca3af;">⏳ Photo / PDF not yet uploaded</div>`}
              </div>`;
            }).join('')}
          </div>
        ` : `
          <div class="empty" style="padding:28px 16px; text-align:center;">
            <div class="empty-icon" style="font-size:40px; margin-bottom:8px;">📁</div>
            <p style="color:#6e584f; font-size:13px; margin:0;">अद्याप कोणत्याही अधिकृत परवानग्या नोंदवलेल्या नाहीत.</p>
          </div>
        `}
      </div>

      <!-- Section 6: Public Committee Contacts with Call & WhatsApp Buttons -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">
          <h3>👥 मंडळ कार्यकारिणी व महत्वाचे संपर्क (Committee Contacts)</h3>
        </div>
        <div class="public-contacts-grid">
          ${contactsList.map(c => `
            <div class="public-contact-card">
              <div class="public-contact-header">
                <div class="public-contact-avatar">${escapeHtml(c.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</div>
                <div class="public-contact-info">
                  <strong>${escapeHtml(c.name)}</strong>
                  <span>${escapeHtml(c.role)}</span>
                  <span class="contact-phone">📱 ${escapeHtml(c.phone)}</span>
                </div>
              </div>
              <div class="contact-btn-group">
                <a href="tel:${escapeHtml(c.phone)}" class="btn-call">📞 Call</a>
                <a href="https://api.whatsapp.com/send?phone=91${(c.phone || '').replace(/\D/g, '')}&text=${encodeURIComponent('॥ श्री गणेशाय नमः ॥ नमस्कार, ' + currentMandal.name + ' संदर्भात संपर्क करत आहे.')}" target="_blank" class="btn-wa">💬 WhatsApp</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="text-align:center; padding:16px; color:#6b7280; font-size:11px; border-top:1px solid #e5e7eb;">
        🙏 <b>${currentMandal.name}</b> परिवार | सर्व हक्क सुरक्षित 🙏
      </div>
    </div>
  `;
}

function togglePublicAartis() {
  let extraCards = document.querySelectorAll('.extra-aarti-card');
  let btn = document.getElementById('publicAartiToggleBtn');
  if (!extraCards.length || !btn) return;
  let isHidden = extraCards[0].style.display === 'none';
  extraCards.forEach(r => r.style.display = isHidden ? '' : 'none');
  btn.textContent = isHidden ? '▲ View less (कमी दाखवा)' : '▼ View all 7 days aarti (सर्व ७ दिवसांचे वेळापत्रक पहा)';
}

function togglePublicDonations() {
  let extraRows = document.querySelectorAll('.extra-donation-row');
  let btn = document.getElementById('publicDonationToggleBtn');
  if (!extraRows.length || !btn) return;
  let isHidden = extraRows[0].style.display === 'none';
  extraRows.forEach(r => r.style.display = isHidden ? '' : 'none');
  btn.textContent = isHidden ? '▲ Hide extra donations (कम दाखवा)' : `▼ View all donations (सर्व देणगीदार पहा - ${db.donations.length})`;
}

function togglePublicExpenses() {
  let extraRows = document.querySelectorAll('.extra-expense-row');
  let btn = document.getElementById('publicExpenseToggleBtn');
  if (!extraRows.length || !btn) return;
  let isHidden = extraRows[0].style.display === 'none';
  extraRows.forEach(r => r.style.display = isHidden ? '' : 'none');
  btn.textContent = isHidden ? '▲ Hide extra expenses (कम दाखवा)' : `▼ View all expenses (सर्व खर्च पहा - ${db.expenses.length})`;
}

/* ── Swipeable Photo Gallery Lightbox ───────────────────────────── */
let _galleryItems = [];
let _galleryIdx   = 0;

function openGallery(idx) {
  _galleryItems = (db.alankar || []).filter(a => hasValidImage(a.image));
  if (!_galleryItems.length) return;
  _galleryIdx = Math.min(idx, _galleryItems.length - 1);
  _renderGalleryLightbox();
}

function _renderGalleryLightbox() {
  let item  = _galleryItems[_galleryIdx];
  let total = _galleryItems.length;
  let hasPrev = _galleryIdx > 0;
  let hasNext = _galleryIdx < total - 1;
  let isPdf   = isPdfData(item.image);

  let existing = document.getElementById('galleryLightbox');
  if (existing) existing.remove();

  let lb = document.createElement('div');
  lb.id = 'galleryLightbox';
  lb.innerHTML = `
    <div class="gallery-lb-backdrop" onclick="closeGallery()"></div>
    <div class="gallery-lb-shell">
      <div class="gallery-lb-topbar">
        <span class="gallery-lb-counter">${_galleryIdx + 1} / ${total}</span>
        <span class="gallery-lb-title">${escapeHtml(item.title)}</span>
        <button class="gallery-lb-close" onclick="closeGallery()" aria-label="Close">✕</button>
      </div>
      <div class="gallery-lb-stage" id="galleryStage">
        ${isPdf
          ? `<div style="text-align:center;padding:40px 20px;color:#fff;"><div style="font-size:64px;">📄</div><p style="margin:12px 0 20px;">${escapeHtml(item.title)}</p><a href="${escapeHtml(item.image)}" target="_blank" class="primary-btn">Open PDF</a></div>`
          : `<img class="gallery-lb-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" draggable="false">`}
      </div>
      <div class="gallery-lb-info">
        <span>📅 ${dateLabelInMarathi(item.date)}</span>
        ${item.note ? `<span style="margin-left:10px;opacity:0.8;">${escapeHtml(item.note)}</span>` : ''}
      </div>
      <div class="gallery-lb-nav">
        <button class="gallery-nav-btn" onclick="galleryPrev()" ${hasPrev ? '' : 'disabled'} aria-label="Previous">‹</button>
        <div class="gallery-dots">
          ${_galleryItems.map((_, i) => `<span class="gallery-dot ${i === _galleryIdx ? 'active' : ''}" onclick="openGallery(${i})"></span>`).join('')}
        </div>
        <button class="gallery-nav-btn" onclick="galleryNext()" ${hasNext ? '' : 'disabled'} aria-label="Next">›</button>
      </div>
    </div>
  `;
  document.body.appendChild(lb);

  // Keyboard navigation
  lb._keyHandler = (e) => {
    if (e.key === 'ArrowLeft')  galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
    if (e.key === 'Escape')     closeGallery();
  };
  document.addEventListener('keydown', lb._keyHandler);

  // Touch swipe
  let stage = document.getElementById('galleryStage');
  let touchStartX = null;
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    let dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) galleryNext(); else galleryPrev();
  }, { passive: true });
}

function galleryPrev() {
  if (_galleryIdx > 0) { _galleryIdx--; _renderGalleryLightbox(); }
}
function galleryNext() {
  if (_galleryIdx < _galleryItems.length - 1) { _galleryIdx++; _renderGalleryLightbox(); }
}
function closeGallery() {
  let lb = document.getElementById('galleryLightbox');
  if (lb) {
    if (lb._keyHandler) document.removeEventListener('keydown', lb._keyHandler);
    lb.remove();
  }
}

/* Dashboard Page */
function dashboard() {
  let inc = sum(db.donations), exp = sum(db.expenses);
  let allAartis = [...db.aartis].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let up = sortEventsChronological(db.events).slice(0, 4);
  let notifGranted = ('Notification' in window) && Notification.permission === 'granted';

  let notifBanner = !notifGranted ? `
    <div class="notif-banner">
      <div class="notif-text">
        <strong>🔔 Enable Mandap Push Notifications</strong>
        <span>Get instant Aarti alerts and important notices even with the app closed.</span>
      </div>
      <button class="notif-btn" onclick="requestNotificationPermission()">Enable Notifications</button>
    </div>
  ` : '';

  return shell(
    'नमस्कार, ' + currentMandal.name + ' परिवार!',
    'आजची माहिती आणि झटपट कामे',
    `${notifBanner}
    <section class="welcome">
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
          <button class="quick-btn" onclick="openForm('expense')"><span>💸</span>Add Expense</button>
          <button class="quick-btn" onclick="openForm('aarti')"><span>🪔</span>Add Aarti</button>
          <button class="quick-btn highlight-quick" onclick="openPaymentQR()"><span>▣</span>Collect QR</button>
          <button class="quick-btn" onclick="openAlankarForm()"><span>🌺</span>Add Darshan Photo</button>
          <button class="quick-btn" onclick="go('documents.html')"><span>📁</span>Official Docs</button>
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
  let dayNum = isNaN(d.getDate()) ? '📢' : d.getDate();
  let monthStr = isNaN(d.getTime()) ? 'EVENT' : d.toLocaleString('en', { month: 'short' }).toUpperCase();
  return `
    <div class="announcement">
      <div class="ann-date"><b>${dayNum}</b>${monthStr}</div>
      <div class="ann-copy">
        <strong>${escapeHtml(e.title)}</strong>
        <span style="font-size:11px; color:#8b261e; font-weight:600; display:block; margin-bottom:2px;">${formatEventDateTimeDisplay(e.date)}</span>
        <p>${escapeHtml(e.description || '')}</p>
      </div>
    </div>
  `;
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
  return `${Number(d)}-${m}-${y}`;
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

/* Expenses Page - Always Shows Newest Expenses at TOP */
function expenses() {
  let cats = ['Decoration', 'Prasad', 'Sound System', 'Pooja Material', 'Electricity', 'Transport', 'Other'];
  let list = sortByNewest(db.expenses);
  let total = sum(list);
  let groups = cats.map(c => [c, sum(list.filter(x => x.category === c))]).filter(x => x[1]);

  let rows = list.map(e => `
    <tr>
      <td>${dateLabel(e.date)}</td>
      <td>
        <div class="trans-info">
          <strong>${escapeHtml(e.description)}</strong>
          <span>${escapeHtml(e.category)}${hasValidImage(e.image) ? ' • 📎 Bill Attached' : ''}</span>
        </div>
      </td>
      <td>${escapeHtml(e.paidBy)}</td>
      <td class="amount expense-t">${rupees(e.amount)}</td>
      <td>
        ${hasValidImage(e.image) ? `<button class="text-link view-bill-btn" onclick="openBill('${escapeHtml(e.image)}')">👁 View Bill</button>` : '<span class="no-bill-badge">No bill available</span>'}
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
        ${hasValidImage(e.image) ? `<button class="text-link view-bill-btn" onclick="openBill('${escapeHtml(e.image)}')">👁 View Bill</button>` : '<span class="no-bill-badge">No bill available</span>'}
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

/* Donations Page - Always Shows Newest Donations at TOP */
function donations() {
  let total = sum(db.donations);
  let list = sortByNewest(db.donations);

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

/* Aarti Timetable Page (7 Festival Days: 14 to 20 Sept 2026) */
function aarti() {
  let daysHtml = FESTIVAL_DATES.map(fd => {
    let dayAartis = (db.aartis || []).filter(a => a.date === fd.date);
    let morningAartis = dayAartis.filter(a => a.type === 'Morning');
    let eveningAartis = dayAartis.filter(a => a.type === 'Evening');

    if (aartiFilter === 'Morning' && !morningAartis.length) return '';
    if (aartiFilter === 'Evening' && !eveningAartis.length) return '';

    return `
      <div class="aarti-day-card">
        <div class="aarti-day-title">
          <span>🪔 <b>${fd.title}</b></span>
          <button class="text-link" style="font-size:11px; font-weight:700; color:#8b261e;" onclick="openForm('aarti', { date: '${fd.date}' })">+ Add Aarti</button>
        </div>
        <div style="padding:10px 14px;">
          <!-- Morning Slot -->
          ${(aartiFilter === 'all' || aartiFilter === 'Morning') ? `
            <div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #f0e2d5;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; font-weight:700; color:#8b261e;">🌅 सकाळची महाआरती (${time12(db.settings?.morningAartiTime || '09:00')}):</span>
                <span class="tag morning">Morning</span>
              </div>
              ${morningAartis.length ? morningAartis.map(a => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; background:#fffcf9; padding:6px 10px; border-radius:8px; border:1px solid #f7ebd9;">
                  <div>
                    <strong>👤 ${escapeHtml(a.person)}</strong>
                    ${a.note ? `<br><small class="muted">${escapeHtml(a.note)}</small>` : ''}
                  </div>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <button class="whatsapp-btn-sm" onclick="openAartiMessageModal('${a.date}', 'Morning')">💬 WhatsApp</button>
                    <button class="table-action" onclick="editItem('aarti','${a.id}')">•••</button>
                  </div>
                </div>
              `).join('') : `
                <div class="aarti-slot-empty">
                  <span>अद्याप मानकरी नोंदवलेले नाहीत.</span>
                  <button class="text-link" onclick="openForm('aarti', { date: '${fd.date}', type: 'Morning' })">+ नोंदवा</button>
                </div>
              `}
            </div>
          ` : ''}

          <!-- Evening Slot -->
          ${(aartiFilter === 'all' || aartiFilter === 'Evening') ? `
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; font-weight:700; color:#8b261e;">🌆 सायंकाळची महाआरती (${time12(db.settings?.eveningAartiTime || '20:00')}):</span>
                <span class="tag evening">Evening</span>
              </div>
              ${eveningAartis.length ? eveningAartis.map(a => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; background:#fffcf9; padding:6px 10px; border-radius:8px; border:1px solid #f7ebd9;">
                  <div>
                    <strong>👤 ${escapeHtml(a.person)}</strong>
                    ${a.note ? `<br><small class="muted">${escapeHtml(a.note)}</small>` : ''}
                  </div>
                  <div style="display:flex; gap:6px; align-items:center;">
                    <button class="whatsapp-btn-sm" onclick="openAartiMessageModal('${a.date}', 'Evening')">💬 WhatsApp</button>
                    <button class="table-action" onclick="editItem('aarti','${a.id}')">•••</button>
                  </div>
                </div>
              `).join('') : `
                <div class="aarti-slot-empty">
                  <span>अद्याप मानकरी नोंदवलेले नाहीत.</span>
                  <button class="text-link" onclick="openForm('aarti', { date: '${fd.date}', type: 'Evening' })">+ नोंदवा</button>
                </div>
              `}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  return shell(
    'Aarti Timetable (१४ ते २० सप्टेंबर २०२६)',
    '७ दिवसीय श्री गणेश उत्सव महाआरती वेळापत्रक',
    `<div class="card">
      <div class="toolbar">
        <div class="section-tabs">
          <button class="tab ${aartiFilter === 'all' ? 'active' : ''}" onclick="setAartiFilter('all')">All 7 Days</button>
          <button class="tab ${aartiFilter === 'Morning' ? 'active' : ''}" onclick="setAartiFilter('Morning')">Morning (९:०० AM)</button>
          <button class="tab ${aartiFilter === 'Evening' ? 'active' : ''}" onclick="setAartiFilter('Evening')">Evening (८:०० PM)</button>
        </div>
        <button class="primary-btn" onclick="openForm('aarti')">+ Add Aarti</button>
      </div>
      <div style="margin-top:14px;">
        ${daysHtml}
      </div>
    </div>`
  );
}

function setAartiFilter(filter) { aartiFilter = filter; render(); }

/* Events Page */
function events() {
  let notifGranted = ('Notification' in window) && Notification.permission === 'granted';
  let notifBanner = !notifGranted ? `
    <div class="notif-banner" style="margin-bottom:14px;">
      <div class="notif-text">
        <strong>🔔 Enable Mandap & Event Push Notifications</strong>
        <span>Receive instant notifications when new events or urgent announcements are posted.</span>
      </div>
      <button class="notif-btn" onclick="requestNotificationPermission()">Enable Notifications</button>
    </div>
  ` : '';

  return shell(
    'Events & Announcements',
    'मंडळाच्या कार्यक्रमांची माहिती',
    `${notifBanner}
    <div class="toolbar">
      <input class="search" placeholder="Search notices…" oninput="filterCards(this,'eventCards')">
      <button class="primary-btn" onclick="openForm('event')">+ Add Announcement</button>
    </div>
    <div class="contacts" id="eventCards">
      ${sortEventsChronological(db.events).map(e => `
        <article class="contact">
          <div class="ann-date"><b>${new Date(e.date).getDate() || '📢'}</b>${new Date(e.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</div>
          <div style="flex:1">
            <strong style="font-size:14px; color:#2c1b18;">${escapeHtml(e.title)}</strong>
            <span style="color:#8b261e; font-weight:600; font-size:11.5px; margin:2px 0;">📅 ${formatEventDateTimeDisplay(e.date)}</span>
            ${e.description ? `<p style="margin:4px 0 0 0; font-size:12px; color:#5c473e; line-height:1.45;">${escapeHtml(e.description)}</p>` : ''}
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

/* Reports Page with One-Click Audit Report Bundle Generator */
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
      <button class="primary-btn" onclick="openAuditReportBundle()">📦 Audit Report Bundle</button>
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

/* Form Uploader supporting Single or Multiple Bappa Alankar Photos */
function openAlankarForm() {
  modal(
    'Upload Daily Bappa Mukh Darshan Photo',
    `<form onsubmit="submitAlankarForm(event)">
      <div class="form-grid">
        <div class="field full"><label>Title / Decoration details</label><input name="title" required placeholder="e.g. प्रथम दिन - पुष्प शृंगार पूजा"></div>
        <div class="field"><label>Date</label><input name="date" type="date" value="${today}"></div>
        <div class="field full"><label>Select Bappa Photo(s) (Multiple allowed)</label><input name="image" type="file" accept="image/*" multiple required onchange="previewMultiInput(this)"></div>
        <div class="field full" id="multiPhotoPreview" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;"></div>
        <div class="field full"><label>Optional note</label><textarea name="note" placeholder="e.g. आजची विशेष महाआरती व पुष्प सजावट"></textarea></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="outline-btn" onclick="closeModal()">Cancel</button>
        <button class="primary-btn">Upload Photos</button>
      </div>
    </form>`
  );
}

function previewMultiInput(input) {
  let files = input.files;
  let container = document.getElementById('multiPhotoPreview');
  if (!container || !files || !files.length) return;
  container.innerHTML = `<small style="width:100%; font-weight:600; color:#941838;">Selected ${files.length} photo(s). Compressing for optimal storage…</small>`;
}

async function submitAlankarForm(ev) {
  ev.preventDefault();
  let f = new FormData(ev.target);
  let title = f.get('title');
  let date = f.get('date') || today;
  let note = f.get('note') || '';
  let input = ev.target.querySelector('input[type="file"]');
  let files = input && input.files ? Array.from(input.files).filter(file => file && file.size && file.type.startsWith('image/')) : [];

  if (!files.length) return toast('Please select at least one photo');

  toast(`Uploading ${files.length} photo(s)…`);
  for (let file of files) {
    let compressedUrl = await compressImage(file, 1000, 0.75);
    let item = {
      id: 'k' + Date.now().toString().slice(-5) + Math.floor(Math.random() * 100),
      title: title,
      date: date,
      note: note,
      image: compressedUrl
    };
    db.alankar.unshift(item);
    if (cloud) {
      cloud.from('alankar').insert(toCloud('alankar', item)).then(() => {}).catch(err => console.warn(err));
    }
  }
  save();
  closeModal();
  toast(`${files.length} Bappa photo(s) uploaded!`);
}

/* One-Click Executive Audit Report Bundle Generator */
function openAuditReportBundle() {
  let inc = sum(db.donations), exp = sum(db.expenses), bal = inc - exp;
  let sortedDonations = sortByNewest(db.donations);
  let sortedExpenses = sortByNewest(db.expenses);
  let cats = {};
  db.expenses.forEach(e => cats[e.category] = (cats[e.category] || 0) + Number(e.amount));

  let auditWin = window.open('', '_blank');
  if (!auditWin) return toast('Pop-up blocked! Please allow pop-ups to open Audit Report.');

  auditWin.document.write(`
    <!DOCTYPE html>
    <html lang="mr">
    <head>
      <meta charset="UTF-8">
      <title>वार्षिक जमा-खर्च हिशोब - ${currentMandal.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Noto Sans Devanagari', sans-serif; margin: 30px; color: #1f2937; background: #fff; line-height: 1.5; }
        .header { text-align: center; border-bottom: 3px double #941838; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #941838; margin: 0; font-size: 26px; }
        .header p { margin: 4px 0 0 0; color: #4b5563; font-size: 14px; }
        .reg-no { font-weight: 700; color: #8b261e; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; background: #fdfbf7; }
        .stat-box span { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
        .stat-box b { display: block; font-size: 20px; color: #941838; margin-top: 4px; }
        .section-title { font-size: 16px; font-weight: 700; color: #941838; border-left: 4px solid #941838; padding-left: 10px; margin: 25px 0 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
        th { background: #f3f4f6; font-weight: 700; color: #374151; }
        .text-right { text-align: right; }
        .print-bar { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .btn-print { background: #941838; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; }
        @media print { .print-bar { display: none; } body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="print-bar">
        <span><b>📦 ${currentMandal.name} - वार्षिक हिशोब अहवाल (Audit Report Bundle)</b></span>
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF</button>
      </div>

      <div class="header">
        <h1>॥ श्री गणेशाय नमः ॥</h1>
        <h2 style="margin:6px 0; color:#941838;">${currentMandal.name}</h2>
        <p>${currentMandal.city}${currentMandal.nondani ? ' | <span class=\"reg-no\">नोंदणी क्र. ' + currentMandal.nondani + '</span>' : ''}</p>
        <p><b>वार्षिक जमा-खर्च व हिशोब अहवाल (Audit Summary Report)</b> — दिनांक: ${dateLabelInMarathi(today)}</p>
      </div>

      <div class="summary-grid">
        <div class="stat-box"><span>एकूण जमा (Total Collection)</span><b>${rupees(inc)}</b></div>
        <div class="stat-box"><span>एकूण खर्च (Total Expenses)</span><b>${rupees(exp)}</b></div>
        <div class="stat-box"><span>उर्वरित शिल्लक (Net Balance)</span><b>${rupees(bal)}</b></div>
      </div>

      <div class="section-title">१. प्रकारानुसार खर्च तपशील (Category-wise Expense Breakdown)</div>
      <table>
        <thead><tr><th>अ.क्र.</th><th>खर्च प्रकार (Category)</th><th class="text-right">रक्कम (Amount)</th></tr></thead>
        <tbody>
          ${Object.entries(cats).map(([k, v], i) => `<tr><td>${i + 1}</td><td>${escapeHtml(k)}</td><td class="text-right">${rupees(v)}</td></tr>`).join('')}
          <tr style="font-weight:700; background:#f9fafb;">
            <td colspan="2">एकूण खर्च (Total Expenditure)</td>
            <td class="text-right" style="color:#941838;">${rupees(exp)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">२. देणगी व वर्गणी नोंदवही (Donation Register)</div>
      <table>
        <thead><tr><th>अ.क्र.</th><th>दिनांक</th><th>देणगीदार नाव (Contributor)</th><th>प्रकार</th><th class="text-right">रक्कम</th></tr></thead>
        <tbody>
          ${sortedDonations.map((d, i) => `<tr><td>${i + 1}</td><td>${dateLabelInMarathi(d.date)}</td><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.mode)}</td><td class="text-right">${rupees(d.amount)}</td></tr>`).join('')}
          <tr style="font-weight:700; background:#f9fafb;">
            <td colspan="4">एकूण जमा देणगी (Total Collections)</td>
            <td class="text-right" style="color:#2b783c;">${rupees(inc)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">३. खर्च नोंदवही व बिल जोडपत्र (Expense Ledger & Bills Appendix)</div>
      <table>
        <thead><tr><th>अ.क्र.</th><th>दिनांक</th><th>खर्च तपशील (Description)</th><th>खर्च प्रकार</th><th>जबाबदार सदस्य (Paid By)</th><th class="text-right">रक्कम</th></tr></thead>
        <tbody>
          ${sortedExpenses.map((e, i) => `<tr><td>${i + 1}</td><td>${dateLabelInMarathi(e.date)}</td><td>${escapeHtml(e.description)}</td><td>${escapeHtml(e.category)}</td><td>${escapeHtml(e.paidBy)}</td><td class="text-right">${rupees(e.amount)}</td></tr>`).join('')}
        </tbody>
      </table>

      <div style="margin-top:50px; display:flex; justify-content:space-between; text-align:center; font-weight:700;">
        <div>अध्यक्ष<br><br>_________________</div>
        <div>उपाध्यक्ष<br><br>_________________</div>
        <div>सेक्रेटरी<br><br>_________________</div>
        <div>खजिनदार<br><br>_________________</div>
      </div>
    </body>
    </html>
  `);
  auditWin.document.close();
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
  let isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    readFileAsDataUrl(file).then(pdfUrl => {
      let container = document.getElementById('billFormPreview');
      if (container && pdfUrl) {
        container.innerHTML = `
          <div class="bill-preview-box" style="text-align:center; padding:12px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px;">
            <div style="font-size:32px; margin-bottom:4px;">📄</div>
            <strong style="font-size:13px; color:#0369a1; display:block;">${escapeHtml(file.name)}</strong>
            <span style="font-size:11px; color:#64748b;">(${(file.size / 1024).toFixed(1)} KB PDF)</span>
            <div style="margin-top:8px;">
              <button type="button" class="text-link" onclick="openBill('${pdfUrl}')">👁 View PDF Document</button>
            </div>
          </div>
        `;
      }
    });
    return;
  }
  compressImage(file, 1400, 0.82).then(compressedUrl => {
    let container = document.getElementById('billFormPreview');
    if (container && compressedUrl) {
      container.innerHTML = `
        <div class="bill-preview-box">
          <img src="${compressedUrl}" alt="Document preview">
          <button type="button" class="text-link" onclick="openBill('${compressedUrl}')">👁 View Full Document</button>
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
      <div class="field"><label>WhatsApp Number (optional)</label><input name="phone" inputmode="tel" value="${formatPhoneWithCountryCode(x.phone || '')}" placeholder="+91 98765 43210" oninput="if(this.value.replace(/\D/g,'').length===10){this.value=formatPhoneWithCountryCode(this.value)}" onblur="this.value = formatPhoneWithCountryCode(this.value)"></div>
      <div class="field"><label>Date (Today & Future only)</label><input name="date" type="date" min="${today}" value="${x.date || today}" required></div>
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
      <div class="field full"><label>मानकरी / कुटुंब नाव (Person or Family Name)</label><input name="person" required value="${escapeHtml(x.person || '')}" placeholder="उदा. पाटील परिवार / श्री. राहुल कदम"></div>
      <div class="field"><label>आरती दिनांक (14 to 20 Sept 2026)</label>
        <select name="date">
          ${FESTIVAL_DATES.map(fd => `<option value="${fd.date}" ${(x.date || '2026-09-14') === fd.date ? 'selected' : ''}>${fd.title}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>आरती सत्र (Session)</label>
        <select name="type" onchange="let tf=this.form.querySelector('input[name=time]'); if(tf){ tf.value = this.value==='Morning' ? (db.settings?.morningAartiTime || '09:00') : (db.settings?.eveningAartiTime || '20:00'); }">
          <option value="Morning" ${x.type === 'Morning' ? 'selected' : ''}>🌅 सकाळची महाआरती (${time12(db.settings?.morningAartiTime || '09:00')})</option>
          <option value="Evening" ${x.type === 'Evening' ? 'selected' : ''}>🌆 सायंकाळची महाआरती (${time12(db.settings?.eveningAartiTime || '20:00')})</option>
        </select>
      </div>
      <div class="field"><label>आरती वेळ (Time)</label>
        <input name="time" type="time" value="${x.time || (x.type === 'Evening' ? (db.settings?.eveningAartiTime || '20:00') : (db.settings?.morningAartiTime || '09:00'))}">
      </div>
      <div class="field full"><label>टीप (Optional Note)</label><textarea name="note" placeholder="काही विशेष नोंद असल्यास…">${escapeHtml(x.note || '')}</textarea></div>
    `,
    event: `
      <div class="field full"><label>Title / Announcement Name</label><input name="title" required value="${escapeHtml(x.title || '')}" placeholder="e.g. भजन संध्या किंवा महाप्रसाद"></div>
      <div class="field full"><label>Date & Time (तारीख व वेळ)</label><input name="date" type="datetime-local" required value="${formatDateTimeLocal(x.date)}"></div>
      <div class="field full"><label>Description / Details</label><textarea name="description" placeholder="कार्यक्रमाची संपूर्ण माहिती…">${escapeHtml(x.description || '')}</textarea></div>
      <div class="field full"><label>Event image (optional)</label><input name="image" type="file" accept="image/*"></div>
    `,
    contact: `
      <div class="field full"><label>Name</label><input name="name" required value="${escapeHtml(x.name || '')}"></div>
      <div class="field"><label>Role / designation</label><input name="role" required value="${escapeHtml(x.role || '')}"></div>
      <div class="field"><label>Phone number</label><input name="phone" required inputmode="tel" value="${formatPhoneWithCountryCode(x.phone || '')}" placeholder="+91 98765 43210" oninput="if(this.value.replace(/\D/g,'').length===10){this.value=formatPhoneWithCountryCode(this.value)}" onblur="this.value = formatPhoneWithCountryCode(this.value)"></div>
    `,
    alankar: `
      <div class="field full"><label>Title / Decoration details</label><input name="title" required value="${escapeHtml(x.title || '')}"></div>
      <div class="field"><label>Date</label><input name="date" type="date" value="${x.date || today}"></div>
      <div class="field full"><label>Bappa Photo</label><input name="image" type="file" accept="image/*" onchange="previewBillInput(this)"></div>
      <div class="field full" id="billFormPreview"></div>
      <div class="field full"><label>Optional note</label><textarea name="note">${escapeHtml(x.note || '')}</textarea></div>
    `,
    document: `
      <div class="field full"><label>Document Title</label><input name="title" required value="${escapeHtml(x.title || '')}"></div>
      <div class="field"><label>Category</label><select name="category">${['Police Permission', 'Gram Panchayat NOC', 'MSEDCL Electricity', 'Sound / Loudspeaker', 'Trust Registration', 'Other'].map(v => `<option ${x.category === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Outward No (जावक क्र.)</label><input name="outwardNo" value="${escapeHtml(x.outwardNo || '')}"></div>
      <div class="field full"><label>Issuing Office</label><input name="issuedBy" required value="${escapeHtml(x.issuedBy || '')}"></div>
      <div class="field"><label>Valid Until</label><input name="validUntil" value="${escapeHtml(x.validUntil || '2026-08-30')}"></div>
      <div class="field full"><label>Document Scan / PDF File</label><input name="image" type="file" accept="image/*,application/pdf,.pdf" onchange="previewBillInput(this)"></div>
      <div class="field full" id="billFormPreview">
        ${x.image ? `<div class="bill-preview-box"><img src="${x.image}" alt="Attached Document"><button type="button" class="text-link" onclick="openBill('${x.image}')">👁 View Full Document</button></div>` : ''}
      </div>
      <div class="field full"><label>Notes</label><textarea name="note">${escapeHtml(x.note || '')}</textarea></div>
    `
  }[type];

  let extraActions = type === 'donation' ? `<button type="button" class="outline-btn qr-inline" onclick="openPaymentQR()">▣ Show Payment QR</button>` : '';

  modal(
    (item ? 'Edit ' : 'Add ') + type.charAt(0).toUpperCase() + type.slice(1),
    `<form onsubmit="submitForm(event,'${type}','${x.id || ''}')" novalidate>
      <div class="form-grid">${fields}</div>
      <div class="modal-actions">
        ${extraActions}
        <button type="button" class="outline-btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="primary-btn">Save ${item ? 'changes' : ''}</button>
      </div>
    </form>`
  );
}

async function submitForm(ev, type, id) {
  ev.preventDefault();
  let f = new FormData(ev.target), o = Object.fromEntries(f.entries());

  if (o.phone) {
    o.phone = formatPhoneWithCountryCode(o.phone);
  }

  if (type === 'donation') {
    if (!o.name || !o.name.trim()) {
      toast('कृपया नाव प्रविष्ट करा (Please enter donor name)');
      return;
    }
    if (!o.amount || Number(o.amount) <= 0) {
      toast('कृपया देणगी रक्कम प्रविष्ट करा (Please enter valid amount)');
      return;
    }
    if (!o.date) o.date = today;
  }

  if (type === 'expense') {
    if (!o.amount || Number(o.amount) <= 0) {
      toast('कृपया खर्च रक्कम प्रविष्ट करा (Please enter valid amount)');
      return;
    }
    if (!o.description || !o.description.trim()) {
      toast('कृपया खर्च तपशील प्रविष्ट करा (Please enter description)');
      return;
    }
  }

  if (type === 'aarti') { if (!o.time) { o.time = o.type === 'Morning' ? (db.settings?.morningAartiTime || '09:00') : (db.settings?.eveningAartiTime || '20:00'); } }
  if (['donation', 'expense'].includes(type)) o.amount = Number(o.amount);

  if (type === 'expense') {
    showLoader('खर्च नोंदवला जात आहे... (Saving Expense...)');
  } else if (type === 'donation') {
    showLoader('देणगी नोंदवली जात आहे... (Saving Donation...)');
  } else {
    showLoader('माहिती सेव्ह होत आहे... (Saving...)');
  }

  let file = f.get('image');
  if (file && file.size) {
    let isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      if (file.size > 8 * 1024 * 1024) {
        hideLoader();
        toast('कृपया 8MB पेक्षा लहान PDF निवडा (Please choose PDF under 8MB)');
        return;
      }
      o.image = await readFileAsDataUrl(file);
      await saveItem(type, id, o);
    } else if (file.type && file.type.startsWith('image/')) {
      o.image = await compressImage(file, 1400, 0.82);
      await saveItem(type, id, o);
    } else {
      let list = db[listName[type]];
      let existingItem = id && list ? list.find(x => String(x.id) === String(id)) : null;
      o.image = (existingItem && hasValidImage(existingItem.image)) ? existingItem.image : '';
      await saveItem(type, id, o);
    }
  } else {
    let list = db[listName[type]];
    let existingItem = id && list ? list.find(x => String(x.id) === String(id)) : null;
    o.image = (existingItem && hasValidImage(existingItem.image)) ? existingItem.image : '';
    await saveItem(type, id, o);
  }
}

async function saveItem(type, id, o) {
  let list = db[listName[type]];
  let index = id ? list.findIndex(x => String(x.id) === String(id)) : -1;
  if (id) {
    o.id = id;
    o.image = hasValidImage(o.image) ? o.image : ((list[index] && hasValidImage(list[index].image)) ? list[index].image : '');
    list[index] = o;
  } else {
    o.id = type[0] + (Date.now().toString().slice(-5));
    o.image = hasValidImage(o.image) ? o.image : '';
    list.unshift(o);
  }
  save();
  render();

  let syncFailed = false;
  if (cloud) {
    let isCloudId = id && String(id).includes('-');
    let payload = toCloud(type, o);

    try {
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
        if (error.code !== 'PGRST205') {
          syncFailed = true;
          console.warn('Supabase Error:', error);
        }
      }

      if (data) {
        let updated = fromCloud(type, data);
        let localIndex = list.findIndex(x => String(x.id) === String(o.id));
        if (localIndex >= 0) list[localIndex] = updated;
        save();
        render();
      }
    } catch (err) {
      syncFailed = true;
      console.warn('Save item cloud sync error:', err);
    }
  }

  hideLoader();
  closeModal();

  if (syncFailed) {
    toast('⚠️ स्थानिक सेव्ह झाले (Cloud sync error)');
  } else {
    if (type === 'donation') {
      openReceiptModal(o.id);
    } else if (type === 'expense') {
      toast('✅ खर्च नोंद यशस्वी! (Expense registered successfully)');
    } else {
      toast('✅ यशस्वीरीत्या जतन झाले! (Saved successfully)');
    }
  }

  if (type === 'event') {
    let notifTitle = '📢 नवीन सूचना: ' + (o.title || 'कार्यक्रम');
    let notifBody = (o.description ? o.description + ' • ' : '') + formatEventDateTimeDisplay(o.date);
    if (('Notification' in window) && Notification.permission === 'granted') {
      sendLocalNotification(notifTitle, notifBody);
    } else if (('Notification' in window) && Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') sendLocalNotification(notifTitle, notifBody);
      });
    }
  }
}

function guardEdit(type, id) {
  editing = { type, id };
  modal('Financial PIN Required', `<div class="pin-art">🔐</div><p class="pin-note">Enter the shared committee PIN to edit or upload official documents.</p><form onsubmit="checkPin(event)"><div class="field"><input class="pin-input" name="pin" type="password" inputmode="numeric" maxlength="4" autofocus placeholder="••••"></div><div class="modal-actions"><button class="primary-btn">Continue</button></div></form>`);
}

async function checkPin(e) {
  e.preventDefault();
  let enteredPin = new FormData(e.target).get('pin');
  let enteredHash = await hashPin(enteredPin);
  if (enteredHash === getFinancialPinHash()) {
    let { type, id } = editing;
    closeModal();
    if (type === 'document') {
      manageDocument(id);
    } else {
      manageFinancial(type, id);
    }
  } else {
    toast('Incorrect PIN. Please try again.');
  }
}

function manageDocument(id) {
  let doc = (db.documents || []).find(x => String(x.id) === String(id));
  if (!doc) return;
  modal('Manage Official Document / Permission', `
    <p class="delete-text">PIN verified. You can edit permission details, upload/replace photo, or delete this permission.</p>
    <div class="modal-actions" style="justify-content:center; gap:10px;">
      <button class="outline-btn" onclick="openDocForm(getItem('document','${id}'))">✏️ Edit Details & Photo</button>
      <button class="primary-btn" style="background:#dc2626; border-color:#dc2626;" onclick="confirmDelete('document','${id}')">🗑️ Delete Permission</button>
    </div>
  `);
}

function manageFinancial(type, id) {
  modal('Manage financial entry', `<p class="delete-text">The PIN has been verified. You can now edit or remove this ${type} entry.</p><div class="modal-actions"><button class="outline-btn" onclick="openForm('${type}',getItem('${type}','${id}'))">Edit</button><button class="primary-btn" onclick="confirmDelete('${type}','${id}')">Delete</button></div>`);
}

function editItem(type, id) {
  let list = getItemList(type);
  let x = list.find(i => String(i.id) === String(id));
  if (['donation', 'expense', 'document'].includes(type)) return guardEdit(type, id);
  modal('Manage entry', `<p class="delete-text">Edit or remove this ${type} entry.</p><div class="modal-actions"><button class="outline-btn" onclick="openForm('${type}',getItem('${type}','${id}'))">Edit</button><button class="primary-btn" onclick="confirmDelete('${type}','${id}')">Delete</button></div>`);
}

function getItemList(type) {
  return { donation: db.donations, expense: db.expenses, aarti: db.aartis, event: db.events, contact: db.contacts, alankar: db.alankar, document: db.documents }[type];
}

function getItem(type, id) {
  return getItemList(type).find(x => String(x.id) === String(id));
}

function confirmDelete(type, id) {
  modal('Delete entry?', `<p class="delete-text">This cannot be undone. Are you sure you want to delete this entry?</p><div class="modal-actions"><button class="outline-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" onclick="deleteItem('${type}','${id}')">Yes, Delete</button></div>`);
}

async function deleteItem(type, id) {
  let key = listName[type];
  if (!db[key]) db[key] = [];
  db[key] = db[key].filter(x => String(x.id) !== String(id));
  save();
  closeModal();
  toast('Entry deleted successfully');
  render();
  if (cloud) {
    try {
      let query = cloud.from(tableName[type]).delete().eq('id', id);
      if (currentMandal && currentMandal.id) {
        query = query.eq('mandal_id', currentMandal.id);
      }
      let { error } = await query;
      if (error && error.code !== 'PGRST205') {
        console.warn('Cloud delete warning:', error.message || error);
      }
    } catch(err) {
      console.warn('Cloud delete error:', err);
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
  if (!hasValidImage(image)) {
    modal('Document / Photo View', `
      <div class="bill-modal-content no-bill-view">
        <div class="no-bill-icon">🧾</div>
        <h4>No bill available</h4>
        <p>या खर्चासाठी कोणतीही पावती किंवा बिल जोडलेले नाही.</p>
        <div class="modal-actions" style="justify-content:center; margin-top:14px;">
          <button class="outline-btn" onclick="closeModal()">Close</button>
        </div>
      </div>
    `);
    return;
  }
  if (isPdfData(image)) {
    modal('Document / Photo View', `
      <div class="bill-modal-content" style="text-align:center;">
        <div style="font-size:52px; margin-bottom:8px;">📄</div>
        <h4 style="color:#7d1c12; margin:0 0 6px 0;">Official PDF Document</h4>
        <p style="color:#6e584f; font-size:13px; margin:0 0 14px 0;">हे कागदपत्र PDF स्वरूपात उपलब्ध आहे.</p>
        <div style="margin-bottom:14px;">
          <iframe src="${escapeHtml(image)}" style="width:100%; height:360px; border:1px solid #e0cdc0; border-radius:10px;" title="PDF Preview"></iframe>
        </div>
        <div class="modal-actions" style="justify-content:center; gap:10px;">
          <a class="primary-btn" href="${escapeHtml(image)}" download="mandal-document.pdf" target="_blank">⬇️ Download / Open PDF</a>
          <button class="outline-btn" onclick="closeModal()">Close</button>
        </div>
      </div>
    `);
    return;
  }
  modal('Document / Photo View', `
    <div class="bill-modal-content">
      <img class="bill-preview" src="${escapeHtml(image)}" alt="Document view" onerror="this.style.display='none'; document.getElementById('billErrorPlaceholder').style.display='block';">
      <div id="billErrorPlaceholder" style="display:none; text-align:center; padding:24px 16px;">
        <div style="font-size:44px; margin-bottom:10px;">🧾</div>
        <h4 style="color:#8b261e; margin:0 0 6px 0;">No bill available</h4>
        <p style="color:#6e584f; font-size:12px; margin:0;">बिलाचा फोटो उपलब्ध नाही किंवा लोड होऊ शकला नाही.</p>
      </div>
      <div class="modal-actions" style="justify-content:center; margin-top:14px;">
        <a class="primary-btn" href="${escapeHtml(image)}" download="mandal-bill-photo.jpg" target="_blank">⬇️ Download Document</a>
        <button class="outline-btn" onclick="closeModal()">Close</button>
      </div>
    </div>
  `);
}


/* Generic Canvas Receipt — for mandals without a physical receipt template */
function generateGenericReceiptCanvas(d) {
  return new Promise((resolve) => {
    try {
      let canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 520;
      let ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#fffaf5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer border (double)
      ctx.strokeStyle = '#9f2e20';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      // Corner decorations
      let corners = [[30,30],[canvas.width-30,30],[30,canvas.height-30],[canvas.width-30,canvas.height-30]];
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#9f2e20';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      corners.forEach(([x,y]) => ctx.fillText('✿', x, y));

      // Header OM
      ctx.font = 'bold 32px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#9f2e20';
      ctx.textAlign = 'center';
      ctx.fillText('॥ श्री गणेशाय नमः ॥', canvas.width / 2, 68);

      // Mandal Name
      ctx.font = 'bold 26px "Noto Sans Devanagari", sans-serif';
      ctx.fillText(currentMandal.name, canvas.width / 2, 110);

      // City + Nondani
      ctx.font = '16px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#6b2a1a';
      let cityNondani = currentMandal.city + (currentMandal.nondani ? ' | नोंदणी क्र. ' + currentMandal.nondani : '');
      ctx.fillText(cityNondani, canvas.width / 2, 136);

      // Divider line
      ctx.strokeStyle = '#9f2e20';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 150); ctx.lineTo(canvas.width - 40, 150);
      ctx.stroke();

      // Title: देणगी पावती
      ctx.font = 'bold 22px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#9f2e20';
      ctx.textAlign = 'center';
      ctx.fillText('देणगी पावती', canvas.width / 2, 178);

      // Receipt details — left-aligned
      ctx.textAlign = 'left';
      ctx.font = '18px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#2c1b18';
      let receiptNo = String(d.id).replace(/\D/g, '').slice(-5) || '00001';
      let dateFormatted = d.date ? d.date.split('-').reverse().join('-') : today;
      let lx = 80, rx = 500, lineH = 40;
      let startY = 220;

      let fields = [
        ['पावती क्र.', receiptNo, 'दिनांक', dateFormatted],
        ['श्री/श्रीमती', d.name || '', '', ''],
        ['रक्कम', '₹' + (d.amount || 0) + '/-', 'प्रकार', d.mode || ''],
        ['अक्षरी', numberToMarathiWords(d.amount || 0), '', ''],
      ];

      fields.forEach((row, i) => {
        let y = startY + i * lineH;
        ctx.font = 'bold 15px "Noto Sans Devanagari", sans-serif';
        ctx.fillStyle = '#9f2e20';
        ctx.fillText(row[0] + ':', lx, y);
        ctx.font = 'bold 17px "Noto Sans Devanagari", sans-serif';
        ctx.fillStyle = '#1a0a08';
        ctx.fillText(row[1], lx + 130, y);
        if (row[2]) {
          ctx.font = 'bold 15px "Noto Sans Devanagari", sans-serif';
          ctx.fillStyle = '#9f2e20';
          ctx.fillText(row[2] + ':', rx, y);
          ctx.font = 'bold 17px "Noto Sans Devanagari", sans-serif';
          ctx.fillStyle = '#1a0a08';
          ctx.fillText(row[3], rx + 110, y);
        }
      });

      // Bottom divider
      ctx.strokeStyle = '#9f2e20';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 390); ctx.lineTo(canvas.width - 40, 390);
      ctx.stroke();

      // Thank you
      ctx.font = '16px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#7d1c12';
      ctx.textAlign = 'center';
      ctx.fillText('आपल्या देणगीबद्दल मनःपूर्वक धन्यवाद! 🙏', canvas.width / 2, 418);
      ctx.font = 'bold 14px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#a07060';
      ctx.fillText('( मंडळाचे अधिकृत डिजिटल पावती / Official Digital Receipt )', canvas.width / 2, 445);

      // Bottom signature area
      ctx.font = '13px "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#9f2e20';
      ctx.textAlign = 'left';
      ctx.fillText('सही / Signature:', 80, 490);
      ctx.strokeStyle = '#9f2e20';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 492); ctx.lineTo(400, 492);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(currentMandal.name, canvas.width - 60, 490);

      resolve(canvas.toDataURL('image/png'));
    } catch(err) {
      console.warn('Generic receipt canvas error:', err);
      resolve('');
    }
  });
}

/* Digital Pavati HTML5 Canvas Image Generator (Exact Final Coordinates) */
function generateReceiptCanvas(d, config = RECEIPT_CONFIG) {
  // For non-vrindavan mandals, use the generic canvas receipt
  if (currentMandal.slug !== 'vrindavan') return generateGenericReceiptCanvas(d);
  return new Promise((resolve) => {
    function draw(img) {
      try {
        let canvas = document.createElement('canvas');
        canvas.width = img.width || 1024;
        canvas.height = img.height || 629;
        let ctx = canvas.getContext('2d');

        // Preserve original template colors, dimensions, and design
        ctx.drawImage(img, 0, 0);

        let dateStr = dateLabelInMarathi(d.date) || d.date || '20-08-2026';
        let nameStr = d.name || 'Donor';
        let amountStr = (d.amount !== undefined ? d.amount : '0') + '/-';
        let wordsStr = d.amount_words || numberToMarathiWords(d.amount || 0);

        ctx.fillStyle = config.TEXT_COLOR || '#941838'; // Dark red/maroon ink color
        ctx.textBaseline = 'middle';
        ctx.imageSmoothingEnabled = true;

        // 1. Date (दिनांक)
        ctx.font = `bold ${config.DATE_FONT_SIZE || 22}px ${config.FONT_FAMILY || '"Noto Sans Devanagari", sans-serif'}`;
        ctx.fillText(dateStr, config.DATE_X, config.DATE_Y);

        // 2. Donor Name (नाव श्री.)
        ctx.font = `bold ${config.NAME_FONT_SIZE || 24}px ${config.FONT_FAMILY || '"Noto Sans Devanagari", sans-serif'}`;
        ctx.fillText(nameStr, config.NAME_X, config.NAME_Y);

        // 3. Donation Amount Numeric (देणगी रक्कम अंकी)
        ctx.font = `bold ${config.AMOUNT_FONT_SIZE || 24}px ${config.FONT_FAMILY || '"Noto Sans Devanagari", sans-serif'}`;
        ctx.fillText(amountStr, config.AMOUNT_X, config.AMOUNT_Y);

        // 4. Donation Amount Words (देणगी रक्कम अक्षरी)
        ctx.font = `bold ${config.AMOUNT_WORDS_FONT_SIZE || 20}px ${config.FONT_FAMILY || '"Noto Sans Devanagari", sans-serif'}`;
        ctx.fillText(wordsStr, config.AMOUNT_WORDS_X, config.AMOUNT_WORDS_Y);

        // 5. Bottom Amount Box (रु. Box)
        ctx.font = `bold ${config.BOTTOM_AMOUNT_FONT_SIZE || 24}px ${config.FONT_FAMILY || '"Noto Sans Devanagari", sans-serif'}`;
        ctx.fillText(amountStr, config.BOTTOM_AMOUNT_X, config.BOTTOM_AMOUNT_Y);

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Canvas export error:', err);
        resolve('');
      }
    }

    if (preloadedReceiptImg.complete && preloadedReceiptImg.naturalWidth > 0) {
      draw(preloadedReceiptImg);
    } else {
      let fallback = new Image();
      fallback.onload = () => draw(fallback);
      fallback.onerror = () => resolve('');
      fallback.src = 'assets/receipt_template.png';
    }
  });
}

/* WhatsApp Text Donation Receipt Generator */
const DEFAULT_WA_TEMPLATE = `॥ श्री गणेशाय नमः ॥

{mandal_name}

देणगी पावती क्र.: {receipt_no}
श्री/श्रीमती: {name}
रक्कम: ₹{amount}/-
अक्षरी: {amount_words}
दिनांक: {date}

आपल्या देणगीबद्दल मनःपूर्वक धन्यवाद! 🙏

📱 मंडळाचे ऑनलाईन माहिती पोर्टल उपलब्ध आहे.

पोर्टलवर आपण दररोजचे गणरायाचे फोटो, आरती वेळापत्रक, कार्यक्रम, देणगी माहिती व खर्चाचा पारदर्शक हिशोब पाहू शकता.

🔗 पोर्टल लिंक:
https://ganpati-mandal-zeta.vercel.app/public.html?mandal={mandal_slug}

सर्वांनी पोर्टलला भेट द्यावी व इतरांनाही शेअर करावे.

🙏 {mandal_name} 🌺`;

function receiptText(d) {
  let receiptNo = String(d.id).replace(/\D/g, '').slice(-5) || '23758';
  let dateFormatted = d.date ? d.date.split('-').reverse().join('-') : today.split('-').reverse().join('-');
  let template = (db.settings && db.settings.waTemplate) ? db.settings.waTemplate : DEFAULT_WA_TEMPLATE;
  return template
    .replace(/{mandal_name}/g, currentMandal.name)
    .replace(/{mandal_slug}/g, currentMandal.slug)
    .replace(/{receipt_no}/g, receiptNo)
    .replace(/{name}/g, d.name || '')
    .replace(/{amount}/g, d.amount || 0)
    .replace(/{amount_words}/g, numberToMarathiWords(d.amount || 0))
    .replace(/{date}/g, dateFormatted)
    .replace(/{mode}/g, d.mode || '');
}

function getWhatsAppReceiptUrl(d) {
  let phoneDigits = getCleanWhatsAppDigits(d.phone);
  let text = encodeURIComponent(receiptText(d));
  return phoneDigits ? `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
}

function copyReceiptText(id) {
  let d = db.donations.find(x => String(x.id) === String(id));
  if (!d) return;
  navigator.clipboard.writeText(receiptText(d));
  toast('Receipt text copied!');
}

function dataURLtoBlob(dataurl) {
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function downloadCanvasDataUrl(dataurl, filename) {
  if (!dataurl) return;
  try {
    let blob = dataURLtoBlob(dataurl);
    let blobUrl = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (e) {
    let a = document.createElement('a');
    a.href = dataurl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function downloadReceiptImageDirect(id) {
  let d = db.donations.find(x => String(x.id) === String(id));
  let canvasDataUrl = currentModalReceiptData;
  if (!canvasDataUrl) return;
  let filename = `pavati-${((d && d.name) || 'donation').replace(/\s+/g, '_')}.png`;
  downloadCanvasDataUrl(canvasDataUrl, filename);
  toast('पावती फोटो डाउनलोड केला!');
}

function handleWhatsAppReceiptClick(event, id) {
  if (event) event.preventDefault();

  let d = db.donations.find(x => String(x.id) === String(id));
  if (!d) return;

  // 1. Immediately trigger download synchronously in click stack
  let canvasDataUrl = currentModalReceiptData;
  let filename = `pavati-${((d && d.name) || 'donation').replace(/\s+/g, '_')}.png`;

  if (canvasDataUrl) {
    downloadCanvasDataUrl(canvasDataUrl, filename);
  } else {
    generateReceiptCanvas(d).then(url => {
      if (url) downloadCanvasDataUrl(url, filename);
    });
  }

  // 2. Open WhatsApp immediately in direct click stack (bypasses popup blockers)
  let waUrl = getWhatsAppReceiptUrl(d);
  let isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    toast('पावती फोटो डाउनलोड केला! WhatsApp उघडत आहे…');
    setTimeout(() => {
      window.location.href = waUrl;
    }, 250);
  } else {
    toast('पावती फोटो डाउनलोड केला व WhatsApp उघडत आहे…');
    window.open(waUrl, '_blank');
  }
}

function sendReceiptWhatsApp(id) {
  handleWhatsAppReceiptClick(null, id);
}

async function openReceiptModal(id) {
  let d = db.donations.find(x => String(x.id) === String(id));
  if (!d) return;

  let text = receiptText(d);
  let waUrl = getWhatsAppReceiptUrl(d);

  // Generate canvas (instant since template is preloaded in memory)
  let canvasDataUrl = await generateReceiptCanvas(d);
  currentModalReceiptData = canvasDataUrl;

  modal(
    'Digital Donation Receipt (पावती)',
    `<div class="receipt-modal-wrap">
      ${canvasDataUrl ? `<div style="text-align:center; margin-bottom:12px;"><img id="receiptCanvasImg" src="${canvasDataUrl}" alt="Digital Pavati" style="max-width:100%; border-radius:10px; border:1px solid #e0cdbc; box-shadow:0 4px 15px rgba(0,0,0,0.08);"></div>` : ''}
      
      <div class="message-preview">${escapeHtml(text)}</div>
      <div class="modal-actions" id="receiptModalActions">
        ${canvasDataUrl ? `<button type="button" class="outline-btn" onclick="downloadReceiptImageDirect('${d.id}')" style="display:inline-flex; align-items:center; gap:6px;">🖼️ Download Receipt Image</button>` : ''}
        <button type="button" class="outline-btn" onclick="copyReceiptText('${d.id}')">📋 Copy Text</button>
        <button type="button" onclick="handleWhatsAppReceiptClick(event, '${d.id}')" class="primary-btn whatsapp-action-btn" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">💬 Send on WhatsApp</button>
      </div>
    </div>`
  );
}

/* Grouped Aarti WhatsApp Message Generator with Filtered Assigned Dates Only */
function digitEmoji(num) {
  const digits = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '1️⃣0️⃣', '1️⃣1️⃣', '1️⃣2️⃣'];
  return digits[num - 1] || `${num}️⃣`;
}

const DEFAULT_AARTI_WA_TEMPLATE = `✨📿 || गणपती बाप्पा मोरया || 📿✨
{header_date} {time_text} आरती होणार आहे. 🪔

*आरती मानकरी:*
{people}

सर्वांनी सहकुटुंब वेळेत उपस्थित राहावे, ही नम्र विनंती. 🌸

🌺 गणपती बाप्पा मोरया 🌺
🙏 {mandal_name} 🙏`;

function aartiWhatsAppMsg(type = 'Morning', targetDate = today) {
  let list = db.aartis.filter(a => a.date === targetDate && a.type === type);
  let mTime = db.settings?.morningAartiTime || '09:00';
  let eTime = db.settings?.eveningAartiTime || '20:00';
  let timeText = type === 'Morning' ? ('सकाळी ' + time12(mTime) + ' वा.') : ('रात्री ' + time12(eTime) + ' वा.');
  let sessionName = type === 'Morning' ? 'सकाळी' : 'संध्याकाळी';
  let headerDate = dateFullInMarathi(targetDate);

  if (!list.length) {
    return `✨📿 || गणपती बाप्पा मोरया || 📿✨\n${headerDate} ${sessionName} कोणतीही आरती आयोजित केलेली नाही. 🪔\n\n🌺 गणपती बाप्पा मोरया 🌺\n🙏 ${currentMandal.name} 🙏`;
  }

  let peopleText = list.map((a, i) => `${digitEmoji(i + 1)} ${a.person}`).join('\n');
  let tpl = (db.settings && db.settings.waAartiTemplate) ? db.settings.waAartiTemplate : DEFAULT_AARTI_WA_TEMPLATE;

  return tpl
    .replace(/{mandal_name}/g, currentMandal.name)
    .replace(/{header_date}/g, headerDate)
    .replace(/{time_text}/g, timeText)
    .replace(/{session}/g, sessionName)
    .replace(/{people}/g, peopleText);
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
  document.querySelectorAll('#' + target + ' .contact, #' + target + ' .doc-card').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
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

function toast(t, duration = 2400) {
  let el = document.getElementById('toast');
  if (!el) return;
  el.textContent = t;
  el.className = 'toast show';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.className = 'toast', duration);
}

function showLoader(msg = 'कृपया प्रतीक्षा करा... (Please wait)') {
  let el = document.getElementById('appLoader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appLoader';
    el.className = 'app-loader-overlay';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div class="app-loader-card">
      <div class="app-spinner"></div>
      <div class="app-loader-text">${escapeHtml(msg)}</div>
    </div>
  `;
  el.classList.add('show');
}

function hideLoader() {
  let el = document.getElementById('appLoader');
  if (el) el.classList.remove('show');
}


/* Public Portal — load mandal data by ?mandal=slug param */

/* Public Portal Landing Screen (Shown when visiting public.html without ?mandal=) */
function publicPortalLanding() {
  return `
    <div class="public-container" style="max-width:560px; margin:40px auto; padding:20px; text-align:center;">
      <div class="card" style="padding:36px 24px; border-radius:20px; box-shadow:0 8px 30px rgba(159,46,32,0.12);">
        <div style="font-size:52px; margin-bottom:12px;">🪔</div>
        <h2 style="font-family:'Noto Sans Devanagari', sans-serif; color:#7d1c12; margin:0 0 8px 0;">॥ श्री गणेशाय नमः ॥</h2>
        <h3 style="color:#2c1b18; margin:0 0 16px 0; font-size:18px;">सार्वजनिक गणेशोत्सव माहिती व दर्शन दालन</h3>
        <p style="color:#6e584f; font-size:14px; margin-bottom:24px; line-height:1.6;">
          आपल्या मंडळाचे मुखदर्शन, आरती वेळापत्रक, कार्यक्रम व हिशोब पाहण्यासाठी खाली मंडळाचा कोड (Slug) प्रविष्ट करा:
        </p>
        <form onsubmit="event.preventDefault(); let s=document.getElementById('portalSlugInput').value.trim().toLowerCase(); if(s) window.location.href='public.html?mandal='+encodeURIComponent(s);" style="display:flex; gap:10px; max-width:400px; margin:0 auto 16px auto;">
          <input id="portalSlugInput" type="text" placeholder="उदा. renukanagar किंवा vrindavan" style="flex:1; padding:12px 14px; border:1.5px solid #e0cdc0; border-radius:10px; font-size:15px; outline:none;" required>
          <button type="submit" class="primary-btn" style="padding:12px 20px; border-radius:10px; white-space:nowrap;">पाहा →</button>
        </form>
        <div style="font-size:12px; color:#a07060; margin-top:20px;">
          <a href="login.html" style="color:#9f2e20; text-decoration:underline;">मंडळ व्यवस्थापक लॉगिन</a>
        </div>
      </div>
    </div>
  `;
}

async function loadPublicMandalData() {
  let params = new URLSearchParams(window.location.search);
  let slug = params.get('mandal');
  if (!slug) {
    let loggedSlug = sessionStorage.getItem('mandal_slug');
    if (loggedSlug) {
      window.location.replace('public.html?mandal=' + encodeURIComponent(loggedSlug));
      return;
    }
    let target = document.getElementById('page');
    if (target) target.innerHTML = publicPortalLanding();
    return;
  }
  if (!cloud) return;
  try {
    let { data, error } = await cloud.from('mandals').select('id,slug,name,city,contact_phone,nondani_no').eq('slug', slug.toLowerCase()).single();
    if (error || !data) {
      let target = document.getElementById('page');
      if (target) {
        target.innerHTML = `
          <div class="public-container" style="max-width:500px; margin:50px auto; padding:20px; text-align:center;">
            <div class="card" style="padding:32px 20px;">
              <div style="font-size:48px; margin-bottom:12px;">⚠️</div>
              <h3 style="color:#8b1c12;">मंडळ सापडले नाही (Mandal Not Found)</h3>
              <p style="color:#6e584f; font-size:14px;">"${escapeHtml(slug)}" नावाचे कोणतेही मंडळ नोंदणीकृत नाही.</p>
              <a href="public.html" class="primary-btn" style="display:inline-block; margin-top:14px; text-decoration:none;">इतर मंडळ शोधा</a>
            </div>
          </div>
        `;
      }
      return;
    }
    sessionStorage.setItem('mandal_id',    data.id);
    sessionStorage.setItem('mandal_slug',  data.slug);
    sessionStorage.setItem('mandal_name',  data.name);
    sessionStorage.setItem('mandal_city',  data.city);
    sessionStorage.setItem('mandal_phone', data.contact_phone);
    sessionStorage.setItem('mandal_nondani', data.nondani_no);
    document.title = 'श्री गणेश उत्सव - ' + data.name;

    // Reset local db memory to completely empty before loading cloud data
    db = { donations: [], expenses: [], aartis: [], events: [], contacts: [], alankar: [], documents: [], settings: seed.settings };
    await loadCloud();
    render();
  } catch(e) { console.warn('Public portal mandal load error:', e); }
}

/* Event listeners & Single-Run App Initializer */
function initApp() {
  let menuBtn = document.getElementById('menuBtn');
  if (menuBtn) menuBtn.onclick = () => document.querySelector('.sidebar')?.classList.toggle('open');
  let settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.onclick = () => modal('Settings', `<p class="pin-note"><strong>${currentMandal.name}</strong><br>${currentMandal.city}<br>Nondani: ${currentMandal.nondani}</p><div class="modal-actions"><button class="primary-btn" onclick="window.location.href='settings.html'">⚙️ Mandal Settings</button><button class="outline-btn" onclick="requestNotificationPermission()">🔔 Notifications</button><button class="primary-btn" style="background:#dc2626; border-color:#dc2626; color:#fff;" onclick="confirmLogoutGlobal()">⏏ Logout</button></div>`);
  let modalEl = document.getElementById('modal');
  if (modalEl) modalEl.onclick = e => { if (e.target.id === 'modal') closeModal(); };

  // Update dynamic mandal name/city in sidebar brand and topbar (all pages)
  let brandEl = document.querySelector('.brand strong');
  if (brandEl) brandEl.textContent = currentMandal.name;
  let locationSpan = document.querySelector('.location span');
  if (locationSpan) locationSpan.textContent = currentMandal.name;
  let locationSmall = document.querySelector('.location small');
  if (locationSmall) locationSmall.textContent = currentMandal.city || 'Mandal Manager';
  let sideFootEl = document.querySelector('.side-foot');
  if (sideFootEl) sideFootEl.innerHTML = '<span class="online-dot"></span> ' + currentMandal.slug;

  if (detectCurrentPage() === 'public') {
    loadPublicMandalData();
  } else {
    render();
    loadCloud();
    subscribeCloud();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

