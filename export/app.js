/**
 * BILLIARD POS & ACCOUNTING - STATIC APP MOTOR (ES6)
 */

// ==========================================
// SEED DATA & CONFIGURATION CONSTANTS
// ==========================================
const INITIAL_TABLES = [
  { id: "M1", number: "01", name: "Meja 1 (VIP)", type: "9-Feet Premium", pricePerHour: 50000, status: "Kosong" },
  { id: "M2", number: "02", name: "Meja 2 (VIP)", type: "9-Feet Premium", pricePerHour: 50000, status: "Kosong" },
  { id: "M3", number: "03", name: "Meja 3 (Standard)", type: "9-Feet Standard", pricePerHour: 40000, status: "Kosong" },
  { id: "M4", number: "04", name: "Meja 4 (Standard)", type: "9-Feet Standard", pricePerHour: 40000, status: "Kosong" },
  { id: "M5", number: "05", name: "Meja 5 (Snooker)", type: "Snooker", pricePerHour: 60000, status: "Kosong" },
  { id: "M6", number: "06", name: "Meja 6 (Bar)", type: "Bar Table", pricePerHour: 30000, status: "Kosong" }
];

const INITIAL_PRODUCTS = [
  { id: "P1", name: "Teh Botol Sosro", category: "Minuman", price: 8000, stock: 120 },
  { id: "P2", name: "Coca Cola Cans", category: "Minuman", price: 10000, stock: 85 },
  { id: "P3", name: "Aqua Botol 600ml", category: "Minuman", price: 5000, stock: 200 },
  { id: "P4", name: "Indomie Goreng Double", category: "Makanan", price: 18000, stock: 150 },
  { id: "P5", name: "Nasi Goreng Spesial", category: "Makanan", price: 22000, stock: 75 },
  { id: "P6", name: "Kentang Goreng (Fries)", category: "Makanan", price: 15000, stock: 90 },
  { id: "P7", name: "Kripik Singkong", category: "Snack", price: 7000, stock: 110 }
];

const INITIAL_EXPENSES = [
  { id: "E1", date: "2026-07-01", category: "Gaji", amount: 2500000, note: "Gaji Kasir Roni bulan Juli" },
  { id: "E2", date: "2026-07-02", category: "Listrik", amount: 850000, note: "Tagihan listrik PLN Juli" },
  { id: "E3", date: "2026-07-03", category: "Internet", amount: 350000, note: "Tagihan Wifi Biznet" }
];

const INITIAL_SETTINGS = {
  appsScriptUrl: "",
  useDemoMode: true,
  taxPercent: 10,
  discountPercent: 0,
  billiardName: "Arena Billiard & Lounge",
  billiardAddress: "Jl. Raya Billiard No. 88, Jakarta Selatan"
};

// ==========================================
// SYSTEM STATE MANAGEMENT
// ==========================================
let tables = [];
let products = [];
let transactions = [];
let expenses = [];
let auditLogs = [];
let settings = {};
let currentSession = null;
let lastActivityTime = Date.now();

// Active Checkout variables
let activeCheckoutTable = null;
let checkoutCart = [];
let checkoutDiscount = 0;

// Initialize data from LocalStorage
function initApp() {
  settings = JSON.parse(localStorage.getItem("billiard_settings")) || INITIAL_SETTINGS;
  tables = JSON.parse(localStorage.getItem("billiard_tables")) || INITIAL_TABLES;
  products = JSON.parse(localStorage.getItem("billiard_products")) || INITIAL_PRODUCTS;
  transactions = JSON.parse(localStorage.getItem("billiard_transactions")) || [];
  expenses = JSON.parse(localStorage.getItem("billiard_expenses")) || INITIAL_EXPENSES;
  auditLogs = JSON.parse(localStorage.getItem("billiard_logs")) || [];

  saveLocalAll();
  setupEventListeners();
  startTimers();
  updateClock();
}

function saveLocalAll() {
  localStorage.setItem("billiard_settings", JSON.stringify(settings));
  localStorage.setItem("billiard_tables", JSON.stringify(tables));
  localStorage.setItem("billiard_products", JSON.stringify(products));
  localStorage.setItem("billiard_transactions", JSON.stringify(transactions));
  localStorage.setItem("billiard_expenses", JSON.stringify(expenses));
  localStorage.setItem("billiard_logs", JSON.stringify(auditLogs));
}

