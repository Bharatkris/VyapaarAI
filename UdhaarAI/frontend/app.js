/**
 * UdhaarAI — Production Full-Stack SPA Client
 * Connects directly to Flask REST API & Web Speech API
 */

// ================= GLOBAL STATE =================
const state = {
  page: 'dashboard',
  language: localStorage.getItem('udhaar_lang') || 'hi',
  shop: {
    name: 'Bharat General Store',
    owner_name: 'Bharat',
    phone: '9876543210',
    address: 'JSPM Market, Pune',
    currency: 'INR'
  },
  customers: [],
  transactions: [],
  payments: [],
  bills: [],
  products: [],
  reminders: [],
  reports: null,
  dashboard: null,
  notifications: [],
  unreadNotifs: 0,
  
  // Voice Modal State
  voice: {
    isListening: false,
    isEditing: false,
    transcript: '',
    parsed: {
      customer: 'Ramesh Patil',
      amount: 500,
      action: 'udhari',
      language: 'Hindi / Hinglish',
      item: null,
      quantity: null,
      unit: null,
      price: null,
      description: 'Voice Udhari entry'
    }
  },

  // Active filters
  customerFilter: 'all',
  ledgerFilter: 'all',
  reminderFilter: 'all',
  reportPeriod: 'month'
};

// ================= I18N DICTIONARY =================
const I18N = {
  en: {
    tagline: 'Voice-first ledger',
    nav_dashboard: 'Dashboard',
    nav_customers: 'Customers',
    nav_ledger: 'Udhari',
    nav_payments: 'Payments',
    nav_bills: 'Bills',
    nav_reminders: 'Reminders',
    nav_reports: 'Reports',
    nav_assistant: 'AI Assistant',
    nav_products: 'Products',
    nav_settings: 'Settings',
    talk_udhaar: 'Talk to UdhaarAI',
    voice_assistant: 'VOICE ASSISTANT',
    voice_heading: "Speak naturally. I'll handle the ledger.",
    voice_langs: 'Marathi • Hindi • English • Hinglish',
    tap_mic: 'Tap the microphone and speak',
    ai_understood: 'AI understood',
    customer: 'Customer',
    amount: 'Amount',
    action: 'Action',
    language: 'Language',
    confirm_txn: 'Confirm transaction',
    voice_safety_note: 'For safety, financial entries are saved only after confirmation.',
    notifications: 'Notifications',
    mark_read: 'Mark all read',
    shop_settings: 'Shop Settings',
    refresh_data: 'Reload Data',
    total_udhari: 'Total Udhari',
    received_today: 'Received Today',
    given_today: 'Given Today',
    pending_customers: 'Pending Customers',
    recent_transactions: 'Recent transactions',
    view_all: 'View all →',
    quick_actions: 'Quick actions',
    add_udhari: 'Add Udhari',
    record_payment: 'Record payment',
    create_bill: 'Create bill',
    send_reminder: 'Send reminder',
    add_customer: '+ Add customer',
    add_product: '+ Add product',
    save: 'Save',
    cancel: 'Cancel'
  },
  hi: {
    tagline: 'वॉयस-फर्स्ट डिजिटल बहीखाता',
    nav_dashboard: 'डैशबोर्ड',
    nav_customers: 'ग्राहक (Customers)',
    nav_ledger: 'उधारी (Udhari)',
    nav_payments: 'पेमेंट्स (Payments)',
    nav_bills: 'बिल (Bills)',
    nav_reminders: 'तगादा (Reminders)',
    nav_reports: 'रिपोर्ट्स (Reports)',
    nav_assistant: 'AI असिस्टेंट',
    nav_products: 'प्रोडक्ट्स (Products)',
    nav_settings: 'सेटिंग्स',
    talk_udhaar: 'UdhaarAI से बात करें',
    voice_assistant: 'वॉयस असिस्टेंट',
    voice_heading: 'आसानी से बोलें, बहीखाता अपने आप बनेगा।',
    voice_langs: 'मराठी • हिंदी • इंग्लिश • हिंग्लिश',
    tap_mic: 'माइक दबाएं और बोलें',
    ai_understood: 'AI ने समझा',
    customer: 'ग्राहक',
    amount: 'रकम',
    action: 'प्रकार',
    language: 'भाषा',
    confirm_txn: 'लेनदेन पक्का करें',
    voice_safety_note: 'सुरक्षा के लिए, आपके कन्फर्म करने पर ही खाता अपडेट होता है।',
    notifications: 'सूचनाएं',
    mark_read: 'सभी पढ़ी गईं',
    shop_settings: 'दुकान सेटिंग्स',
    refresh_data: 'डाटा रीलोड करें',
    total_udhari: 'कुल उधारी',
    received_today: 'आज मिले (Payment)',
    given_today: 'आज दिए (Udhari)',
    pending_customers: 'बाकी ग्राहक',
    recent_transactions: 'हालिया लेनदेन',
    view_all: 'सब देखें →',
    quick_actions: 'तुरंत काम',
    add_udhari: 'उधारी जोड़ें',
    record_payment: 'पेमेंट दर्ज करें',
    create_bill: 'बिल बनाएं',
    send_reminder: 'तगादा भेजें',
    add_customer: '+ नया ग्राहक',
    add_product: '+ नया प्रोडक्ट',
    save: 'सेव करें',
    cancel: 'रद्द करें'
  },
  mr: {
    tagline: 'व्हॉइस-फर्स्ट डिजिटल खातेवही',
    nav_dashboard: 'डॅशबोर्ड',
    nav_customers: 'ग्राहक (Customers)',
    nav_ledger: 'उधारी (Udhari)',
    nav_payments: 'पेमेंट्स (Payments)',
    nav_bills: 'बिले (Bills)',
    nav_reminders: 'स्मरणपत्रे (Reminders)',
    nav_reports: 'अहवाल (Reports)',
    nav_assistant: 'AI सहाय्यक',
    nav_products: 'उत्पादने (Products)',
    nav_settings: 'सेटिंग्ज',
    talk_udhaar: 'UdhaarAI शी बोला',
    voice_assistant: 'व्हॉइस असिस्टंट',
    voice_heading: 'सहज बोला, खातेवही आपोआप तयार होईल.',
    voice_langs: 'मराठी • हिंदी • इंग्रजी • हिंग्लिश',
    tap_mic: 'माइक दाबा आणि बोला',
    ai_understood: 'AI ला समजले',
    customer: 'ग्राहक',
    amount: 'रक्कम',
    action: 'प्रकार',
    language: 'भाषा',
    confirm_txn: 'व्यवहार निश्चित करा',
    voice_safety_note: 'सुरक्षिततेसाठी, खात्री केल्यावरच व्यवहार सेव्ह केला जातो.',
    notifications: 'सूचना',
    mark_read: 'सर्व वाचले',
    shop_settings: 'दुकान सेटिंग्ज',
    refresh_data: 'डेटा रीलोड करा',
    total_udhari: 'एकूण उधारी',
    received_today: 'आज जमा (Payment)',
    given_today: 'आज दिलेले (Udhari)',
    pending_customers: 'थकबाकीदार ग्राहक',
    recent_transactions: 'अलीकडील व्यवहार',
    view_all: 'सर्व पहा →',
    quick_actions: 'झटपट कृती',
    add_udhari: 'उधारी जोडा',
    record_payment: 'पेमेंट नोंदवा',
    create_bill: 'बिल बनवा',
    send_reminder: 'स्मरणपत्र पाठवा',
    add_customer: '+ नवीन ग्राहक',
    add_product: '+ नवीन उत्पादन',
    save: 'जतन करा',
    cancel: 'रद्द करा'
  }
};

// ================= DOM REFERENCES =================
const contentEl = document.getElementById('content');
const pageTitleEl = document.getElementById('pageTitle');
const pageEyebrowEl = document.getElementById('pageEyebrow');
const voiceModalEl = document.getElementById('voiceModal');
const toastEl = document.getElementById('toast');
const appModalBackdrop = document.getElementById('appModalBackdrop');
const appModalContent = document.getElementById('appModalContent');
const invoiceModalBackdrop = document.getElementById('invoiceModalBackdrop');
const invoicePrintableArea = document.getElementById('invoicePrintableArea');

// ================= UTILITIES =================
function money(n) {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function initials(name) {
  if (!name) return 'U';
  return name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
}

function t(key) {
  const dict = I18N[state.language] || I18N.en;
  return dict[key] || I18N.en[key] || key;
}

function showToast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.className = 'toast show' + (isError ? ' toast-error' : '');
  setTimeout(() => toastEl.classList.remove('show'), 2800);
}

// Base API configuration: relative URL when served on port 5000, fallback when opened from file:// or other dev ports
const API_BASE = (() => {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    if (window.location.port === '5000' || !window.location.port) {
      return '';
    }
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return 'http://127.0.0.1:5000';
})();

async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new Error(`Server returned invalid response (${res.status})`);
    }

    if (!res.ok || !data.ok) {
      throw new Error(data.message || data.error || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    console.error(`API Request error on [${url}]:`, err);
    let userMsg = err.message || 'Unable to connect to server';
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      userMsg = 'Flask server is unavailable. Please ensure the server is running on http://127.0.0.1:5000';
    }
    showToast(userMsg, true);
    throw err;
  }
}

// ================= SPEECH RECOGNITION =================
let recognition = null;

function setupRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const r = new SpeechRecognition();
  r.lang = state.language === 'mr' ? 'mr-IN' : state.language === 'en' ? 'en-IN' : 'hi-IN';
  r.interimResults = true;
  r.continuous = false;

  r.onstart = () => {
    state.voice.isListening = true;
    updateListenUI();
  };

  r.onend = () => {
    state.voice.isListening = false;
    updateListenUI();
  };

  r.onerror = (e) => {
    state.voice.isListening = false;
    updateListenUI();
    const listenStatus = document.getElementById('listenStatus');
    if (e.error === 'not-allowed') {
      listenStatus.textContent = 'Microphone permission denied. Please allow microphone access in browser.';
    } else if (e.error === 'no-speech') {
      listenStatus.textContent = 'No speech detected. Tap microphone and speak clearly.';
    } else {
      listenStatus.textContent = `Voice recognition error (${e.error}). Please try again.`;
    }
  };

  r.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    if (transcript.trim()) {
      document.getElementById('voiceTranscript').textContent = `“${transcript}”`;
      processVoiceInput(transcript);
    }
  };

  return r;
}

function startListening() {
  if (!recognition) recognition = setupRecognition();
  if (!recognition) {
    document.getElementById('listenStatus').textContent = 'Voice recognition is not supported in this browser. Please use Chrome/Edge or click a quick prompt below.';
    return;
  }
  try {
    recognition.start();
  } catch (e) {
    console.warn('SpeechRecognition start notice:', e);
  }
}

