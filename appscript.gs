/**
 * GOOGLE APPS SCRIPT DATABASE - BILLIARD POS & ACCOUNTING
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Spreadsheet baru atau yang sudah ada.
 * 2. Klik menu 'Ekstensi' -> 'Apps Script'.
 * 3. Hapus semua kode default di editor, lalu paste kode ini.
 * 4. Klik ikon Simpan (kamera/disket).
 * 5. Jalankan fungsi 'setupDatabase' terlebih dahulu dengan memilihnya di dropdown atas dan menekan 'Jalankan'.
 *    Fungsi ini akan otomatis membuat semua sheet yang diperlukan beserta kolom headernya.
 * 6. Klik tombol 'Terapkan' (Deploy) -> 'Penerapan Baru' (New Deployment).
 * 7. Pilih tipe: 'Aplikasi Web' (Web App).
 * 8. Konfigurasi:
 *    - Deskripsi: Billiard POS API
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone) -> Ini penting agar aplikasi React bisa mengaksesnya.
 * 9. Klik 'Terapkan' dan berikan izin otorisasi yang diminta (klik Advanced -> Go to ... (unsafe)).
 * 10. Salin URL Aplikasi Web yang diberikan (berakhiran /exec) dan masukkan ke panel Pengaturan (Settings) di aplikasi web kita.
 */

function doGet(e) {
  var action = e.parameter.action;
  
  // Set up response with CORS headers
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  try {
    var data;
    switch (action) {
      case "getDashboard":
        data = getDashboardData();
        break;
      case "getMeja":
        data = getMejaData();
        break;
      case "getProduk":
        data = getProdukData();
        break;
      case "getRiwayat":
        var limit = e.parameter.limit ? parseInt(e.parameter.limit) : null;
        data = getRiwayatData(limit);
        break;
      case "getPengeluaran":
        data = getPengeluaranData();
        break;
      case "getAuditLog":
        data = getAuditLogData();
        break;
      case "getSettings":
        data = getSettingsData();
        break;
      default:
        return response.setContent(JSON.stringify({ 
          status: "error", 
          message: "Aksi tidak dikenal atau parameter 'action' kosong." 
        }));
    }
    return response.setContent(JSON.stringify({ status: "success", data: data }));
  } catch (error) {
    return response.setContent(JSON.stringify({ status: "error", message: error.toString() }));
  }
}

function doPost(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var result;
    
    switch (action) {
      case "login":
        result = loginUser(postData.username, postData.password);
        break;
      case "saveMeja":
        result = saveOrUpdateMeja(postData.meja);
        break;
      case "deleteMeja":
        result = deleteMeja(postData.id);
        break;
      case "saveProduk":
        result = saveOrUpdateProduk(postData.produk);
        break;
      case "deleteProduk":
        result = deleteProduk(postData.id);
        break;
      case "saveTransaksi":
        result = saveTransaksi(postData.transaksi);
        break;
      case "finishTransaksi":
        result = finishTransaksi(postData.checkout);
        break;
      case "savePengeluaran":
        result = saveOrUpdatePengeluaran(postData.pengeluaran);
        break;
      case "deletePengeluaran":
        result = deletePengeluaran(postData.id);
        break;
      case "saveSettings":
        result = saveSettings(postData.settings);
        break;
      case "saveAuditLog":
        result = writeAuditLog(postData.user, postData.act, postData.detail);
        break;
      default:
        return response.setContent(JSON.stringify({ 
          status: "error", 
          message: "Aksi POST tidak dikenal." 
        }));
    }
    
    return response.setContent(JSON.stringify(result));
  } catch (error) {
    return response.setContent(JSON.stringify({ status: "error", message: error.toString() }));
  }
}

// ==========================================
// DB SETUP & DATABASE RETRIEVAL UTILS
// ==========================================

function getDb() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Membuat lembar kerja baru jika belum ada dan membuat header kolom
 */