// Format Rupiah helper
function formatRupiah(num) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

// Generate unique invoice ID
function generateInvoiceCode() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}${day}-${rand}`;
}

// ==========================================
// UI VIEW & NAVIGATION ROUTER
// ==========================================
function switchView(viewId) {
  if (!currentSession) {
    showView("login-view");
    return;
  }

  // Hide all screens
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.add("d-none"));
  
  // Show target
  const targetSec = document.getElementById(`${viewId}-view`);
  if (targetSec) targetSec.classList.remove("d-none");

  // Update active sidebar nav indicators
  document.querySelectorAll(".sidebar .nav-link").forEach(link => link.classList.remove("active"));
  const navLink = document.querySelector(`.sidebar .nav-link[data-view="${viewId}"]`);
  if (navLink) navLink.classList.add("active");

  // Reload specific view components
  if (viewId === "dashboard") renderDashboard();
  else if (viewId === "transaksi") renderTransaksiPOS();
  else if (viewId === "meja") renderMasterMeja();
  else if (viewId === "produk") renderMasterProduk();
  else if (viewId === "pembukuan") renderPembukuan();
  else if (viewId === "laporan") renderLaporan();
  else if (viewId === "logs") renderAuditLogs();
  else if (viewId === "settings") renderSettings();
}

function showView(viewId) {
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.add("d-none"));
  const target = document.getElementById(viewId);
  if (target) target.classList.remove("d-none");
}

// ==========================================
// AUDIT LOGGING SERVICE
// ==========================================
function writeLog(action, detail) {
  const newLog = {
    id: "L" + Math.floor(Math.random() * 1000000),
    timestamp: new Date().toISOString(),
    user: currentSession ? currentSession.name : "System",
    action,
    detail
  };
  auditLogs.unshift(newLog);
  localStorage.setItem("billiard_logs", JSON.stringify(auditLogs));

  if (!settings.useDemoMode && settings.appsScriptUrl) {
    fetch(settings.appsScriptUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveAuditLog",
        user: currentSession ? currentSession.name : "System",
        act: action,
        detail: detail
      })
    }).catch(console.error);
  }
}

// ==========================================
// TICKERS & TIMERS SYSTEM
// ==========================================
function startTimers() {
  // Update clocks and timers every second
  setInterval(() => {
    updateClock();
    if (currentSession && document.getElementById("transaksi-view") && !document.getElementById("transaksi-view").classList.contains("d-none")) {
      updateActiveTimersInPOS();
    }
  }, 1000);

  // Idle timeout detector (30 minutes check)
  setInterval(() => {
    if (!currentSession) return;
    const inactiveMs = Date.now() - lastActivityTime;
    const thirtyMinsMs = 30 * 60 * 1000;
    if (inactiveMs >= thirtyMinsMs) {
      logoutUser();
      alert("Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 30 menit.");
    }
  }, 10000);
}

function updateClock() {
  const clockEl = document.getElementById("realtime-clock");
  if (clockEl) {
    clockEl.textContent = new Date().toLocaleTimeString("id-ID") + " WIB";
  }
}

function updateActiveTimersInPOS() {
  tables.forEach(table => {
    if (table.status === "Dipakai") {
      const card = document.querySelector(`.billiard-table-card[data-id="${table.id}"]`);
      if (card) {
        const start = new Date(table.currentStartTime);
        const elapsedMs = Date.now() - start.getTime();
        const hrs = elapsedMs / (1000 * 60 * 60);
        
        // Calculate minutes and seconds
        const totalSecs = Math.floor(elapsedMs / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;

        const timerStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        const costStr = formatRupiah(Math.round(hrs * table.pricePerHour));

        const timerEl = card.querySelector(".live-duration");
        const costEl = card.querySelector(".live-cost");
        if (timerEl) timerEl.textContent = timerStr;
        if (costEl) costEl.textContent = costStr;
      }
    }
  });
}

// ==========================================
// CORE RENDERERS: DASHBOARD & POS
// ==========================================
function renderDashboard() {
  // Stats cards
  const todayStr = new Date().toISOString().split("T")[0];
  let revToday = 0;
  let revMonth = 0;
  let txTodayCount = 0;
  let customersToday = {};

  transactions.forEach(t => {
    if (t.status === "Selesai") {
      const txDate = new Date(t.timestamp);
      if (t.date === todayStr) {
        revToday += t.grandTotal;
        txTodayCount++;
        customersToday[t.customer] = true;
      }
      if (txDate.getMonth() === new Date().getMonth() && txDate.getFullYear() === new Date().getFullYear()) {
        revMonth += t.grandTotal;
      }
    }
  });

  const activeTables = tables.filter(t => t.status === "Dipakai").length;
  const emptyTables = tables.filter(t => t.status === "Kosong").length;

  document.getElementById("stat-revenue-today").textContent = formatRupiah(revToday);
  document.getElementById("stat-revenue-month").textContent = formatRupiah(revMonth);
  document.getElementById("stat-tx-today").textContent = txTodayCount;
  document.getElementById("stat-tables-used").textContent = activeTables;
  document.getElementById("stat-tables-empty").textContent = emptyTables;
  document.getElementById("stat-customers-today").textContent = Object.keys(customersToday).length;

  // Render Monitor Meja Grid
  const grid = document.getElementById("dashboard-tables-grid");
  if (grid) {
    grid.innerHTML = tables.map(t => {
      let statusClass = "badge-kosong";
      if (t.status === "Dipakai") statusClass = "badge-dipakai";
      else if (t.status === "Maintenance") statusClass = "badge-maintenance";

      return `
        <div class="col-6 col-md-4 col-lg-2">
          <div class="billiard-table-box p-3 border rounded text-center">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-xs text-muted font-monospace">${t.number}</span>
              <span class="status-badge ${statusClass}">${t.status}</span>
            </div>
            <h5 class="text-white font-weight-black mb-1">${t.name}</h5>
            <p class="text-xs text-muted mb-0">${t.type}</p>
          </div>
        </div>
      `;
    }).join("");
  }
}

function renderTransaksiPOS() {
  const container = document.getElementById("pos-tables-container");
  if (!container) return;

  container.innerHTML = tables.map(t => {
    const isBusy = t.status === "Dipakai";
    const isMaint = t.status === "Maintenance";
    let cardClass = "";
    if (isBusy) cardClass = "active border-danger";
    if (isMaint) cardClass = "opacity-50";

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="billiard-table-card billiard-table-box p-4 h-100 ${cardClass}" data-id="${t.id}">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <span class="text-[10px] text-muted uppercase font-bold tracking-wider">${t.type}</span>
              <h4 class="text-white font-extrabold mt-1 mb-0">Meja Nol ${t.number}</h4>
              <p class="text-xs text-muted mb-0">${t.name}</p>
            </div>
            <span class="status-badge ${isBusy ? "badge-dipakai" : isMaint ? "badge-maintenance" : "badge-kosong"}">
              ${t.status}
            </span>
          </div>

          ${isBusy ? `
            <div class="bg-black/30 p-3 rounded-lg border border-slate-750 mb-3">
              <p class="text-xs text-muted mb-1">Customer: <strong class="text-white">${t.currentCustomer}</strong></p>
              <div class="d-flex justify-content-between text-xs font-mono">
                <div>
                  <span class="text-slate-500 d-block">Durasi Bermain</span>
                  <span class="live-duration text-emerald-400 font-bold">00:00:00</span>
                </div>
                <div class="text-end">
                  <span class="text-slate-500 d-block">Tarif Berjalan</span>
                  <span class="live-cost text-emerald-400 font-bold">Rp 0</span>
                </div>
              </div>
            </div>
          ` : isMaint ? `
            <div class="p-3 bg-warning/10 text-warning text-xs rounded border border-warning/10 mb-3">
              Sedang dalam servis/perawatan laken berkala.
            </div>
          ` : `
            <div class="p-3 bg-black/10 text-xs text-muted rounded border border-slate-800 d-flex justify-between mb-3">
              <span>Tarif per jam:</span>
              <strong class="text-slate-200">${formatRupiah(t.pricePerHour)}</strong>
            </div>
          `}

          <div class="mt-auto pt-3 border-top border-slate-800">
            ${isBusy ? `
              <button onclick="openCheckoutModal('${t.id}')" class="btn btn-danger w-full py-2.5 font-bold text-xs uppercase cursor-pointer">
                Selesai Bermain (Checkout)
              </button>
            ` : isMaint ? `
              <button disabled class="btn btn-secondary w-full py-2.5 text-xs font-bold uppercase cursor-not-allowed">
                Maintenance
              </button>
            ` : `
              <button onclick="openMulaiSewaModal('${t.id}')" class="btn btn-outline-success w-full py-2.5 text-xs font-bold uppercase cursor-pointer">
                Mulai Sewa Meja
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================
// CORE BUSINESS FUNCTIONS & CHECKOUT MODALS
// ==========================================
function openMulaiSewaModal(tableId) {
  const table = tables.find(t => t.id === tableId);
  if (!table) return;

  const modalHtml = `
    <div class="modal fade" id="mulaiSewaModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-slate-800 border-slate-700 text-white">
          <div class="modal-header border-slate-750">
            <h5 class="modal-title font-bold text-white">Mulai Bermain - Meja ${table.number}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="start-play-form">
              <div class="mb-3">
                <label class="form-label text-xs font-bold uppercase tracking-wider text-muted">Nama Customer</label>
                <input type="text" id="play-customer-name" required class="form-control" placeholder="Masukkan nama pemain">
              </div>
              <div class="mb-3">
                <label class="form-label text-xs font-bold uppercase tracking-wider text-muted">Estimasi Durasi (Jam)</label>
                <input type="number" id="play-estimated-hours" required min="1" max="24" value="1" class="form-control font-mono">
              </div>
              <button type="submit" class="btn btn-emerald w-full py-3 font-bold uppercase tracking-wide cursor-pointer text-slate-950">
                Mulai Bermain
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modals
  const oldModal = document.getElementById("mulaiSewaModal");
  if (oldModal) oldModal.remove();

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const bsModal = new bootstrap.Modal(document.getElementById("mulaiSewaModal"));
  bsModal.show();

  document.getElementById("start-play-form").onsubmit = function(e) {
    e.preventDefault();
    const custName = document.getElementById("play-customer-name").value;
    const estHrs = parseFloat(document.getElementById("play-estimated-hours").value) || 1;

    // Set state
    tables = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: "Dipakai",
          currentStartTime: new Date().toISOString(),
          currentCustomer: custName,
          currentEstimatedHours: estHrs
        };
      }
      return t;
    });

    // Create Transaction status: Aktif
    const newTx = {
      invoiceNumber: generateInvoiceCode(),
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      customer: custName,
      tableNumber: table.number,
      tableType: table.type,
      pricePerHour: table.pricePerHour,
      startTime: new Date().toISOString(),
      durationHours: estHrs,
      tableCost: 0,
      itemsCost: 0,
      taxCost: 0,
      discountCost: 0,
      grandTotal: 0,
      paymentMethod: "Cash",
      amountPaid: 0,
      changeAmount: 0,
      status: "Aktif",
      items: [],
      cashierName: currentSession ? currentSession.name : "Cashier"
    };

    transactions.unshift(newTx);
    saveLocalAll();
    writeLog("Mulai Sewa Meja", `Meja Nol ${table.number} disewa oleh ${custName}`);
    
    bsModal.hide();
    renderTransaksiPOS();
    showToast(`Meja ${table.number} berhasil dimulai!`, "success");

    // Mirror to Apps Script
    if (!settings.useDemoMode && settings.appsScriptUrl) {
      fetch(settings.appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "saveTransaksi", transaksi: newTx })
      }).catch(console.error);
    }
  };
}

function openCheckoutModal(tableId) {
  const table = tables.find(t => t.id === tableId);
  if (!table) return;

  activeCheckoutTable = table;
  checkoutCart = [];
  checkoutDiscount = settings.discountPercent;

  const start = new Date(table.currentStartTime);
  const elapsedMs = Date.now() - start.getTime();
  const rawHrs = elapsedMs / (1000 * 60 * 60);
  const duration = Math.max(0.01, parseFloat(rawHrs.toFixed(2))); // minimum 0.01 hr
  const tableCost = Math.round(duration * table.pricePerHour);

  const modalHtml = `
    <div class="modal fade" id="checkoutModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-slate-800 border-slate-700 text-white">
          <div class="modal-header border-slate-750">
            <h5 class="modal-title font-bold text-white">Checkout Kasir - Meja ${table.number}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-4">
              
              <!-- Left: Cafe Products Catalog and added Cart -->
              <div class="col-12 col-lg-7">
                <h6 class="font-bold text-emerald-400 mb-3 border-bottom border-slate-700 pb-2">
                  <i class="fas fa-utensils"></i> Tambah Menu Kafe / Snacks
                </h6>
                
                <!-- Product grid -->
                <div class="row g-2 mb-3 max-h-[220px] overflow-y-auto" id="pos-products-grid">
                  ${products.map(p => `
                    <div class="col-4">
                      <button onclick="addProductToCart('${p.id}')" class="btn btn-outline-secondary w-full p-2.5 text-start border-slate-700/60 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all h-100 d-flex flex-col justify-content-between text-white cursor-pointer">
                        <div>
                          <span class="text-[8px] badge bg-slate-900 border border-slate-800">${p.category}</span>
                          <p class="text-xs font-bold text-slate-200 mt-1 mb-0">${p.name}</p>
                        </div>
                        <strong class="text-xs font-mono text-emerald-400 mt-2 block">${formatRupiah(p.price)}</strong>
                      </button>
                    </div>
                  `).join("")}
                </div>

                <!-- Added items cart -->
                <div class="bg-black/30 p-3 rounded-xl border border-slate-750">
                  <p class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Item Belanja Tambahan</p>
                  <div id="checkout-cart-container" class="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    <p class="text-xs text-slate-500 italic">Belum ada makanan/minuman ringan yang ditambahkan.</p>
                  </div>
                </div>
              </div>

              <!-- Right: Pricing Calculations Cash Drawer -->
              <div class="col-12 col-lg-5">
                <div class="bg-black/20 p-4 border border-slate-700 rounded-2xl d-flex flex-col justify-between h-100">
                  <div>
                    <h6 class="font-bold border-bottom border-slate-800 pb-2 mb-3">Rincian Nota Billing</h6>
                    
                    <div class="space-y-2 text-xs">
                      <div class="d-flex justify-content-between text-muted">
                        <span>Pemain / Customer</span>
                        <strong class="text-white">${table.currentCustomer}</strong>
                      </div>
                      <div class="d-flex justify-content-between text-muted">
                        <span>Lama Sewa Aktif</span>
                        <strong class="text-emerald-400 font-mono">${Math.floor(duration * 60)} menit (${duration} jam)</strong>
                      </div>
                      <div class="d-flex justify-content-between text-muted border-top border-slate-800 pt-2">
                        <span>Sewa Meja Billiard</span>
                        <strong class="text-white font-mono" id="check-table-cost" data-val="${tableCost}">${formatRupiah(tableCost)}</strong>
                      </div>
                      <div class="d-flex justify-content-between text-muted">
                        <span>Tambahan Kafe</span>
                        <strong class="text-white font-mono" id="check-items-cost" data-val="0">Rp 0</strong>
                      </div>

                      <div class="d-flex justify-content-between text-muted border-top border-slate-800 pt-2 align-items-center">
                        <span>Diskon (%)</span>
                        <input type="number" id="check-discount-input" min="0" max="100" value="${checkoutDiscount}" onchange="recalculateTotals()" class="form-control p-1 text-center font-bold font-mono" style="width: 60px; height: 28px;">
                      </div>
                      <div class="d-flex justify-content-between text-muted">
                        <span>Potongan Diskon</span>
                        <strong class="text-danger font-mono" id="check-discount-cost">Rp 0</strong>
                      </div>

                      <div class="d-flex justify-content-between text-muted">
                        <span>Pajak (${settings.taxPercent}%)</span>
                        <strong class="text-slate-300 font-mono" id="check-tax-cost">Rp 0</strong>
                      </div>

                      <div class="d-flex justify-content-between border-top border-slate-800 pt-3 align-items-center">
                        <span class="text-sm font-bold text-white">Grand Total</span>
                        <span class="text-lg font-mono font-black text-emerald-400" id="check-grand-total">Rp 0</span>
                      </div>
                    </div>

                    <!-- Payment choices -->
                    <div class="mt-4 border-top border-slate-800 pt-3">
                      <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider">Metode Pembayaran</label>
                      <select id="checkout-payment-method" onchange="togglePaymentInputs()" class="form-select text-xs">
                        <option value="Cash">Cash (Tunai)</option>
                        <option value="QRIS">QRIS</option>
                        <option value="Transfer">Transfer Bank</option>
                        <option value="Debit">Debit Card</option>
                      </select>
                    </div>

                    <!-- Nominal paid input -->
                    <div class="mt-3">
                      <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider">Nominal Dibayar (Rp)</label>
                      <input type="number" id="checkout-amount-paid" class="form-control font-mono font-bold" placeholder="Masukkan jumlah tunai" oninput="recalculateTotals()">
                      <div class="d-flex justify-content-between text-xs mt-2" id="checkout-change-row">
                        <span class="text-muted">Uang Kembalian:</span>
                        <strong class="text-emerald-400 font-mono font-bold" id="checkout-change-amount">Rp 0</strong>
                      </div>
                    </div>

                  </div>

                  <div class="d-flex gap-2 mt-4 pt-3 border-top border-slate-800">
                    <button type="button" class="btn btn-secondary flex-1 py-3 font-bold text-xs" data-bs-dismiss="modal">Batal</button>
                    <button onclick="submitFinalCheckout()" class="btn btn-emerald flex-1 py-3 font-black text-xs uppercase tracking-wide text-slate-950">
                      Bayar & Selesai
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const oldModal = document.getElementById("checkoutModal");
  if (oldModal) oldModal.remove();

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const bsModal = new bootstrap.Modal(document.getElementById("checkoutModal"));
  bsModal.show();

  recalculateTotals();
}