function stopListening() {
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }
}

function updateListenUI() {
  const bigMic = document.getElementById('bigMic');
  const pulseRing = document.getElementById('pulseRing');
  const listenStatus = document.getElementById('listenStatus');

  if (bigMic) bigMic.classList.toggle('listening', state.voice.isListening);
  if (pulseRing) pulseRing.classList.toggle('active', state.voice.isListening);
  if (listenStatus) {
    listenStatus.textContent = state.voice.isListening
      ? 'Listening… Speak your transaction or question'
      : t('tap_mic');
  }
}

async function processVoiceInput(text) {
  try {
    const res = await apiFetch('/api/voice/process', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    if (res.ok && res.parsed) {
      state.voice.parsed = res.parsed;
      renderVoiceParsedData(res.parsed, res.assistant_reply);
    }
  } catch (err) {
    console.error('Error processing voice:', err);
  }
}

function renderVoiceParsedData(parsed, assistantReply = null) {
  const aiCustomer = document.getElementById('aiCustomer');
  const aiAmount = document.getElementById('aiAmount');
  const aiAction = document.getElementById('aiAction');
  const aiLanguage = document.getElementById('aiLanguage');
  const detectedLang = document.getElementById('detectedLang');
  const intentTag = document.getElementById('intentTag');
  const itemBar = document.getElementById('voiceItemDetails');
  const queryBox = document.getElementById('voiceQueryReply');

  if (aiCustomer) aiCustomer.textContent = parsed.customer || '—';
  if (aiAmount) aiAmount.textContent = money(parsed.amount);
  if (aiAction) {
    aiAction.textContent = parsed.action === 'payment' ? 'Payment' : 'Udhari';
    aiAction.className = parsed.action === 'payment' ? 'payment' : 'credit';
  }
  if (aiLanguage) aiLanguage.textContent = parsed.language || 'Hindi';
  if (detectedLang) detectedLang.textContent = `Detected: ${parsed.language} (${parsed.lang_code || 'hi-IN'})`;

  // Item details
  if (itemBar) {
    if (parsed.item) {
      itemBar.classList.remove('hidden');
      document.getElementById('aiItemName').textContent = parsed.item;
      document.getElementById('aiItemQty').textContent = `${parsed.quantity || 1} ${parsed.unit || ''}`;
      document.getElementById('aiItemRate').textContent = parsed.price ? money(parsed.price) : 'Standard';
    } else {
      itemBar.classList.add('hidden');
    }
  }

  // Assistant query response if user asked question
  if (queryBox) {
    if (assistantReply) {
      queryBox.classList.remove('hidden');
      queryBox.innerHTML = `<strong>Assistant Answer:</strong><br>${assistantReply}`;
      if (intentTag) intentTag.textContent = 'Query answered';
    } else {
      queryBox.classList.add('hidden');
      if (intentTag) intentTag.textContent = parsed.action === 'payment' ? 'Payment intent' : 'Udhari intent';
    }
  }

  // Also sync input fields if in edit mode
  const editCustomer = document.getElementById('editCustomer');
  const editAmount = document.getElementById('editAmount');
  const editAction = document.getElementById('editAction');
  if (editCustomer) editCustomer.value = parsed.customer;
  if (editAmount) editAmount.value = parsed.amount;
  if (editAction) editAction.value = parsed.action;
}

function toggleVoiceEditing() {
  state.voice.isEditing = !state.voice.isEditing;
  const isEditing = state.voice.isEditing;

  const aiCustomer = document.getElementById('aiCustomer');
  const aiAmount = document.getElementById('aiAmount');
  const aiAction = document.getElementById('aiAction');
  const editCustomer = document.getElementById('editCustomer');
  const editAmount = document.getElementById('editAmount');
  const editAction = document.getElementById('editAction');
  const editVoiceBtnText = document.getElementById('editVoiceBtnText');

  if (isEditing) {
    editCustomer.value = state.voice.parsed.customer || '';
    editAmount.value = state.voice.parsed.amount || 500;
    editAction.value = state.voice.parsed.action || 'udhari';

    aiCustomer.classList.add('hidden');
    aiAmount.classList.add('hidden');
    aiAction.classList.add('hidden');

    editCustomer.classList.remove('hidden');
    editAmount.classList.remove('hidden');
    editAction.classList.remove('hidden');

    if (editVoiceBtnText) editVoiceBtnText.textContent = 'Done Editing';
  } else {
    const updatedCust = editCustomer.value.trim() || state.voice.parsed.customer || 'Ramesh Patil';
    const updatedAmt = parseFloat(editAmount.value) || state.voice.parsed.amount || 500;
    const updatedAct = editAction.value || 'udhari';

    state.voice.parsed.customer = updatedCust;
    state.voice.parsed.amount = updatedAmt;
    state.voice.parsed.action = updatedAct;

    aiCustomer.textContent = updatedCust;
    aiAmount.textContent = money(updatedAmt);
    aiAction.textContent = updatedAct === 'payment' ? 'Payment' : 'Udhari';
    aiAction.className = updatedAct === 'payment' ? 'payment' : 'credit';

    aiCustomer.classList.remove('hidden');
    aiAmount.classList.remove('hidden');
    aiAction.classList.remove('hidden');

    editCustomer.classList.add('hidden');
    editAmount.classList.add('hidden');
    editAction.classList.add('hidden');

    if (editVoiceBtnText) editVoiceBtnText.textContent = 'Edit';
  }
}

async function confirmVoiceTransaction() {
  const confirmBtn = document.getElementById('confirmVoice');
  if (confirmBtn.disabled) return;

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    let custName = state.voice.parsed.customer || 'Ramesh Patil';
    let amt = Number(state.voice.parsed.amount) || 500;
    let act = state.voice.parsed.action || 'udhari';

    if (state.voice.isEditing) {
      const editCustomer = document.getElementById('editCustomer');
      const editAmount = document.getElementById('editAmount');
      const editAction = document.getElementById('editAction');
      if (editCustomer && editCustomer.value.trim()) custName = editCustomer.value.trim();
      if (editAmount && editAmount.value.trim()) amt = parseFloat(editAmount.value) || 0;
      if (editAction && editAction.value) act = editAction.value;
    }

    if (!custName) {
      throw new Error('Customer name is required');
    }
    if (!amt || isNaN(amt) || amt <= 0) {
      throw new Error('Amount must be a valid number greater than zero');
    }

    const payload = {
      name: custName,
      amount: amt,
      action: act,
      type: act,
      description: state.voice.parsed.description || (act === 'payment' ? 'Payment received' : 'Voice transaction'),
      item: state.voice.parsed.item,
      quantity: state.voice.parsed.quantity,
      unit: state.voice.parsed.unit,
      price: state.voice.parsed.price
    };

    const res = await apiFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const actionLabel = act === 'payment' ? 'payment recorded for' : 'Udhari added for';
      showToast(`✓ ${money(amt)} ${actionLabel} ${custName}`);
      closeVoiceModal();
      await loadInitialData();
      render();
    }
  } catch (err) {
    console.error('Transaction confirmation error:', err);
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '✓ Confirm transaction';
  }
}


function openVoiceModal() {
  voiceModalEl.classList.remove('hidden');
  state.voice.isEditing = false;
  const editVoiceBtnText = document.getElementById('editVoiceBtnText');
  if (editVoiceBtnText) editVoiceBtnText.textContent = 'Edit';
  
  document.getElementById('aiCustomer').classList.remove('hidden');
  document.getElementById('aiAmount').classList.remove('hidden');
  document.getElementById('aiAction').classList.remove('hidden');
  document.getElementById('editCustomer').classList.add('hidden');
  document.getElementById('editAmount').classList.add('hidden');
  document.getElementById('editAction').classList.add('hidden');
  
  renderVoiceParsedData(state.voice.parsed);
}

function closeVoiceModal() {
  voiceModalEl.classList.add('hidden');
  stopListening();
}

// ================= MODAL HELPERS =================
function openAppModal(htmlContent) {
  appModalContent.innerHTML = htmlContent;
  appModalBackdrop.classList.remove('hidden');
}

function closeAppModal() {
  appModalBackdrop.classList.add('hidden');
  appModalContent.innerHTML = '';
}