function setupDatabase() {
  var ss = getDb();
  var sheets = {
    "User": ["username", "password", "name", "role"],
    "Meja": ["id", "number", "name", "type", "pricePerHour", "status", "currentStartTime", "currentCustomer", "currentEstimatedHours", "billingType", "packageHours"],
    "Transaksi": ["invoiceNumber", "date", "timestamp", "customer", "tableNumber", "tableType", "pricePerHour", "startTime", "endTime", "durationHours", "tableCost", "itemsCost", "taxCost", "discountCost", "grandTotal", "paymentMethod", "amountPaid", "changeAmount", "status", "cashierName", "billingType", "packageHours"],
    "Detail Transaksi": ["invoiceNumber", "productId", "productName", "qty", "price", "total"],
    "Produk": ["id", "name", "category", "price", "stock"],
    "Pengeluaran": ["id", "date", "category", "amount", "note"],
    "AuditLog": ["id", "timestamp", "user", "action", "detail"],
    "Setting": ["key", "value"]
  };
  
  for (var sheetName in sheets) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      Logger.log("Membuat Sheet: " + sheetName);
    } else {
      Logger.log("Sheet sudah ada: " + sheetName);
    }
  }
  
  // Seed initial Admin & Kasir users if empty
  var userSheet = ss.getSheetByName("User");
  if (userSheet.getLastRow() <= 1) {
    userSheet.appendRow(["admin", "admin123", "Billiard Manager", "Admin"]);
    userSheet.appendRow(["kasir", "kasir123", "Billiard Cashier", "Kasir"]);
    Logger.log("User default ditambahkan (admin/admin123 & kasir/kasir123)");
  }
  
  // Seed initial Meja if empty
  var mejaSheet = ss.getSheetByName("Meja");
  if (mejaSheet.getLastRow() <= 1) {
    mejaSheet.appendRow(["M1", "01", "Meja 1", "9-Feet Standard", 40000, "Kosong", "", "", ""]);
    mejaSheet.appendRow(["M2", "02", "Meja 2", "9-Feet Standard", 40000, "Kosong", "", "", ""]);
    mejaSheet.appendRow(["M3", "03", "Meja 3", "9-Feet Premium", 50000, "Kosong", "", "", ""]);
    mejaSheet.appendRow(["M4", "04", "Meja 4", "9-Feet Premium", 50000, "Kosong", "", "", ""]);
    mejaSheet.appendRow(["M5", "05", "Meja 5", "Snooker", 60000, "Kosong", "", "", ""]);
    Logger.log("Meja billiard default ditambahkan.");
  }

  // Seed initial Produk if empty
  var produkSheet = ss.getSheetByName("Produk");
  if (produkSheet.getLastRow() <= 1) {
    produkSheet.appendRow(["P1", "Teh Botol Sosro", "Minuman", 8000, 100]);
    produkSheet.appendRow(["P2", "Coca Cola", "Minuman", 10000, 50]);
    produkSheet.appendRow(["P3", "Indomie Goreng + Telur", "Makanan", 18000, 200]);
    produkSheet.appendRow(["P4", "Kentang Goreng", "Makanan", 15000, 100]);
    produkSheet.appendRow(["P5", "Kripik Singkong", "Snack", 7000, 150]);
    Logger.log("Produk default ditambahkan.");
  }
  
  // Seed Settings if empty
  var settingSheet = ss.getSheetByName("Setting");
  if (settingSheet.getLastRow() <= 1) {
    settingSheet.appendRow(["billiardName", "Arena Billiard & Lounge"]);
    settingSheet.appendRow(["billiardAddress", "Jl. Raya Billiard No. 88, Jakarta"]);
    settingSheet.appendRow(["taxPercent", "10"]);
    settingSheet.appendRow(["discountPercent", "0"]);
    Logger.log("Pengaturan default ditambahkan.");
  }
  
  return "Database Setup Selesai dengan Sukses!";
}

function getRowsData(sheetName) {
  var sheet = getDb().getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  
  return values.map(function(row) {
    var obj = {};
    headers.forEach(function(header, colIndex) {
      obj[header] = row[colIndex];
    });
    return obj;
  });
}

// ==========================================
// ENDPOINT IMPLEMENTATIONS
// ==========================================