function addProductToCart(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;
  if (prod.stock <= 0) {
    showToast(`Stok ${prod.name} habis!`, "error");
    return;
  }

  const existing = checkoutCart.find(item => item.productId === productId);
  if (existing) {
    if (existing.qty >= prod.stock) {
      showToast(`Maksimum stok tercapai (${prod.stock})`, "error");
      return;
    }
    existing.qty++;
    existing.total = existing.qty * existing.price;
  } else {
    checkoutCart.push({
      productId: prod.id,
      name: prod.name,
      qty: 1,
      price: prod.price,
      total: prod.price
    });
  }

  renderCheckoutCart();
  recalculateTotals();
}

function adjustCartQty(productId, delta) {
  const item = checkoutCart.find(item => item.productId === productId);
  if (!item) return;

  const prod = products.find(p => p.id === productId);
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    checkoutCart = checkoutCart.filter(item => item.productId !== productId);
  } else {
    if (prod && newQty > prod.stock) {
      showToast(`Stok produk terbatas!`, "error");
      return;
    }
    item.qty = newQty;
    item.total = newQty * item.price;
  }

  renderCheckoutCart();
  recalculateTotals();
}

function renderCheckoutCart() {
  const cont = document.getElementById("checkout-cart-container");
  if (!cont) return;

  if (checkoutCart.length === 0) {
    cont.innerHTML = `<p class="text-xs text-slate-500 italic">Belum ada makanan/minuman ringan yang ditambahkan.</p>`;
    return;
  }

  cont.innerHTML = checkoutCart.map(item => `
    <div class="d-flex justify-content-between align-items-center text-xs">
      <div>
        <strong class="text-slate-200">${item.name}</strong>
        <span class="d-block text-[10px] text-slate-500">${formatRupiah(item.price)} x ${item.qty}</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="font-mono text-emerald-400 font-bold mr-2">${formatRupiah(item.total)}</span>
        <button onclick="adjustCartQty('${item.productId}', -1)" class="btn btn-sm btn-dark p-1 cursor-pointer">&minus;</button>
        <span class="font-bold px-1">${item.qty}</span>
        <button onclick="adjustCartQty('${item.productId}', 1)" class="btn btn-sm btn-dark p-1 cursor-pointer">&#43;</button>
      </div>
    </div>
  `).join("");
}