function openInvoiceModal(bill) {
  const shop = state.shop;
  const itemsHtml = bill.items.map((it, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${it.item_name}</strong></td>
      <td>${it.quantity} ${it.unit}</td>
      <td>${money(it.price)}</td>
      <td><strong>${money(it.total)}</strong></td>
    </tr>
  `).join('');

  invoicePrintableArea.innerHTML = `
    <div class="invoice-header">
      <div>
        <h2>${shop.name || 'Bharat General Store'}</h2>
        <div>${shop.address || 'JSPM Market, Pune'}</div>
        <div>Phone: ${shop.phone || '9876543210'} ${shop.gstin ? ' | GST: ' + shop.gstin : ''}</div>
      </div>
      <div style="text-align:right">
        <h3 style="margin:0;color:var(--primary);">TAX INVOICE</h3>
        <strong>#${bill.bill_number}</strong>
        <div>Date: ${bill.time || 'Today'}</div>
      </div>
    </div>

    <div class="invoice-info-grid">
      <div style="background:#f8faf9;padding:12px;border-radius:10px;">
        <strong style="color:var(--muted);font-size:10px;text-transform:uppercase;">Billed To</strong>
        <h4 style="margin:4px 0 2px;">${bill.customer_name}</h4>
        <div>Phone: ${bill.customer_phone || 'N/A'}</div>
        <div>Address: ${bill.customer_address || 'Local'}</div>
      </div>
      <div style="background:#f8faf9;padding:12px;border-radius:10px;">
        <strong style="color:var(--muted);font-size:10px;text-transform:uppercase;">Invoice Status</strong>
        <div style="margin-top:6px;">
          <span class="badge ${bill.payment_status === 'paid' ? 'paid' : 'pending'}">${bill.payment_status.toUpperCase()}</span>
        </div>
      </div>
    </div>

    <table class="invoice-items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;">
      <div style="width:260px;background:#f8faf9;padding:14px;border-radius:12px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
          <span>Subtotal:</span>
          <strong>${money(bill.subtotal)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
          <span>Discount:</span>
          <strong>-${money(bill.discount)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;border-top:1px solid #d0dedb;padding-top:8px;color:var(--primary);">
          <span>Total:</span>
          <span>${money(bill.total_amount)}</span>
        </div>
      </div>
    </div>

    <div class="invoice-footer">
      <p>Thank you for your business! Generated via UdhaarAI Voice Ledger.</p>
    </div>
  `;

  invoiceModalBackdrop.classList.remove('hidden');
}

function closeInvoiceModal() {
  invoiceModalBackdrop.classList.add('hidden');
}

// ================= DATA LOADING =================
async function loadInitialData() {
  try {
    const [dashRes, custRes, txnRes, payRes, billRes, prodRes, remRes, repRes, notifRes, setRes] = await Promise.all([
      apiFetch('/api/dashboard'),
      apiFetch('/api/customers'),
      apiFetch('/api/transactions'),
      apiFetch('/api/payments'),
      apiFetch('/api/bills'),
      apiFetch('/api/products'),
      apiFetch('/api/reminders'),
      apiFetch(`/api/reports?period=${state.reportPeriod}`),
      apiFetch('/api/notifications'),
      apiFetch('/api/settings')
    ]);

    state.dashboard = dashRes.data;
    state.customers = custRes.customers;
    state.transactions = txnRes.transactions;
    state.payments = payRes.payments;
    state.bills = billRes.bills;
    state.products = prodRes.products;
    state.reminders = remRes.reminders;
    state.reports = repRes.data;
    state.notifications = notifRes.notifications;
    state.unreadNotifs = notifRes.unread_count;

    if (setRes.shop) {
      state.shop = setRes.shop;
      updateShopUI();
    }

    updateNotificationBadge();
  } catch (err) {
    console.error('Data initialization error:', err);
  }
}

function updateShopUI() {
  const nameEl = document.getElementById('shopMiniName');
  const addrEl = document.getElementById('shopMiniAddress');
  const topOwner = document.getElementById('topOwnerName');
  const profName = document.getElementById('profileMenuName');
  const profShop = document.getElementById('profileMenuShop');
  const miniAvatar = document.getElementById('shopMiniAvatar');
  const topAvatar = document.getElementById('topAvatar');

  const av = initials(state.shop.name || 'Bharat');
  if (nameEl) nameEl.textContent = state.shop.name || 'Bharat General Store';
  if (addrEl) addrEl.textContent = state.shop.address || 'Pune';
  if (topOwner) topOwner.textContent = state.shop.owner_name || 'Bharat';
  if (profName) profName.textContent = state.shop.owner_name || 'Bharat';
  if (profShop) profShop.textContent = state.shop.name || 'Bharat General Store';
  if (miniAvatar) miniAvatar.textContent = av;
  if (topAvatar) topAvatar.textContent = av;
}

function updateNotificationBadge() {
  const badge = document.getElementById('notifyBadge');
  if (badge) {
    if (state.unreadNotifs > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// ================= RENDER ENGINE =================
function render() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === state.page);
  });

  const pageMeta = {
    dashboard: ['OVERVIEW', t('nav_dashboard')],
    customers: ['MANAGEMENT', t('nav_customers')],
    ledger: ['LEDGER', t('nav_ledger')],
    payments: ['MONEY RECEIVED', t('nav_payments')],
    bills: ['DOCUMENTS', t('nav_bills')],
    reminders: ['FOLLOW-UP', t('nav_reminders')],
    reports: ['INSIGHTS', t('nav_reports')],
    assistant: ['DATA-AWARE AI', t('nav_assistant')],
    products: ['CATALOG', t('nav_products')],
    settings: ['ACCOUNT', t('nav_settings')]
  };

  const [eyebrow, title] = pageMeta[state.page] || ['OVERVIEW', 'Dashboard'];
  pageEyebrowEl.textContent = eyebrow;
  pageTitleEl.textContent = title;

  const views = {
    dashboard: renderDashboardPage,
    customers: renderCustomersPage,
    ledger: renderLedgerPage,
    payments: renderPaymentsPage,
    bills: renderBillsPage,
    reminders: renderRemindersPage,
    reports: renderReportsPage,
    assistant: renderAssistantPage,
    products: renderProductsPage,
    settings: renderSettingsPage
  };

  contentEl.innerHTML = (views[state.page] || renderDashboardPage)();
  bindPageEvents();
}

// 1. DASHBOARD
function renderDashboardPage() {
  const d = state.dashboard || {
    total_outstanding: 0,
    total_udhari: 0,
    received_today: 0,
    given_today: 0,
    total_customers: 0,
    pending_customers: 0,
    overdue_customers: 0,
    recent_transactions: []
  };

  const txns = d.recent_transactions && d.recent_transactions.length > 0
    ? d.recent_transactions.map(renderTxnRow).join('')
    : `<div class="empty-state">
        <div class="empty-state-icon">▤</div>
        <h4>No transactions yet</h4>
        <p>Record your first Udhari by voice or manual entry.</p>
        <button class="primary-btn" data-action="open-voice">🎤 Talk to UdhaarAI</button>
      </div>`;

  return `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">GOOD DAY, ${(state.shop.owner_name || 'BHARAT').toUpperCase()}</span>
        <h2>Run your shop with your voice.</h2>
        <p>Record Udhari, check balances, send bills and ask business questions in Marathi, Hindi, English or Hinglish.</p>
      </div>
      <div class="voice-hero">
        <small>AI VOICE ASSISTANT</small>
        <h3>“Ramesh ne 500 rupaye udhar liye.”</h3>
        <button class="talk-btn" data-action="open-voice">🎤 ${t('talk_udhaar')}</button>
      </div>
    </section>

    <section class="stats">
      <div class="stat-card">
        <div class="stat-top"><span>${t('total_udhari')}</span><span class="icon">₹</span></div>
        <div class="stat-num">${money(d.total_outstanding)}</div>
        <div class="stat-meta">Across <strong>${d.pending_customers}</strong> pending customers</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span>${t('received_today')}</span><span class="icon">↙</span></div>
        <div class="stat-num">${money(d.received_today)}</div>
        <div class="stat-meta"><span class="up">${d.payments_today_count || 0} payments</span> today</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span>${t('given_today')}</span><span class="icon">↗</span></div>
        <div class="stat-num">${money(d.given_today)}</div>
        <div class="stat-meta"><span class="up">${d.credits_today_count || 0} transactions</span> today</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span>${t('pending_customers')}</span><span class="icon">◌</span></div>
        <div class="stat-num">${d.pending_customers}</div>
        <div class="stat-meta"><span class="badge overdue">${d.overdue_customers} overdue</span></div>
      </div>
    </section>

    <section class="grid-2">
      <div class="card">
        <div class="card-head">
          <h3>${t('recent_transactions')}</h3>
          <button class="card-action" data-nav="ledger">${t('view_all')}</button>
        </div>
        <div class="transaction-list">
          ${txns}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>${t('quick_actions')}</h3>
          <span class="eyebrow">VOICE-FIRST</span>
        </div>
        <div class="quick-actions">
          <button class="quick-action" data-action="open-voice">
            <div class="qa-icon">🎤</div>
            <strong>${t('add_udhari')}</strong>
            <span>Speak it in one sentence</span>
          </button>
          <button class="quick-action" data-action="open-payment-modal">
            <div class="qa-icon">₹</div>
            <strong>${t('record_payment')}</strong>
            <span>Mark money received</span>
          </button>
          <button class="quick-action" data-action="open-bill-modal">
            <div class="qa-icon">▧</div>
            <strong>${t('create_bill')}</strong>
            <span>Share or print instantly</span>
          </button>
          <button class="quick-action" data-nav="reminders">
            <div class="qa-icon">◌</div>
            <strong>${t('send_reminder')}</strong>
            <span>Follow up on pending dues</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderTxnRow(t) {
  const isCredit = t.type === 'credit';
  return `
    <div class="txn">
      <div class="txn-icon">${isCredit ? '↑' : '↓'}</div>
      <div class="txn-main">
        <strong>${t.customer_name || t.name}</strong>
        <span>${t.desc || t.description || (isCredit ? 'Udhari entry' : 'Payment received')}</span>
      </div>
      <div class="txn-amount">
        <strong class="${isCredit ? 'credit' : 'payment'}">${isCredit ? '+' : '−'}${money(t.amount)}</strong>
        <span>${t.time || 'Today'}</span>
      </div>
    </div>
  `;
}

// 2. CUSTOMERS PAGE
function renderCustomersPage() {
  let filtered = state.customers;
  if (state.customerFilter === 'outstanding') filtered = filtered.filter(c => c.balance > 0 && c.status !== 'overdue');
  else if (state.customerFilter === 'overdue') filtered = filtered.filter(c => c.status === 'overdue');
  else if (state.customerFilter === 'paid') filtered = filtered.filter(c => c.balance === 0);

  const rows = filtered.length > 0
    ? filtered.map(c => `
      <tr>
        <td>
          <div class="customer-cell">
            <span class="avatar">${initials(c.name)}</span>
            <div>
              <strong>${c.name}</strong>
              <small style="color:var(--muted);display:block;">${c.address || ''}</small>
            </div>
          </div>
        </td>
        <td>${c.phone}</td>
        <td><strong>${money(c.balance)}</strong></td>
        <td><span class="badge ${c.status}">${c.status.toUpperCase()}</span></td>
        <td>${c.last || 'Recently'}</td>
        <td>
          <button class="secondary-btn" data-action="view-customer" data-id="${c.id}">Open</button>
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h4>No customers found</h4>
          <p>Add a new customer to track Udhari and payments.</p>
          <button class="primary-btn" data-action="open-add-customer-modal">${t('add_customer')}</button>
        </div>
      </td></tr>`;

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">CUSTOMER MANAGEMENT</span>
        <h2>${t('nav_customers')}</h2>
        <p>Manage customer relationships, pending dues and transaction history.</p>
      </div>
      <div class="page-actions-row">
        <button class="secondary-btn" data-action="open-voice">🎤 Search by voice</button>
        <button class="primary-btn" data-action="open-add-customer-modal">${t('add_customer')}</button>
      </div>
    </section>

    <div class="card">
      <div class="filter-bar">
        <button class="filter-btn ${state.customerFilter === 'all' ? 'active' : ''}" data-cust-filter="all">All (${state.customers.length})</button>
        <button class="filter-btn ${state.customerFilter === 'outstanding' ? 'active' : ''}" data-cust-filter="outstanding">Outstanding</button>
        <button class="filter-btn ${state.customerFilter === 'overdue' ? 'active' : ''}" data-cust-filter="overdue">Overdue</button>
        <button class="filter-btn ${state.customerFilter === 'paid' ? 'active' : ''}" data-cust-filter="paid">Settled / Paid</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Current Balance</th>
              <th>Status</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3. UDHARI / LEDGER PAGE
function renderLedgerPage() {
  let filtered = state.transactions;
  if (state.ledgerFilter === 'credit') filtered = filtered.filter(t => t.type === 'credit');
  else if (state.ledgerFilter === 'payment') filtered = filtered.filter(t => t.type === 'payment');

  const rows = filtered.length > 0
    ? filtered.map(t => {
      const isCredit = t.type === 'credit';
      return `
        <div class="txn">
          <div class="txn-icon">${isCredit ? '↑' : '↓'}</div>
          <div class="txn-main">
            <strong>${t.customer_name || t.name}</strong>
            <span>${t.desc || t.description || (isCredit ? 'Udhari credit' : 'Payment received')}</span>
          </div>
          <div class="txn-amount">
            <strong class="${isCredit ? 'credit' : 'payment'}">${isCredit ? '+' : '−'}${money(t.amount)}</strong>
            <span>${t.time || 'Today'}</span>
          </div>
          <button class="danger-btn" style="padding:4px 8px;font-size:11px;" data-action="delete-txn" data-id="${t.id}" title="Delete transaction">✕</button>
        </div>
      `;
    }).join('')
    : `<div class="empty-state">
        <div class="empty-state-icon">▤</div>
        <h4>No transactions in this view</h4>
        <p>Record a new entry to see it in the ledger.</p>
        <button class="primary-btn" data-action="open-udhari-modal">+ Add Udhari</button>
      </div>`;

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">CREDIT LEDGER</span>
        <h2>${t('nav_ledger')}</h2>
        <p>Track every credit and debit transaction with complete audit history.</p>
      </div>
      <div class="page-actions-row">
        <button class="secondary-btn" data-action="open-voice">🎤 Voice entry</button>
        <button class="primary-btn" data-action="open-udhari-modal">+ Add Udhari</button>
      </div>
    </section>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-top"><span>Total Outstanding</span><span class="icon">₹</span></div>
        <div class="stat-num">${money(state.dashboard ? state.dashboard.total_outstanding : 0)}</div>
        <div class="stat-meta">Active ledger balance</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span>Today’s Credit</span><span class="icon">↗</span></div>
        <div class="stat-num">${money(state.dashboard ? state.dashboard.given_today : 0)}</div>
        <div class="stat-meta">Given today</div>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <button class="filter-btn ${state.ledgerFilter === 'all' ? 'active' : ''}" data-ledger-filter="all">All Transactions</button>
        <button class="filter-btn ${state.ledgerFilter === 'credit' ? 'active' : ''}" data-ledger-filter="credit">Udhari Given (Credit)</button>
        <button class="filter-btn ${state.ledgerFilter === 'payment' ? 'active' : ''}" data-ledger-filter="payment">Payments Received</button>
      </div>
      <div class="transaction-list">
        ${rows}
      </div>
    </div>
  `;
}

// 4. PAYMENTS PAGE
function renderPaymentsPage() {
  const paymentRows = state.payments.length > 0
    ? state.payments.map(p => `
      <div class="txn">
        <div class="txn-icon" style="background:#fff3db;color:#8a5a00;">₹</div>
        <div class="txn-main">
          <strong>${p.customer_name}</strong>
          <span>Method: ${(p.payment_method || 'cash').toUpperCase()} ${p.reference_id ? '• Ref: ' + p.reference_id : ''} ${p.notes ? '• ' + p.notes : ''}</span>
        </div>
        <div class="txn-amount">
          <strong class="payment">−${money(p.amount)}</strong>
          <span>${p.time || 'Recently'}</span>
        </div>
        <button class="secondary-btn" style="padding:5px 10px;font-size:11px;" data-action="share-receipt" data-id="${p.id}">📲 Share</button>
      </div>
    `).join('')
    : `<div class="empty-state">
        <div class="empty-state-icon">₹</div>
        <h4>No payments recorded yet</h4>
        <p>Record a payment received from a customer.</p>
        <button class="primary-btn" data-action="open-payment-modal">+ Record Payment</button>
      </div>`;

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">MONEY RECEIVED</span>
        <h2>${t('nav_payments')}</h2>
        <p>Record and track every customer payment with instant WhatsApp receipt sharing.</p>
      </div>
      <div class="page-actions-row">
        <button class="secondary-btn" data-action="open-voice">🎤 Record by voice</button>
        <button class="primary-btn" data-action="open-payment-modal">+ Record Payment</button>
      </div>
    </section>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <h3>Payment History (${state.payments.length})</h3>
        </div>
        <div class="transaction-list">
          ${paymentRows}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Payment Workflow</h3>
          <span class="eyebrow">VOICE & WHATSAPP</span>
        </div>
        <div class="insight-card">
          <div class="insight-box" data-action="open-voice">
            <strong>1. Speak</strong>
            <p>“Suresh ne 700 rupaye payment diya.”</p>
          </div>
          <div class="insight-box">
            <strong>2. Confirm & Save</strong>
            <p>Review customer, amount and payment mode before saving.</p>
          </div>
          <div class="insight-box">
            <strong>3. Instant Receipt</strong>
            <p>Send an automated payment receipt on WhatsApp with one click.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 5. BILLS PAGE
function renderBillsPage() {
  const billRows = state.bills.length > 0
    ? state.bills.map(b => `
      <tr>
        <td><strong>#${b.bill_number}</strong></td>
        <td><strong>${b.customer_name}</strong></td>
        <td><strong>${money(b.total_amount)}</strong></td>
        <td>${b.time || 'Today'}</td>
        <td><span class="badge ${b.payment_status === 'paid' ? 'paid' : b.payment_status === 'draft' ? 'draft' : 'pending'}">${b.payment_status.toUpperCase()}</span></td>
        <td>
          <button class="secondary-btn" data-action="preview-bill" data-id="${b.id}">Preview / Print</button>
          <button class="danger-btn" style="padding:6px 10px;" data-action="delete-bill" data-id="${b.id}">✕</button>
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state-icon">▧</div>
          <h4>No bills generated yet</h4>
          <p>Create itemized invoices for your customers.</p>
          <button class="primary-btn" data-action="open-bill-modal">+ Create Bill</button>
        </div>
      </td></tr>`;

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">BILLS & RECEIPTS</span>
        <h2>${t('nav_bills')}</h2>
        <p>Generate, itemize, print and share bills with customers.</p>
      </div>
      <div class="page-actions-row">
        <button class="secondary-btn" data-action="open-voice">🎤 Create by voice</button>
        <button class="primary-btn" data-action="open-bill-modal">+ Create Bill</button>
      </div>
    </section>

    <div class="card">
      <div class="card-head">
        <h3>Recent Bills (${state.bills.length})</h3>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${billRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 6. REMINDERS PAGE
function renderRemindersPage() {
  let filtered = state.reminders;
  if (state.reminderFilter === 'pending') filtered = filtered.filter(r => r.status === 'pending');
  else if (state.reminderFilter === 'sent') filtered = filtered.filter(r => r.status === 'sent');
  else if (state.reminderFilter === 'completed') filtered = filtered.filter(r => r.status === 'completed');

  const reminderRows = filtered.length > 0
    ? filtered.map(r => `
      <div class="txn">
        <div class="txn-icon" style="background:#fee2e2;color:#b91c1c;">◌</div>
        <div class="txn-main">
          <strong>${r.customer_name}</strong>
          <span>Due: <strong>${r.due_date || 'Soon'}</strong> • Phone: ${r.customer_phone || 'N/A'} ${r.notes ? '• ' + r.notes : ''}</span>
        </div>
        <div class="txn-amount">
          <strong>${money(r.amount)}</strong>
          <span class="badge ${r.status === 'completed' ? 'paid' : r.status === 'sent' ? 'sent' : 'overdue'}">${r.status.toUpperCase()}</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="secondary-btn" style="padding:6px 10px;" data-action="send-whatsapp-reminder" data-id="${r.id}">📲 WhatsApp</button>
          <button class="secondary-btn" style="padding:6px 8px;" data-action="toggle-reminder-status" data-id="${r.id}" title="Mark Sent/Done">✓</button>
          <button class="danger-btn" style="padding:6px 8px;" data-action="delete-reminder" data-id="${r.id}">✕</button>
        </div>
      </div>
    `).join('')
    : `<div class="empty-state">
        <div class="empty-state-icon">◌</div>
        <h4>No reminders in this list</h4>
        <p>Add a payment due date to follow up on Udhari automatically.</p>
        <button class="primary-btn" data-action="open-add-reminder-modal">+ Create Reminder</button>
      </div>`;

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">FOLLOW-UP</span>
        <h2>${t('nav_reminders')}</h2>
        <p>Turn pending Udhari into timely payments with 1-click WhatsApp reminders.</p>
      </div>
      <button class="primary-btn" data-action="open-add-reminder-modal">+ Create Reminder</button>
    </section>

    <div class="card">
      <div class="filter-bar">
        <button class="filter-btn ${state.reminderFilter === 'all' ? 'active' : ''}" data-rem-filter="all">All Reminders (${state.reminders.length})</button>
        <button class="filter-btn ${state.reminderFilter === 'pending' ? 'active' : ''}" data-rem-filter="pending">Pending</button>
        <button class="filter-btn ${state.reminderFilter === 'sent' ? 'active' : ''}" data-rem-filter="sent">Sent</button>
        <button class="filter-btn ${state.reminderFilter === 'completed' ? 'active' : ''}" data-rem-filter="completed">Completed</button>
      </div>
      <div class="transaction-list">
        ${reminderRows}
      </div>
    </div>
  `;
}

// 7. REPORTS PAGE
function renderReportsPage() {
  const r = state.reports || {
    total_credit: 0,
    total_payment: 0,
    total_outstanding: 0,
    top_customers: [],
    intervals: [],
    mix: { credit_pct: 60, overdue_pct: 20, paid_pct: 20 }
  };

  const maxBar = Math.max(...(r.intervals.map(i => Math.max(i.credit, i.payment, 100))));
  const barsHtml = r.intervals.map(i => {
    const creditHeight = Math.max(8, (i.credit / maxBar) * 100);
    const paymentHeight = Math.max(8, (i.payment / maxBar) * 100);
    return `
      <div class="bar-col" title="${i.label}: Udhari ₹${i.credit}, Payment ₹${i.payment}">
        <div style="display:flex;gap:2px;width:100%;align-items:flex-end;height:100%;">
          <div class="bar credit-bar" style="height:${creditHeight}%;"></div>
          <div class="bar payment-bar" style="height:${paymentHeight}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  const topCustHtml = r.top_customers && r.top_customers.length > 0
    ? r.top_customers.slice(0, 4).map(c => `
      <div class="txn">
        <div class="txn-icon">${initials(c.name)}</div>
        <div class="txn-main">
          <strong>${c.name}</strong>
          <span class="badge ${c.status}">${c.status.toUpperCase()}</span>
        </div>
        <div class="txn-amount">
          <strong>${money(c.balance)}</strong>
        </div>
      </div>
    `).join('')
    : '<div style="padding:16px;color:var(--muted);font-size:12px;">No debtors currently.</div>';

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">BUSINESS INSIGHTS</span>
        <h2>${t('nav_reports')}</h2>
        <p>Understand your Udhari, collections and customer health with live database metrics.</p>
      </div>
      <div class="page-actions-row">
        <select class="form-select" id="reportPeriodSelect" style="width:auto;font-weight:700;">
          <option value="today" ${state.reportPeriod === 'today' ? 'selected' : ''}>Today</option>
          <option value="week" ${state.reportPeriod === 'week' ? 'selected' : ''}>This Week</option>
          <option value="month" ${state.reportPeriod === 'month' ? 'selected' : ''}>This Month</option>
          <option value="year" ${state.reportPeriod === 'year' ? 'selected' : ''}>This Year</option>
        </select>
      </div>
    </section>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-top"><span>Period Udhari</span><span class="icon">↗</span></div>
        <div class="stat-num">${money(r.total_credit)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span>Period Payments</span><span class="icon">↙</span></div>
        <div class="stat-num">${money(r.total_payment)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span>Total Outstanding</span><span class="icon">₹</span></div>
        <div class="stat-num">${money(r.total_outstanding)}</div>
      </div>
    </div>

    <div class="report-grid">
      <div class="card mini-chart">
        <h4>Udhari vs Collections Trend</h4>
        <div style="display:flex;gap:12px;font-size:10px;color:var(--muted);margin-bottom:8px;">
          <span><span class="legend-dot" style="background:#0f766e;"></span> Udhari</span>
          <span><span class="legend-dot" style="background:#d97706;"></span> Payments</span>
        </div>
        <div class="bars">
          ${barsHtml}
        </div>
        <div class="axis">
          <span>${r.intervals[0] ? r.intervals[0].label : 'Start'}</span>
          <span>${r.intervals[Math.floor(r.intervals.length / 2)] ? r.intervals[Math.floor(r.intervals.length / 2)].label : 'Mid'}</span>
          <span>${r.intervals[r.intervals.length - 1] ? r.intervals[r.intervals.length - 1].label : 'End'}</span>
        </div>
      </div>

      <div class="card mini-chart">
        <h4>Customer Account Breakdown</h4>
        <div class="donut-wrap">
          <div class="donut" style="background:conic-gradient(var(--primary) 0% ${r.mix.credit_pct}%, var(--danger) ${r.mix.credit_pct}% ${r.mix.credit_pct + r.mix.overdue_pct}%, #d4e5e2 ${r.mix.credit_pct + r.mix.overdue_pct}% 100%);">
            <div class="donut-inner">${money(r.total_outstanding)}</div>
          </div>
          <div class="donut-legend">
            <span><span class="legend-dot" style="background:var(--primary);"></span>Active ${r.mix.credit_pct}%</span>
            <span><span class="legend-dot" style="background:var(--danger);"></span>Overdue ${r.mix.overdue_pct}%</span>
            <span><span class="legend-dot" style="background:#d4e5e2;"></span>Paid ${r.mix.paid_pct}%</span>
          </div>
        </div>
      </div>

      <div class="card mini-chart">
        <h4>Top Outstanding Customers</h4>
        <div class="transaction-list">
          ${topCustHtml}
        </div>
      </div>
    </div>
  `;
}

// 8. AI ASSISTANT PAGE
function renderAssistantPage() {
  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">DATA-AWARE AI</span>
        <h2>${t('nav_assistant')}</h2>
        <p>Ask natural questions about your shop, customer dues, sales and daily collection.</p>
      </div>
      <button class="primary-btn" data-action="open-voice">🎤 Ask by voice</button>
    </section>

    <div class="assistant-layout">
      <div class="card chat-card">
        <div class="chat-messages" id="chatMessages">
          <div class="msg ai">
            Namaste ${(state.shop.owner_name || 'Bharat')} 👋 I am your UdhaarAI assistant.
            You can ask me questions about any customer, pending balances, today's transactions, or monthly sales!
          </div>
        </div>
        <form class="chat-input-row" id="assistantChatForm">
          <input id="chatInput" placeholder="Ask: Who owes me more than ₹5,000?" autocomplete="off" />
          <button type="submit" class="primary-btn" id="sendChatBtn">↗</button>
        </form>
      </div>

      <div class="card insight-card">
        <h3>Try Asking</h3>
        <div class="insight-box" data-ask="Who owes me more than 5000?">
          <strong>Overdue Accounts</strong>
          <p>“Who owes me more than ₹5,000?”</p>
        </div>
        <div class="insight-box" data-ask="Show Ramesh Patil ka balance">
          <strong>Customer Dues</strong>
          <p>“Show Ramesh Patil ka balance”</p>
        </div>
        <div class="insight-box" data-ask="How much payment received today?">
          <strong>Daily Collections</strong>
          <p>“How much payment did I receive today?”</p>
        </div>
        <div class="insight-box" data-ask="Who owes me the most?">
          <strong>Top Debtors</strong>
          <p>“Who owes me the most?”</p>
        </div>
        <div class="insight-box" data-ask="How much Udhari did I give this month?">
          <strong>Monthly Insights</strong>
          <p>“How much Udhari did I give this month?”</p>
        </div>
      </div>
    </div>
  `;
}

// 9. PRODUCTS PAGE
function renderProductsPage() {
  const prodRows = state.products.length > 0
    ? state.products.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><small style="color:var(--muted);">${p.sku || '—'}</small></td>
        <td>${p.category}</td>
        <td>${p.unit}</td>
        <td><strong>${money(p.price)}</strong></td>
        <td>
          <span style="font-weight:700;color:${p.stock < 10 ? 'var(--danger)' : 'var(--text)'};">
            ${p.stock} ${p.unit}
          </span>
        </td>
        <td>
          <button class="secondary-btn" data-action="edit-product" data-id="${p.id}">Edit</button>
          <button class="danger-btn" style="padding:6px 10px;" data-action="delete-product" data-id="${p.id}">✕</button>
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state-icon">□</div>
          <h4>No products in catalog</h4>
          <p>Add products and selling prices for faster voice & bill generation.</p>
          <button class="primary-btn" data-action="open-add-product-modal">${t('add_product')}</button>
        </div>
      </td></tr>`;

  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">CATALOG</span>
        <h2>${t('nav_products')}</h2>
        <p>Keep inventory and rates configured for instant voice recognition and billing.</p>
      </div>
      <button class="primary-btn" data-action="open-add-product-modal">${t('add_product')}</button>
    </section>

    <div class="card">
      <div class="card-head">
        <h3>Product Catalog (${state.products.length})</h3>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Selling Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${prodRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 10. SETTINGS PAGE
function renderSettingsPage() {
  const s = state.shop;
  return `
    <section class="page-head">
      <div>
        <span class="eyebrow">ACCOUNT & SHOP</span>
        <h2>${t('nav_settings')}</h2>
        <p>Configure shop profile, owner details, notifications and language preferences.</p>
      </div>
    </section>

    <div class="grid-2">
      <div class="card" style="padding:22px;">
        <h3 style="margin-top:0;">Shop & Owner Profile</h3>
        <form id="settingsForm">
          <div class="form-group">
            <label>Shop Name</label>
            <input class="form-input" id="setShopName" value="${s.name || ''}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Owner Name</label>
              <input class="form-input" id="setOwnerName" value="${s.owner_name || ''}" required />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input class="form-input" id="setPhone" value="${s.phone || ''}" required />
            </div>
          </div>
          <div class="form-group">
            <label>Shop Address</label>
            <input class="form-input" id="setAddress" value="${s.address || ''}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>GSTIN (Optional)</label>
              <input class="form-input" id="setGstin" value="${s.gstin || ''}" />
            </div>
            <div class="form-group">
              <label>Currency</label>
              <select class="form-select" id="setCurrency">
                <option value="INR" selected>INR (₹)</option>
              </select>
            </div>
          </div>
          <button type="submit" class="primary-btn" id="saveSettingsBtn">Save Settings</button>
        </form>
      </div>

      <div class="card" style="padding:22px;">
        <h3 style="margin-top:0;">AI & Voice Ledger Rules</h3>
        <div class="insight-box">
          <strong>✓ Transaction Confirmation</strong>
          <p>Financial ledger entries are never saved blindly; AI prompts for review/edit first.</p>
        </div>
        <div class="insight-box">
          <strong>✓ Multi-Language Processing</strong>
          <p>Supports Hindi, Marathi, English and Hinglish seamlessly.</p>
        </div>
        <div class="insight-box">
          <strong>✓ Strict Balance Integrity</strong>
          <p>Customer balances are calculated directly from verified ledger transactions.</p>
        </div>
      </div>
    </div>
  `;
}

// ================= MODAL FORMS =================

// Add/Edit Customer Modal
function showCustomerModal(customer = null) {
  const isEdit = !!customer;
  const html = `
    <h3 class="modal-title">${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
    <p class="modal-desc">${isEdit ? 'Update customer details' : 'Create a new customer profile'}</p>
    <form id="customerForm">
      <div class="form-group">
        <label>Full Name *</label>
        <input class="form-input" id="custName" value="${customer ? customer.name : ''}" required placeholder="e.g. Ramesh Patil" />
      </div>
      <div class="form-group">
        <label>Phone Number *</label>
        <input class="form-input" id="custPhone" value="${customer ? customer.phone : ''}" required placeholder="e.g. 9823012221" />
      </div>
      <div class="form-group">
        <label>Address</label>
        <input class="form-input" id="custAddress" value="${customer ? customer.address : ''}" placeholder="e.g. Shop 4, Market Yard" />
      </div>
      ${!isEdit ? `
        <div class="form-group">
          <label>Opening Udhari Balance (₹)</label>
          <input class="form-input" type="number" step="any" id="custOpeningBalance" value="0" placeholder="0" />
        </div>
      ` : ''}
      <div class="form-group">
        <label>Notes</label>
        <textarea class="form-textarea" id="custNotes" placeholder="Customer notes...">${customer ? customer.notes : ''}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelModalBtn">${t('cancel')}</button>
        <button type="submit" class="primary-btn" id="submitCustBtn">${isEdit ? 'Update Customer' : 'Save Customer'}</button>
      </div>
    </form>
  `;

  openAppModal(html);

  document.getElementById('cancelModalBtn').addEventListener('click', closeAppModal);
  document.getElementById('customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitCustBtn');
    btn.disabled = true;

    try {
      const payload = {
        name: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        address: document.getElementById('custAddress').value.trim(),
        notes: document.getElementById('custNotes').value.trim()
      };
      if (!isEdit) {
        payload.opening_balance = parseFloat(document.getElementById('custOpeningBalance').value) || 0;
      }

      const url = isEdit ? `/api/customers/${customer.id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        showToast(isEdit ? '✓ Customer updated' : '✓ Customer added');
        closeAppModal();
        await loadInitialData();
        render();
      }
    } catch (err) {
      showToast(err.message || 'Error saving customer', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// Customer Detail View
async function showCustomerDetail(customerId) {
  try {
    const res = await apiFetch(`/api/customers/${customerId}`);
    const c = res.customer;

    const txnItems = c.transactions && c.transactions.length > 0
      ? c.transactions.map(t => {
        const isCredit = t.type === 'credit';
        return `
          <div class="txn">
            <div class="txn-icon">${isCredit ? '↑' : '↓'}</div>
            <div class="txn-main">
              <strong>${t.desc || (isCredit ? 'Udhari' : 'Payment')}</strong>
              <span>${t.time}</span>
            </div>
            <div class="txn-amount">
              <strong class="${isCredit ? 'credit' : 'payment'}">${isCredit ? '+' : '−'}${money(t.amount)}</strong>
            </div>
          </div>
        `;
      }).join('')
      : '<div style="padding:16px;text-align:center;color:var(--muted);">No transactions recorded yet.</div>';

    const html = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <span class="avatar" style="width:44px;height:44px;font-size:16px;">${initials(c.name)}</span>
          <div>
            <h3 style="margin:0;">${c.name}</h3>
            <span style="color:var(--muted);font-size:12px;">📞 ${c.phone} • 📍 ${c.address || 'No address'}</span>
          </div>
        </div>
        <span class="badge ${c.status}">${c.status.toUpperCase()}</span>
      </div>

      <div class="stats" style="grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div class="stat-card" style="padding:12px;">
          <div class="stat-top"><span>Current Outstanding</span></div>
          <div class="stat-num" style="font-size:22px;color:var(--danger);">${money(c.balance)}</div>
        </div>
        <div class="stat-card" style="padding:12px;">
          <div class="stat-top"><span>Total Payments</span></div>
          <div class="stat-num" style="font-size:22px;color:var(--primary);">${money(c.total_payments || 0)}</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
        <button class="primary-btn" id="custAddUdhariBtn">+ Add Udhari</button>
        <button class="secondary-btn" id="custRecordPaymentBtn">₹ Record Payment</button>
        <button class="secondary-btn" id="custWhatsAppReminderBtn">📲 Send Reminder</button>
        <button class="secondary-btn" id="custEditBtn">✎ Edit</button>
        <button class="danger-btn" id="custDeleteBtn">🗑 Delete</button>
      </div>

      <h4 style="margin:16px 0 8px;">Ledger History</h4>
      <div class="transaction-list" style="border:1px solid var(--line);border-radius:12px;max-height:260px;overflow-y:auto;">
        ${txnItems}
      </div>
    `;

    openAppModal(html);

    document.getElementById('custAddUdhariBtn').addEventListener('click', () => {
      closeAppModal();
      showUdhariModal(c.id);
    });
    document.getElementById('custRecordPaymentBtn').addEventListener('click', () => {
      closeAppModal();
      showPaymentModal(c.id);
    });
    document.getElementById('custWhatsAppReminderBtn').addEventListener('click', () => {
      const msg = encodeURIComponent(`Namaste ${c.name}, this is a gentle reminder from ${state.shop.name} regarding your pending balance of ₹${c.balance}. Thank you!`);
      window.open(`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    });
    document.getElementById('custEditBtn').addEventListener('click', () => {
      closeAppModal();
      showCustomerModal(c);
    });
    document.getElementById('custDeleteBtn').addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete customer "${c.name}" and all their history?`)) {
        apiFetch(`/api/customers/${c.id}`, { method: 'DELETE' }).then(res => {
          showToast(`✓ ${c.name} deleted`);
          closeAppModal();
          loadInitialData().then(render);
        });
      }
    });
  } catch (err) {
    showToast('Failed to load customer details', true);
  }
}

// Add Udhari Modal
function showUdhariModal(selectedCustId = null) {
  const custOptions = state.customers.map(c => `
    <option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (Balance: ${money(c.balance)})</option>
  `).join('');

  const prodOptions = state.products.map(p => `
    <option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}">${p.name} - ${money(p.price)}/${p.unit}</option>
  `).join('');

  const html = `
    <h3 class="modal-title">Add Udhari (Credit)</h3>
    <p class="modal-desc">Record a credit transaction for a customer.</p>
    <form id="udhariForm">
      <div class="form-group">
        <label>Customer *</label>
        <select class="form-select" id="udhCustId" required>
          <option value="">Select customer...</option>
          ${custOptions}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Product (Optional)</label>
          <select class="form-select" id="udhProductSelect">
            <option value="">Select or type custom...</option>
            ${prodOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input class="form-input" type="number" step="any" id="udhQty" placeholder="e.g. 2" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Total Amount (₹) *</label>
          <input class="form-input" type="number" step="any" min="1" id="udhAmount" required placeholder="₹ Amount" />
        </div>
        <div class="form-group">
          <label>Description / Item</label>
          <input class="form-input" id="udhDesc" placeholder="e.g. Sugar 2kg" />
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelModalBtn">${t('cancel')}</button>
        <button type="submit" class="primary-btn" id="submitUdhBtn">Save Udhari</button>
      </div>
    </form>
  `;

  openAppModal(html);

  document.getElementById('cancelModalBtn').addEventListener('click', closeAppModal);

  const prodSelect = document.getElementById('udhProductSelect');
  const qtyInput = document.getElementById('udhQty');
  const amtInput = document.getElementById('udhAmount');
  const descInput = document.getElementById('udhDesc');

  function updateCalculatedAmount() {
    const opt = prodSelect.selectedOptions[0];
    if (opt && opt.dataset.price) {
      const price = parseFloat(opt.dataset.price) || 0;
      const qty = parseFloat(qtyInput.value) || 1;
      amtInput.value = (price * qty).toFixed(2);
      descInput.value = `${opt.textContent.split('-')[0].trim()} • ${qty} ${opt.dataset.unit || 'unit'}`;
    }
  }

  prodSelect.addEventListener('change', updateCalculatedAmount);
  qtyInput.addEventListener('input', updateCalculatedAmount);

  document.getElementById('udhariForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitUdhBtn');
    btn.disabled = true;

    try {
      const payload = {
        customer_id: parseInt(document.getElementById('udhCustId').value),
        amount: parseFloat(document.getElementById('udhAmount').value),
        type: 'credit',
        desc: document.getElementById('udhDesc').value.trim() || 'Manual Udhari Entry'
      };

      const res = await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`✓ ${money(payload.amount)} Udhari added`);
        closeAppModal();
        await loadInitialData();
        render();
      }
    } catch (err) {
      showToast(err.message || 'Error recording Udhari', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// Record Payment Modal
function showPaymentModal(selectedCustId = null) {
  const custOptions = state.customers.map(c => `
    <option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (Balance: ${money(c.balance)})</option>
  `).join('');

  const html = `
    <h3 class="modal-title">Record Payment</h3>
    <p class="modal-desc">Record money received from a customer to clear their balance.</p>
    <form id="paymentForm">
      <div class="form-group">
        <label>Customer *</label>
        <select class="form-select" id="payCustId" required>
          <option value="">Select customer...</option>
          ${custOptions}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Amount Received (₹) *</label>
          <input class="form-input" type="number" step="any" min="1" id="payAmount" required placeholder="₹ Amount" />
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select class="form-select" id="payMethod">
            <option value="cash">Cash</option>
            <option value="upi">UPI (PhonePe / GPay / Paytm)</option>
            <option value="bank">Bank Transfer (NEFT/IMPS)</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Reference / Note</label>
        <input class="form-input" id="payNotes" placeholder="e.g. UPI Txn ID or notes" />
      </div>

      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelModalBtn">${t('cancel')}</button>
        <button type="submit" class="primary-btn" id="submitPayBtn">Record Payment</button>
      </div>
    </form>
  `;

  openAppModal(html);

  document.getElementById('cancelModalBtn').addEventListener('click', closeAppModal);
  document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitPayBtn');
    btn.disabled = true;

    try {
      const payload = {
        customer_id: parseInt(document.getElementById('payCustId').value),
        amount: parseFloat(document.getElementById('payAmount').value),
        type: 'payment',
        payment_method: document.getElementById('payMethod').value,
        desc: document.getElementById('payNotes').value.trim() || `Payment received via ${document.getElementById('payMethod').value.toUpperCase()}`
      };

      const res = await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`✓ ${money(payload.amount)} payment recorded`);
        closeAppModal();
        await loadInitialData();
        render();
      }
    } catch (err) {
      showToast(err.message || 'Error recording payment', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// Create Bill Modal
function showCreateBillModal() {
  const custOptions = state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const prodOptions = state.products.map(p => `<option value="${p.id}" data-name="${p.name}" data-price="${p.price}" data-unit="${p.unit}">${p.name} (₹${p.price}/${p.unit})</option>`).join('');

  const html = `
    <h3 class="modal-title">Create New Bill</h3>
    <p class="modal-desc">Add line items to generate an invoice and optionally add to Udhari.</p>
    <form id="billForm">
      <div class="form-row">
        <div class="form-group">
          <label>Customer *</label>
          <select class="form-select" id="billCustId" required>
            <option value="">Select customer...</option>
            ${custOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Payment Status</label>
          <select class="form-select" id="billStatus">
            <option value="udhari">Add to Udhari (Credit)</option>
            <option value="paid">Paid (Cash/UPI)</option>
            <option value="draft">Draft (Unsaved to ledger)</option>
          </select>
        </div>
      </div>

      <div class="bill-items-head">
        <strong>Line Items</strong>
        <button type="button" class="secondary-btn" style="padding:4px 8px;font-size:11px;" id="addBillRowBtn">+ Add Item</button>
      </div>

      <div id="billItemsContainer">
        <div class="bill-item-row" data-row="0">
          <select class="form-select bill-item-prod">
            <option value="">Select Product...</option>
            ${prodOptions}
          </select>
          <input class="form-input bill-item-qty" type="number" min="0.1" step="any" value="1" placeholder="Qty" />
          <input class="form-input bill-item-price" type="number" step="any" placeholder="Rate" />
          <input class="form-input bill-item-total" type="text" readonly placeholder="Total" />
          <button type="button" class="remove-item-btn">×</button>
        </div>
      </div>

      <div class="bill-totals-box">
        <div class="bill-totals-row">
          <span>Subtotal:</span>
          <strong id="billSubtotalDisplay">₹0.00</strong>
        </div>
        <div class="bill-totals-row">
          <span>Discount (₹):</span>
          <input class="form-input" style="width:100px;padding:4px;" type="number" min="0" step="any" id="billDiscount" value="0" />
        </div>
        <div class="bill-totals-row grand">
          <span>Grand Total:</span>
          <span id="billGrandTotalDisplay">₹0.00</span>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelModalBtn">${t('cancel')}</button>
        <button type="submit" class="primary-btn" id="submitBillBtn">Generate Bill</button>
      </div>
    </form>
  `;

  openAppModal(html);

  const container = document.getElementById('billItemsContainer');
  const discountInput = document.getElementById('billDiscount');
  const subtotalDisplay = document.getElementById('billSubtotalDisplay');
  const grandDisplay = document.getElementById('billGrandTotalDisplay');

  function calculateBillTotals() {
    let subtotal = 0;
    container.querySelectorAll('.bill-item-row').forEach(row => {
      const qty = parseFloat(row.querySelector('.bill-item-qty').value) || 0;
      const price = parseFloat(row.querySelector('.bill-item-price').value) || 0;
      const tot = qty * price;
      row.querySelector('.bill-item-total').value = money(tot);
      subtotal += tot;
    });

    const disc = parseFloat(discountInput.value) || 0;
    const grand = Math.max(0, subtotal - disc);

    subtotalDisplay.textContent = money(subtotal);
    grandDisplay.textContent = money(grand);
  }

  function bindRowEvents(row) {
    const prodSelect = row.querySelector('.bill-item-prod');
    const qtyInput = row.querySelector('.bill-item-qty');
    const priceInput = row.querySelector('.bill-item-price');
    const removeBtn = row.querySelector('.remove-item-btn');

    prodSelect.addEventListener('change', () => {
      const opt = prodSelect.selectedOptions[0];
      if (opt && opt.dataset.price) {
        priceInput.value = opt.dataset.price;
        calculateBillTotals();
      }
    });

    qtyInput.addEventListener('input', calculateBillTotals);
    priceInput.addEventListener('input', calculateBillTotals);
    removeBtn.addEventListener('click', () => {
      if (container.querySelectorAll('.bill-item-row').length > 1) {
        row.remove();
        calculateBillTotals();
      }
    });
  }

  container.querySelectorAll('.bill-item-row').forEach(bindRowEvents);

  document.getElementById('addBillRowBtn').addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'bill-item-row';
    div.innerHTML = `
      <select class="form-select bill-item-prod">
        <option value="">Select Product...</option>
        ${prodOptions}
      </select>
      <input class="form-input bill-item-qty" type="number" min="0.1" step="any" value="1" placeholder="Qty" />
      <input class="form-input bill-item-price" type="number" step="any" placeholder="Rate" />
      <input class="form-input bill-item-total" type="text" readonly placeholder="Total" />
      <button type="button" class="remove-item-btn">×</button>
    `;
    container.appendChild(div);
    bindRowEvents(div);
  });

  discountInput.addEventListener('input', calculateBillTotals);
  document.getElementById('cancelModalBtn').addEventListener('click', closeAppModal);

  document.getElementById('billForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBillBtn');
    btn.disabled = true;

    try {
      const items = [];
      container.querySelectorAll('.bill-item-row').forEach(row => {
        const prodSelect = row.querySelector('.bill-item-prod');
        const opt = prodSelect.selectedOptions[0];
        const qty = parseFloat(row.querySelector('.bill-item-qty').value) || 1;
        const price = parseFloat(row.querySelector('.bill-item-price').value) || 0;
        const itemName = opt ? opt.dataset.name || 'General Item' : 'Item';
        const unit = opt ? opt.dataset.unit || 'pc' : 'pc';

        if (price > 0) {
          items.push({
            product_id: prodSelect.value ? parseInt(prodSelect.value) : null,
            item_name: itemName,
            quantity: qty,
            unit: unit,
            price: price
          });
        }
      });

      if (items.length === 0) {
        throw new Error('Please select at least one item with a valid price.');
      }

      const payload = {
        customer_id: parseInt(document.getElementById('billCustId').value),
        discount: parseFloat(discountInput.value) || 0,
        payment_status: document.getElementById('billStatus').value,
        items: items
      };

      const res = await apiFetch('/api/bills', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`✓ Bill #${res.bill.bill_number} generated`);
        closeAppModal();
        await loadInitialData();
        render();
        openInvoiceModal(res.bill);
      }
    } catch (err) {
      showToast(err.message || 'Error creating bill', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// Add/Edit Product Modal
function showProductModal(product = null) {
  const isEdit = !!product;
  const html = `
    <h3 class="modal-title">${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
    <p class="modal-desc">Configure catalog items and rates</p>
    <form id="productForm">
      <div class="form-group">
        <label>Product Name *</label>
        <input class="form-input" id="prodName" value="${product ? product.name : ''}" required placeholder="e.g. Sugar (M30)" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category</label>
          <input class="form-input" id="prodCat" value="${product ? product.category : 'Grocery'}" placeholder="Grocery" />
        </div>
        <div class="form-group">
          <label>Unit</label>
          <select class="form-select" id="prodUnit">
            <option value="kg" ${product && product.unit === 'kg' ? 'selected' : ''}>kg (Kilogram)</option>
            <option value="L" ${product && product.unit === 'L' ? 'selected' : ''}>L (Liter)</option>
            <option value="pack" ${product && product.unit === 'pack' ? 'selected' : ''}>pack (Packet)</option>
            <option value="pc" ${product && product.unit === 'pc' ? 'selected' : ''}>pc (Piece)</option>
            <option value="gram" ${product && product.unit === 'gram' ? 'selected' : ''}>gram (Gram)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Selling Price (₹) *</label>
          <input class="form-input" type="number" step="any" id="prodPrice" value="${product ? product.price : ''}" required placeholder="50" />
        </div>
        <div class="form-group">
          <label>Stock Available</label>
          <input class="form-input" type="number" step="any" id="prodStock" value="${product ? product.stock : '100'}" placeholder="100" />
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelModalBtn">${t('cancel')}</button>
        <button type="submit" class="primary-btn" id="submitProdBtn">${isEdit ? 'Update Product' : 'Add Product'}</button>
      </div>
    </form>
  `;

  openAppModal(html);

  document.getElementById('cancelModalBtn').addEventListener('click', closeAppModal);
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitProdBtn');
    btn.disabled = true;

    try {
      const payload = {
        name: document.getElementById('prodName').value.trim(),
        category: document.getElementById('prodCat').value.trim() || 'Grocery',
        unit: document.getElementById('prodUnit').value,
        price: parseFloat(document.getElementById('prodPrice').value) || 0,
        stock: parseFloat(document.getElementById('prodStock').value) || 0
      };

      const url = isEdit ? `/api/products/${product.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        showToast(isEdit ? '✓ Product updated' : '✓ Product created');
        closeAppModal();
        await loadInitialData();
        render();
      }
    } catch (err) {
      showToast(err.message || 'Error saving product', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// Add Reminder Modal
function showReminderModal() {
  const custOptions = state.customers.filter(c => c.balance > 0).map(c => `
    <option value="${c.id}" data-balance="${c.balance}">${c.name} (Due: ${money(c.balance)})</option>
  `).join('');

  const today = new Date().toISOString().split('T')[0];

  const html = `
    <h3 class="modal-title">Create Payment Reminder</h3>
    <p class="modal-desc">Schedule follow-ups for outstanding customer balances.</p>
    <form id="reminderForm">
      <div class="form-group">
        <label>Customer *</label>
        <select class="form-select" id="remCustId" required>
          <option value="">Select customer with pending balance...</option>
          ${custOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Reminder Amount (₹) *</label>
          <input class="form-input" type="number" step="any" id="remAmount" required placeholder="₹ Amount" />
        </div>
        <div class="form-group">
          <label>Due Date *</label>
          <input class="form-input" type="date" id="remDueDate" value="${today}" required />
        </div>
      </div>
      <div class="form-group">
        <label>Notes (Optional)</label>
        <input class="form-input" id="remNotes" placeholder="e.g. Call customer after lunch" />
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelModalBtn">${t('cancel')}</button>
        <button type="submit" class="primary-btn" id="submitRemBtn">Save Reminder</button>
      </div>
    </form>
  `;

  openAppModal(html);

  const custSelect = document.getElementById('remCustId');
  const amtInput = document.getElementById('remAmount');

  custSelect.addEventListener('change', () => {
    const opt = custSelect.selectedOptions[0];
    if (opt && opt.dataset.balance) {
      amtInput.value = opt.dataset.balance;
    }
  });

  document.getElementById('cancelModalBtn').addEventListener('click', closeAppModal);
  document.getElementById('reminderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitRemBtn');
    btn.disabled = true;

    try {
      const payload = {
        customer_id: parseInt(custSelect.value),
        amount: parseFloat(amtInput.value) || 0,
        due_date: document.getElementById('remDueDate').value,
        notes: document.getElementById('remNotes').value.trim()
      };

      const res = await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('✓ Reminder scheduled');
        closeAppModal();
        await loadInitialData();
        render();
      }
    } catch (err) {
      showToast(err.message || 'Error creating reminder', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// ================= EVENT BINDINGS =================
function bindGlobalEvents() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = btn.dataset.page;
      render();
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('voiceFab').addEventListener('click', openVoiceModal);
  document.getElementById('closeVoice').addEventListener('click', closeVoiceModal);
  voiceModalEl.addEventListener('click', (e) => {
    if (e.target === voiceModalEl) closeVoiceModal();
  });

  document.getElementById('bigMic').addEventListener('click', () => {
    if (state.voice.isListening) {
      stopListening();
    } else {
      startListening();
    }
  });

  document.getElementById('editVoice').addEventListener('click', toggleVoiceEditing);
  document.getElementById('confirmVoice').addEventListener('click', confirmVoiceTransaction);

  document.querySelectorAll('.quick-prompt-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      document.getElementById('voiceTranscript').textContent = `“${text}”`;
      processVoiceInput(text);
    });
  });

  appModalBackdrop.addEventListener('click', (e) => {
    if (e.target === appModalBackdrop) closeAppModal();
  });
  document.getElementById('closeAppModal').addEventListener('click', closeAppModal);

  document.getElementById('closeInvoiceBtn').addEventListener('click', closeInvoiceModal);
  document.getElementById('printInvoiceBtn').addEventListener('click', () => window.print());
  invoiceModalBackdrop.addEventListener('click', (e) => {
    if (e.target === invoiceModalBackdrop) closeInvoiceModal();
  });

  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');

  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.classList.toggle('hidden');
  });

  langMenu.querySelectorAll('.dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.language = btn.dataset.lang;
      localStorage.setItem('udhaar_lang', state.language);
      langBtn.textContent = btn.textContent + ' ▾';
      langMenu.classList.add('hidden');
      applyLanguageTranslations();
      render();
      showToast(`Language set to ${btn.textContent}`);
    });
  });

  const notifyBtn = document.getElementById('notifyBtn');
  const notifyMenu = document.getElementById('notifyMenu');
  const notifyList = document.getElementById('notifyList');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  notifyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifyMenu.classList.toggle('hidden');
    renderNotificationsList();
  });

  markAllReadBtn.addEventListener('click', async () => {
    await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
    state.unreadNotifs = 0;
    updateNotificationBadge();
    renderNotificationsList();
    showToast('✓ All notifications marked read');
  });

  function renderNotificationsList() {
    if (state.notifications.length === 0) {
      notifyList.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px;">No notifications.</div>';
      return;
    }
    notifyList.innerHTML = state.notifications.map(n => `
      <div class="notify-item ${n.read ? '' : 'unread'}">
        <strong>${n.title}</strong>
        <p>${n.message}</p>
        <small>${n.time || 'Recently'}</small>
      </div>
    `).join('');
  }

  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('hidden');
  });

  profileMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      const act = item.dataset.action;
      profileMenu.classList.add('hidden');
      if (act === 'open-shop-settings') {
        state.page = 'settings';
        render();
      } else if (act === 'reset-demo-data') {
        loadInitialData().then(() => {
          render();
          showToast('✓ Data reloaded from database');
        });
      }
    });
  });

  const globalSearch = document.getElementById('globalSearch');
  const searchDropdown = document.getElementById('searchDropdown');
  const searchClear = document.getElementById('searchClear');

  globalSearch.addEventListener('input', async () => {
    const q = globalSearch.value.trim();
    if (q.length > 0) {
      searchClear.classList.remove('hidden');
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
        renderSearchResults(res.results);
      } catch (e) {}
    } else {
      searchClear.classList.add('hidden');
      searchDropdown.classList.add('hidden');
    }
  });

  searchClear.addEventListener('click', () => {
    globalSearch.value = '';
    searchClear.classList.add('hidden');
    searchDropdown.classList.add('hidden');
  });

  function renderSearchResults(res) {
    let html = '';
    if (res.customers && res.customers.length > 0) {
      html += '<div class="search-category-title">Customers</div>';
      res.customers.forEach(c => {
        html += `<div class="search-item" data-action="view-customer" data-id="${c.id}">
          <div><strong>${c.name}</strong><small>${c.phone}</small></div>
          <strong style="color:var(--primary);">${money(c.balance)}</strong>
        </div>`;
      });
    }
    if (res.bills && res.bills.length > 0) {
      html += '<div class="search-category-title">Bills</div>';
      res.bills.forEach(b => {
        html += `<div class="search-item" data-action="preview-bill" data-id="${b.id}">
          <div><strong>#${b.bill_number}</strong><small>${b.customer_name}</small></div>
          <strong>${money(b.total_amount)}</strong>
        </div>`;
      });
    }
    if (res.products && res.products.length > 0) {
      html += '<div class="search-category-title">Products</div>';
      res.products.forEach(p => {
        html += `<div class="search-item" data-action="edit-product" data-id="${p.id}">
          <div><strong>${p.name}</strong><small>${p.category}</small></div>
          <strong>${money(p.price)}/${p.unit}</strong>
        </div>`;
      });
    }

    if (!html) {
      html = '<div style="padding:14px;text-align:center;color:var(--muted);font-size:12px;">No matching results found.</div>';
    }

    searchDropdown.innerHTML = html;
    searchDropdown.classList.remove('hidden');

    searchDropdown.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        const id = parseInt(item.dataset.id);
        searchDropdown.classList.add('hidden');
        if (action === 'view-customer') showCustomerDetail(id);
        else if (action === 'preview-bill') {
          apiFetch(`/api/bills/${id}`).then(r => openInvoiceModal(r.bill));
        } else if (action === 'edit-product') {
          const prod = state.products.find(p => p.id === id);
          if (prod) showProductModal(prod);
        }
      });
    });
  }

  document.addEventListener('click', () => {
    langMenu.classList.add('hidden');
    notifyMenu.classList.add('hidden');
    profileMenu.classList.add('hidden');
    searchDropdown.classList.add('hidden');
  });

  document.getElementById('shopMini').addEventListener('click', () => {
    state.page = 'settings';
    render();
  });
}

function bindPageEvents() {
  document.querySelectorAll('[data-action="open-voice"]').forEach(btn => btn.addEventListener('click', openVoiceModal));
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => {
    state.page = btn.dataset.nav;
    render();
  }));

  document.querySelectorAll('[data-action="open-add-customer-modal"]').forEach(btn => btn.addEventListener('click', () => showCustomerModal()));
  document.querySelectorAll('[data-action="view-customer"]').forEach(btn => btn.addEventListener('click', () => showCustomerDetail(parseInt(btn.dataset.id))));
  document.querySelectorAll('[data-cust-filter]').forEach(btn => btn.addEventListener('click', () => {
    state.customerFilter = btn.dataset.custFilter;
    render();
  }));

  document.querySelectorAll('[data-action="open-udhari-modal"]').forEach(btn => btn.addEventListener('click', () => showUdhariModal()));
  document.querySelectorAll('[data-ledger-filter]').forEach(btn => btn.addEventListener('click', () => {
    state.ledgerFilter = btn.dataset.ledgerFilter;
    render();
  }));
  document.querySelectorAll('[data-action="delete-txn"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    if (confirm('Delete this transaction? The customer balance will be recalculated.')) {
      apiFetch(`/api/transactions/${id}`, { method: 'DELETE' }).then(() => {
        showToast('✓ Transaction deleted');
        loadInitialData().then(render);
      });
    }
  }));

  document.querySelectorAll('[data-action="open-payment-modal"]').forEach(btn => btn.addEventListener('click', () => showPaymentModal()));
  document.querySelectorAll('[data-action="share-receipt"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    const p = state.payments.find(x => x.id === id);
    if (p) {
      const msg = encodeURIComponent(`Payment Receipt:\nReceived ₹${p.amount} from ${p.customer_name} via ${(p.payment_method || 'cash').toUpperCase()}.\nThank you! — ${state.shop.name}`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  }));

  document.querySelectorAll('[data-action="open-bill-modal"]').forEach(btn => btn.addEventListener('click', showCreateBillModal));
  document.querySelectorAll('[data-action="preview-bill"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    apiFetch(`/api/bills/${id}`).then(r => openInvoiceModal(r.bill));
  }));
  document.querySelectorAll('[data-action="delete-bill"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    if (confirm('Delete this bill?')) {
      apiFetch(`/api/bills/${id}`, { method: 'DELETE' }).then(() => {
        showToast('✓ Bill deleted');
        loadInitialData().then(render);
      });
    }
  }));

  document.querySelectorAll('[data-action="open-add-reminder-modal"]').forEach(btn => btn.addEventListener('click', showReminderModal));
  document.querySelectorAll('[data-rem-filter]').forEach(btn => btn.addEventListener('click', () => {
    state.reminderFilter = btn.dataset.remFilter;
    render();
  }));
  document.querySelectorAll('[data-action="send-whatsapp-reminder"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    const r = state.reminders.find(x => x.id === id);
    if (r) {
      const msg = encodeURIComponent(`Namaste ${r.customer_name}, gentle reminder from ${state.shop.name} regarding your pending balance of ₹${r.amount}. Kindly pay at your earliest convenience.`);
      window.open(`https://wa.me/91${(r.customer_phone || '').replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    }
  }));
  document.querySelectorAll('[data-action="toggle-reminder-status"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    const r = state.reminders.find(x => x.id === id);
    if (r) {
      const nextStatus = r.status === 'pending' ? 'sent' : r.status === 'sent' ? 'completed' : 'pending';
      apiFetch(`/api/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      }).then(() => {
        showToast(`✓ Reminder marked as ${nextStatus}`);
        loadInitialData().then(render);
      });
    }
  }));
  document.querySelectorAll('[data-action="delete-reminder"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    if (confirm('Delete this reminder?')) {
      apiFetch(`/api/reminders/${id}`, { method: 'DELETE' }).then(() => {
        showToast('✓ Reminder deleted');
        loadInitialData().then(render);
      });
    }
  }));

  const repSelect = document.getElementById('reportPeriodSelect');
  if (repSelect) {
    repSelect.addEventListener('change', async () => {
      state.reportPeriod = repSelect.value;
      const res = await apiFetch(`/api/reports?period=${state.reportPeriod}`);
      state.reports = res.data;
      render();
    });
  }

  const chatForm = document.getElementById('assistantChatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;

      appendChatMessage('user', text);
      input.value = '';

      try {
        const res = await apiFetch('/api/assistant/chat', {
          method: 'POST',
          body: JSON.stringify({ message: text })
        });
        appendChatMessage('ai', res.reply);
      } catch (err) {
        appendChatMessage('ai', 'Sorry, I could not process your query right now.');
      }
    });

    document.querySelectorAll('[data-ask]').forEach(box => {
      box.addEventListener('click', () => {
        const query = box.dataset.ask;
        document.getElementById('chatInput').value = query;
        chatForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  document.querySelectorAll('[data-action="open-add-product-modal"]').forEach(btn => btn.addEventListener('click', () => showProductModal()));
  document.querySelectorAll('[data-action="edit-product"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    const prod = state.products.find(p => p.id === id);
    if (prod) showProductModal(prod);
  }));
  document.querySelectorAll('[data-action="delete-product"]').forEach(btn => btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id);
    if (confirm('Delete this product?')) {
      apiFetch(`/api/products/${id}`, { method: 'DELETE' }).then(() => {
        showToast('✓ Product deleted');
        loadInitialData().then(render);
      });
    }
  }));

  const setForm = document.getElementById('settingsForm');
  if (setForm) {
    setForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('saveSettingsBtn');
      btn.disabled = true;

      try {
        const payload = {
          name: document.getElementById('setShopName').value.trim(),
          owner_name: document.getElementById('setOwnerName').value.trim(),
          phone: document.getElementById('setPhone').value.trim(),
          address: document.getElementById('setAddress').value.trim(),
          gstin: document.getElementById('setGstin').value.trim(),
          currency: document.getElementById('setCurrency').value
        };

        const res = await apiFetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          state.shop = res.shop;
          updateShopUI();
          showToast('✓ Settings updated successfully');
        }
      } catch (err) {
        showToast(err.message || 'Error updating settings', true);
      } finally {
        btn.disabled = false;
      }
    });
  }
}

function appendChatMessage(sender, htmlContent) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = `msg ${sender}`;
  msg.innerHTML = htmlContent;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function applyLanguageTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

// ================= INITIALIZATION =================
window.addEventListener('DOMContentLoaded', async () => {
  const langNames = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };
  document.getElementById('langBtn').textContent = (langNames[state.language] || 'हिंदी') + ' ▾';

  applyLanguageTranslations();
  bindGlobalEvents();
  await loadInitialData();
  render();
});