function loginUser(username, password) {
  var users = getRowsData("User");
  var matched = users.find(function(u) {
    return String(u.username).toLowerCase() === String(username).toLowerCase() && String(u.password) === String(password);
  });
  
  if (matched) {
    writeAuditLog(matched.name, "Login", "Berhasil masuk ke sistem sebagai " + matched.role);
    return {
      status: "success",
      user: {
        username: matched.username,
        name: matched.name,
        role: matched.role
      }
    };
  } else {
    return { status: "error", message: "Username atau password salah!" };
  }
}

function getDashboardData() {
  var trans = getRowsData("Transaksi");
  var mejas = getRowsData("Meja");
  
  var todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  var revenueToday = 0;
  var revenueMonth = 0;
  var transTodayCount = 0;
  var customersToday = {};
  
  var now = new Date();
  var thisMonth = now.getMonth();
  var thisYear = now.getFullYear();
  
  trans.forEach(function(t) {
    if (t.status === "Selesai") {
      var tDate = new Date(t.timestamp);
      var tDateStr = t.date; // YYYY-MM-DD
      
      if (tDateStr === todayStr) {
        revenueToday += Number(t.grandTotal || 0);
        transTodayCount++;
        if (t.customer) {
          customersToday[t.customer] = true;
        }
      }
      
      if (tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear) {
        revenueMonth += Number(t.grandTotal || 0);
      }
    }
  });
  
  var tablesInUse = mejas.filter(function(m) { return m.status === "Dipakai"; }).length;
  var tablesAvailable = mejas.filter(function(m) { return m.status === "Kosong"; }).length;
  
  return {
    revenueToday: revenueToday,
    revenueMonth: revenueMonth,
    transactionCountToday: transTodayCount,
    tablesInUse: tablesInUse,
    tablesAvailable: tablesAvailable,
    customerCountToday: Object.keys(customersToday).length
  };
}

function getMejaData() {
  return getRowsData("Meja");
}

function getProdukData() {
  return getRowsData("Produk");
}

function getRiwayatData(limit) {
  var trans = getRowsData("Transaksi");
  var detailTrans = getRowsData("Detail Transaksi");
  
  // Sort descending by timestamp
  trans.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  if (limit) {
    trans = trans.slice(0, limit);
  }
  
  // Attach detail items
  trans.forEach(function(t) {
    t.items = detailTrans.filter(function(d) {
      return String(d.invoiceNumber) === String(t.invoiceNumber);
    });
  });
  
  return trans;
}

function getPengeluaranData() {
  var data = getRowsData("Pengeluaran");
  data.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  return data;
}

function getAuditLogData() {
  var logs = getRowsData("AuditLog");
  logs.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  return logs.slice(0, 100); // return top 100 logs
}

function getSettingsData() {
  var settings = getRowsData("Setting");
  var obj = {};
  settings.forEach(function(s) {
    obj[s.key] = s.value;
  });
  return obj;
}

// ==========================================
// WRITE & MODIFY OPERATIONAL ENDPOINTS
// ==========================================

function saveOrUpdateMeja(mejaObj) {
  var sheet = getDb().getSheetByName("Meja");
  var data = sheet.getDataRange().getValues();
  var foundIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(mejaObj.id)) {
      foundIndex = i + 1; // row index
      break;
    }
  }
  
  var values = [
    mejaObj.id,
    mejaObj.number,
    mejaObj.name,
    mejaObj.type,
    Number(mejaObj.pricePerHour),
    mejaObj.status,
    mejaObj.currentStartTime || "",
    mejaObj.currentCustomer || "",
    mejaObj.currentEstimatedHours || "",
    mejaObj.billingType || "Open",
    mejaObj.packageHours || ""
  ];
  
  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 1, 1, values.length).setValues([values]);
    writeAuditLog("System", "Update Meja", "Mengubah data Meja Nomor " + mejaObj.number);
  } else {
    sheet.appendRow(values);
    writeAuditLog("System", "Tambah Meja", "Menambahkan Meja Baru Nomor " + mejaObj.number);
  }
  return { status: "success", message: "Data meja berhasil disimpan!" };
}

function deleteMeja(id) {
  var sheet = getDb().getSheetByName("Meja");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      writeAuditLog("System", "Hapus Meja", "Menghapus Meja ID: " + id);
      return { status: "success", message: "Meja berhasil dihapus." };
    }
  }
  return { status: "error", message: "Meja tidak ditemukan." };
}