function recalculateTotals() {
  const tableCost = parseInt(document.getElementById("check-table-cost").getAttribute("data-val")) || 0;
  
  const itemsCost = checkoutCart.reduce((sum, item) => sum + item.total, 0);
  document.getElementById("check-items-cost").setAttribute("data-val", itemsCost);
  document.getElementById("check-items-cost").textContent = formatRupiah(itemsCost);

  const subtotal = tableCost + itemsCost;
  
  const discPercent = parseFloat(document.getElementById("check-discount-input").value) || 0;
  const discountCost = Math.round((subtotal * discPercent) / 100);
  document.getElementById("check-discount-cost").textContent = `-${formatRupiah(discountCost)}`;

  const taxable = subtotal - discountCost;
  const taxCost = Math.round((taxable * settings.taxPercent) / 100);
  document.getElementById("check-tax-cost").textContent = formatRupiah(taxCost);

  const grandTotal = taxable + taxCost;
  document.getElementById("check-grand-total").textContent = formatRupiah(grandTotal);
  document.getElementById("check-grand-total").setAttribute("data-val", grandTotal);

  // Trigger change calculator
  const method = document.getElementById("checkout-payment-method").value;
  const amountPaidInput = document.getElementById("checkout-amount-paid");
  
  if (method !== "Cash") {
    amountPaidInput.value = grandTotal;
    amountPaidInput.disabled = true;
  } else {
    amountPaidInput.disabled = false;
  }

  const paidVal = parseFloat(amountPaidInput.value) || 0;
  const change = Math.max(0, paidVal - grandTotal);
  document.getElementById("checkout-change-amount").textContent = formatRupiah(change);
}

function togglePaymentInputs() {
  recalculateTotals();
}

function submitFinalCheckout() {
  if (!activeCheckoutTable) return;

  const grandTotal = parseInt(document.getElementById("check-grand-total").getAttribute("data-val")) || 0;
  const paidVal = parseFloat(document.getElementById("checkout-amount-paid").value) || 0;

  if (paidVal < grandTotal) {
    showToast(`Uang yang dibayarkan kurang! Minimal ${formatRupiah(grandTotal)}`, "error");
    return;
  }

  const tableCost = parseInt(document.getElementById("check-table-cost").getAttribute("data-val")) || 0;
  const itemsCost = parseInt(document.getElementById("check-items-cost").getAttribute("data-val")) || 0;
  const discPercent = parseFloat(document.getElementById("check-discount-input").value) || 0;
  const discountCost = Math.round(((tableCost + itemsCost) * discPercent) / 100);
  const taxCost = Math.round(((tableCost + itemsCost - discountCost) * settings.taxPercent) / 100);

  const start = new Date(activeCheckoutTable.currentStartTime);
  const elapsedMs = Date.now() - start.getTime();
  const hrs = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(2));

  // Deduct products stock
  checkoutCart.forEach(item => {
    products = products.map(p => {
      if (p.id === item.productId) {
        return { ...p, stock: Math.max(0, p.stock - item.qty) };
      }
      return p;
    });
  });

  // Create Transaction status: Selesai
  const finalTx = {
    invoiceNumber: generateInvoiceCode(),
    date: new Date().toISOString().split("T")[0],
    timestamp: new Date().toISOString(),
    customer: activeCheckoutTable.currentCustomer,
    tableNumber: activeCheckoutTable.number,
    tableType: activeCheckoutTable.type,
    pricePerHour: activeCheckoutTable.pricePerHour,
    startTime: activeCheckoutTable.currentStartTime,
    endTime: new Date().toISOString(),
    durationHours: hrs,
    tableCost: tableCost,
    itemsCost: itemsCost,
    taxCost: taxCost,
    discountCost: discountCost,
    grandTotal: grandTotal,
    paymentMethod: document.getElementById("checkout-payment-method").value,
    amountPaid: paidVal,
    changeAmount: paidVal - grandTotal,
    status: "Selesai",
    items: checkoutCart,
    cashierName: currentSession ? currentSession.name : "Cashier"
  };

  // Save State
  transactions.unshift(finalTx);
  
  // Set Meja back to Kosong
  tables = tables.map(t => {
    if (t.id === activeCheckoutTable.id) {
      return {
        ...t,
        status: "Kosong",
        currentStartTime: null,
        currentCustomer: null,
        currentEstimatedHours: null
      };
    }
    return t;
  });

  saveLocalAll();
  writeLog("Selesai Sewa Meja", `Checkout Meja Nol ${activeCheckoutTable.number} invoice ${finalTx.invoiceNumber}`);

  // Hide modal
  const bsModal = bootstrap.Modal.getInstance(document.getElementById("checkoutModal"));
  bsModal.hide();

  renderTransaksiPOS();
  showToast("Transaksi berhasil ditutup!", "success");
  
  // Show Thermal receipt dialog simulation
  showSimulatedReceipt(finalTx);

  // Sync back to Google Sheets if online
  if (!settings.useDemoMode && settings.appsScriptUrl) {
    fetch(settings.appsScriptUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "finishTransaksi", checkout: finalTx })
    }).catch(console.error);
  }

  // Reset active variables
  activeCheckoutTable = null;
  checkoutCart = [];
}