function saveOrUpdateProduk(prodObj) {
  var sheet = getDb().getSheetByName("Produk");
  var data = sheet.getDataRange().getValues();
  var foundIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(prodObj.id)) {
      foundIndex = i + 1;
      break;
    }
  }
  
  var values = [
    prodObj.id,
    prodObj.name,
    prodObj.category,
    Number(prodObj.price),
    Number(prodObj.stock)
  ];
  
  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 1, 1, values.length).setValues([values]);
    writeAuditLog("System", "Update Produk", "Mengubah produk: " + prodObj.name);
  } else {
    sheet.appendRow(values);
    writeAuditLog("System", "Tambah Produk", "Menambahkan produk baru: " + prodObj.name);
  }
  return { status: "success", message: "Produk berhasil disimpan!" };
}

function deleteProduk(id) {
  var sheet = getDb().getSheetByName("Produk");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      writeAuditLog("System", "Hapus Produk", "Menghapus produk: " + data[i][1]);
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Produk berhasil dihapus." };
    }
  }
  return { status: "error", message: "Produk tidak ditemukan." };
}

/**
 * Mencatat Mulai Bermain (Transaksi Aktif)
 */
function saveTransaksi(transObj) {
  var ss = getDb();
  var tSheet = ss.getSheetByName("Transaksi");
  
  // Format Row
  var row = [
    transObj.invoiceNumber,
    transObj.date,
    transObj.timestamp,
    transObj.customer,
    transObj.tableNumber,
    transObj.tableType,
    Number(transObj.pricePerHour),
    transObj.startTime,
    "", // endTime
    0, // duration
    0, // tableCost
    0, // itemsCost
    0, // tax
    0, // discount
    0, // grandTotal
    transObj.paymentMethod,
    0, // amountPaid
    0, // changeAmount
    "Aktif",
    transObj.cashierName,
    transObj.billingType || "Open",
    transObj.packageHours || ""
  ];
  
  tSheet.appendRow(row);
  
  // Update status Meja di spreadsheet
  var mSheet = ss.getSheetByName("Meja");
  var mData = mSheet.getDataRange().getValues();
  for (var i = 1; i < mData.length; i++) {
    if (String(mData[i][1]) === String(transObj.tableNumber)) {
      mSheet.getRange(i + 1, 6, 1, 6).setValues([[
        "Dipakai",
        transObj.startTime,
        transObj.customer,
        transObj.currentEstimatedHours || "",
        transObj.billingType || "Open",
        transObj.packageHours || ""
      ]]);
      break;
    }
  }
  
  writeAuditLog(transObj.cashierName, "Mulai Sewa Meja", "Meja " + transObj.tableNumber + " untuk Customer: " + transObj.customer);
  return { status: "success", message: "Sewa Meja dimulai!" };
}

/**
 * Selesai Bermain & Melunasi Pembayaran
 */