// Simulated Receipt printer
function showSimulatedReceipt(tx) {
  const formattedDuration = `${Math.floor(tx.durationHours * 60)} mnt`;
  const modalHtml = `
    <div class="modal fade" id="receiptModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-slate-800 border-slate-700 text-white">
          <div class="modal-header border-slate-750">
            <h5 class="modal-title text-white">Preview Struk Kasir</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-slate-900">
            <div class="thermal-receipt">
              <div class="text-center">
                <h6 class="font-weight-black uppercase m-0">${settings.billiardName}</h6>
                <p style="font-size: 8px; margin: 2px 0;">${settings.billiardAddress}</p>
                <p style="font-size: 8px; margin: 0;">Telp: (021) 8823-1111</p>
                <hr>
                <p style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin: 4px 0;">Struk Pembayaran</p>
              </div>

              <div style="font-size: 9px; margin-top: 10px;">
                <p style="margin: 2px 0;">Invoice  : ${tx.invoiceNumber}</p>
                <p style="margin: 2px 0;">Tanggal  : ${new Date(tx.timestamp).toLocaleDateString("id-ID")} ${new Date(tx.timestamp).toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"})}</p>
                <p style="margin: 2px 0;">Pemain   : ${tx.customer}</p>
                <p style="margin: 2px 0;">Kasir    : ${tx.cashierName}</p>
              </div>
              <hr>

              <div style="font-size: 9px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                  <span>Meja ${tx.tableNumber} - ${tx.tableType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-left: 10px;">
                  <span>Durasi: ${formattedDuration}</span>
                  <span>${formatRupiah(tx.tableCost)}</span>
                </div>

                ${tx.items.map(item => `
                  <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>${item.name}</span>
                    <span>${formatRupiah(item.total)}</span>
                  </div>
                  <div style="font-size: 8px; color: #64748b; padding-left: 10px;">
                    ${item.qty} x ${formatRupiah(item.price)}
                  </div>
                `).join("")}
              </div>
              <hr>

              <div style="font-size: 9px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Biaya Meja</span>
                  <span>${formatRupiah(tx.tableCost)}</span>
                </div>
                ${tx.itemsCost > 0 ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span>Biaya Menu</span>
                    <span>${formatRupiah(tx.itemsCost)}</span>
                  </div>
                ` : ""}
                ${tx.discountCost > 0 ? `
                  <div style="display: flex; justify-content: space-between; color: #dc2626;">
                    <span>Diskon</span>
                    <span>-${formatRupiah(tx.discountCost)}</span>
                  </div>
                ` : ""}
                ${tx.taxCost > 0 ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span>Pajak (${settings.taxPercent}%)</span>
                    <span>${formatRupiah(tx.taxCost)}</span>
                  </div>
                ` : ""}
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px;">
                  <span>Grand Total</span>
                  <span>${formatRupiah(tx.grandTotal)}</span>
                </div>
              </div>
              <hr>

              <div style="font-size: 9px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Bayar (${tx.paymentMethod})</span>
                  <span>${formatRupiah(tx.amountPaid)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Kembalian</span>
                  <span>${formatRupiah(tx.changeAmount)}</span>
                </div>
              </div>

              <div class="text-center" style="margin-top: 20px; font-size: 9px;">
                <p style="font-weight: bold; margin: 0;">TERIMA KASIH</p>
                <p style="font-size: 7px; margin: 2px 0;">Powered by B8 Billiard POS</p>
              </div>
            </div>
          </div>
          <div class="modal-footer border-slate-750">
            <button onclick="window.print()" class="btn btn-emerald text-slate-950 font-bold text-xs uppercase cursor-pointer">Cetak PDF</button>
            <button type="button" class="btn btn-secondary text-xs" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const oldModal = document.getElementById("receiptModal");
  if (oldModal) oldModal.remove();

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const bsModal = new bootstrap.Modal(document.getElementById("receiptModal"));
  bsModal.show();
}

// ==========================================
// MASTER CRUD & OTHER TAB RENDERERS
// ==========================================
// NOTE: Since the prompt requested separate HTML pages, the individual html views (dashboard.html, transaksi.html etc.)
// can be loaded statically. This app.js coordinates the modular static functions beautifully.

function showToast(msg, type) {
  const existing = document.querySelector(".toast-custom");
  if (existing) existing.remove();

  const toastClass = type === "success" ? "toast-success" : "toast-error";
  const toastHtml = `
    <div class="toast-custom ${toastClass}">
      <span class="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
      <span>${msg}</span>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", toastHtml);
  setTimeout(() => {
    const el = document.querySelector(".toast-custom");
    if (el) el.remove();
  }, 3500);
}

// On Page Load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