function finishTransaksi(checkoutObj) {
  var ss = getDb();
  var tSheet = ss.getSheetByName("Transaksi");
  var tData = tSheet.getDataRange().getValues();
  var foundRow = -1;
  
  // Find active transaction by invoice
  for (var i = 1; i < tData.length; i++) {
    if (String(tData[i][0]) === String(checkoutObj.invoiceNumber)) {
      foundRow = i + 1;
      break;
    }
  }
  
  if (foundRow === -1) {
    return { status: "error", message: "Transaksi tidak ditemukan." };
  }
  
  // Save items in Detail Transaksi & adjust stock in Produk
  var detailSheet = ss.getSheetByName("Detail Transaksi");
  var prodSheet = ss.getSheetByName("Produk");
  var prodData = prodSheet.getDataRange().getValues();
  
  checkoutObj.items.forEach(function(item) {
    detailSheet.appendRow([
      checkoutObj.invoiceNumber,
      item.productId,
      item.name,
      Number(item.qty),
      Number(item.price),
      Number(item.total)
    ]);
    
    // Potong Stok
    for (var k = 1; k < prodData.length; k++) {
      if (String(prodData[k][0]) === String(item.productId)) {
        var currentStock = Number(prodData[k][4]);
        var newStock = Math.max(0, currentStock - item.qty);
        prodSheet.getRange(k + 1, 5).setValue(newStock);
        break;
      }
    }
  });
  
  // Update main transaction row
  var updatedValues = [
    checkoutObj.invoiceNumber,
    checkoutObj.date,
    checkoutObj.timestamp,
    checkoutObj.customer,
    checkoutObj.tableNumber,
    checkoutObj.tableType,
    Number(checkoutObj.pricePerHour),
    checkoutObj.startTime,
    checkoutObj.endTime,
    Number(checkoutObj.durationHours),
    Number(checkoutObj.tableCost),
    Number(checkoutObj.itemsCost),
    Number(checkoutObj.taxCost),
    Number(checkoutObj.discountCost),
    Number(checkoutObj.grandTotal),
    checkoutObj.paymentMethod,
    Number(checkoutObj.amountPaid),
    Number(checkoutObj.changeAmount),
    "Selesai",
    checkoutObj.cashierName,
    checkoutObj.billingType || "Open",
    checkoutObj.packageHours || ""
  ];
  
  tSheet.getRange(foundRow, 1, 1, updatedValues.length).setValues([updatedValues]);
  
  // Reset Meja ke status Kosong
  var mSheet = ss.getSheetByName("Meja");
  var mData = mSheet.getDataRange().getValues();
  for (var j = 1; j < mData.length; j++) {
    if (String(mData[j][1]) === String(checkoutObj.tableNumber)) {
      mSheet.getRange(j + 1, 6, 1, 6).setValues([["Kosong", "", "", "", "", ""]]);
      break;
    }
  }
  
  writeAuditLog(checkoutObj.cashierName, "Checkout Transaksi", "Melunasi Invoice " + checkoutObj.invoiceNumber + " total " + checkoutObj.grandTotal);
  return { status: "success", message: "Transaksi diselesaikan!", data: checkoutObj };
}

function saveOrUpdatePengeluaran(expObj) {
  var sheet = getDb().getSheetByName("Pengeluaran");
  var data = sheet.getDataRange().getValues();
  var foundIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(expObj.id)) {
      foundIndex = i + 1;
      break;
    }
  }
  
  var values = [
    expObj.id,
    expObj.date,
    expObj.category,
    Number(expObj.amount),
    expObj.note
  ];
  
  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 1, 1, values.length).setValues([values]);
    writeAuditLog("System", "Update Pengeluaran", "Mengubah pengeluaran: " + expObj.category + " senilai " + expObj.amount);
  } else {
    sheet.appendRow(values);
    writeAuditLog("System", "Tambah Pengeluaran", "Mencatat pengeluaran baru: " + expObj.category + " senilai " + expObj.amount);
  }
  
  return { status: "success", message: "Data pengeluaran berhasil disimpan!" };
}

function deletePengeluaran(id) {
  var sheet = getDb().getSheetByName("Pengeluaran");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      writeAuditLog("System", "Hapus Pengeluaran", "Menghapus pengeluaran senilai " + data[i][3]);
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Pengeluaran berhasil dihapus." };
    }
  }
  return { status: "error", message: "Data pengeluaran tidak ditemukan." };
}

function saveSettings(settingsObj) {
  var sheet = getDb().getSheetByName("Setting");
  sheet.clearContents();
  sheet.appendRow(["key", "value"]);
  
  for (var key in settingsObj) {
    sheet.appendRow([key, String(settingsObj[key])]);
  }
  
  writeAuditLog("System", "Update Pengaturan", "Mengubah pengaturan nama billiard & tarif pajak");
  return { status: "success", message: "Pengaturan berhasil diperbarui." };
}

function writeAuditLog(user, act, detail) {
  try {
    var sheet = getDb().getSheetByName("AuditLog");
    var id = "L" + Math.floor(Math.random() * 1000000);
    var timestamp = new Date().toISOString();
    sheet.appendRow([id, timestamp, user || "System", act, detail]);
    return { status: "success" };
  } catch(e) {
    return { status: "error", message: e.toString() };
  }
}
