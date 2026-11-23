/**
 * ==========================================================================
 * GOOGLE APPS SCRIPT - NASI KEBULI ROYAL REAL-TIME DATABASE
 * ==========================================================================
 * 
 * SPREADSHEET TARGET:
 *   ID: 1Ap_G1H9RD0HJXtgWeY5KC8S85DIJFUNxXl2kLIsw5ag
 *   URL: https://docs.google.com/spreadsheets/d/1Ap_G1H9RD0HJXtgWeY5KC8S85DIJFUNxXl2kLIsw5ag/edit
 * 
 * PANDUAN PEMASANGAN / UPDATE (PENTING AGAR FITUR UBAH REAL-TIME BERFUNGSI):
 * 1. Buka Google Spreadsheet di atas.
 * 2. Klik menu "Extensions" (Ekstensi) > "Apps Script".
 * 3. Hapus seluruh kode lama di editor, lalu TEMPEL SEMUA KODE DI FILE INI.
 * 4. Klik ikon Disket / Save (Simpan).
 * 5. Klik tombol "Deploy" (Terapkan) di kanan atas:
 *    - Pilih "Manage deployments" (Kelola penerapan).
 *    - Klik ikon Pensil (Edit) pada penerapan yang aktif.
 *    - Pada bagian "Version", pilih "New version" (Versi baru).
 *    - Klik "Deploy".
 *    (ATAU klik "New deployment" > Web App > Execute as: Me > Who has access: Anyone).
 */

const SPREADSHEET_ID = "1Ap_G1H9RD0HJXtgWeY5KC8S85DIJFUNxXl2kLIsw5ag";

function getTargetSheet() {
  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  return ss.getActiveSheet();
}

/**
 * GET: Mengambil seluruh menu real-time dari Google Sheets
 * Juga mendukung aksi via GET (sebagai cadangan)
 */
function doGet(e) {
  try {
    // Jika ada parameter aksi via GET (misal testing atau fallback)
    if (e && e.parameter && e.parameter.action === "ping") {
      return responseJSON({ success: true, message: "PONG! Nasi Kebuli Royal API is active" });
    }

    const sheet = getTargetSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return responseJSON({
        success: true,
        message: "Spreadsheet kosong atau hanya berisi header",
        total: 0,
        data: []
      });
    }

    // Ambil header baris 1 (lowercase & trim)
    const rawHeaders = values[0];
    const headers = rawHeaders.map(function(h) {
      return String(h).trim().toLowerCase().replace(/\s+/g, "_");
    });

    const rows = values.slice(1);
    const menuList = [];

    rows.forEach(function(row, index) {
      const item = {};
      let hasData = false;

      headers.forEach(function(header, colIdx) {
        let val = row[colIdx];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          hasData = true;
        }
        item[header] = val;
      });

      if (hasData && (item.nama || item.name)) {
        // Normalisasi field agar seragam untuk frontend
        const id = item.id || ("menu-" + (index + 1));
        const nama = item.nama || item.name || "";
        const harga = Number(item.harga || item.price) || 0;
        const kategori = String(item.kategori || item.category || "kambing").toLowerCase();
        const deskripsi = item.deskripsi || item.desc || "";
        const gambar = item.gambar || item.gambar_url || item.image || "";
        const porsi = item.porsi || item.subtitle || "1 porsi • acar & sambal";
        const tag = item.tag || (index === 0 ? "Paling favorit" : (index === 1 ? "Pilihan nikmat" : ""));
        const populer = String(item.populer || (index < 3 ? "ya" : "tidak")).toLowerCase();

        // Cek status ketersediaan (mendukung format 'tersedia' / 'habis' / boolean)
        let status = "tersedia";
        if (item.status) {
          status = String(item.status).toLowerCase();
        } else if (item.tersedia !== undefined && item.tersedia !== null && item.tersedia !== "") {
          const tVal = String(item.tersedia).toLowerCase();
          if (tVal === "false" || tVal === "tidak" || tVal === "habis") {
            status = "habis";
          } else {
            status = "tersedia";
          }
        }

        menuList.push({
          id: id,
          nama: nama,
          harga: harga,
          kategori: kategori,
          deskripsi: deskripsi,
          gambar_url: gambar,
          gambar: gambar,
          porsi: porsi,
          status: status,
          tersedia: status === "tersedia",
          tag: tag,
          populer: populer
        });
      }
    });

    return responseJSON({
      success: true,
      total: menuList.length,
      updated_at: new Date().toISOString(),
      data: menuList
    });

  } catch (error) {
    return responseJSON({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * POST: Mengubah menu, harga, foto, status, atau sinkronisasi total dari Admin secara REAL-TIME
 */
function doPost(e) {
  try {
    const contents = e.postData ? e.postData.contents : null;
    if (!contents) {
      return responseJSON({ success: false, message: "No data payload received" });
    }

    let payload;
    try {
      payload = JSON.parse(contents);
    } catch (parseErr) {
      return responseJSON({ success: false, message: "Invalid JSON format: " + parseErr.toString() });
    }

    const sheet = getTargetSheet();
    let values = sheet.getDataRange().getValues();

    // Kolom ideal untuk database Nasi Kebuli Royal
    const STANDARD_HEADERS = [
      "id", "nama", "harga", "kategori", "deskripsi", "gambar", "tersedia", "porsi", "tag", "populer"
    ];

    // Jika spreadsheet benar-benar kosong, buatkan header baris 1
    if (values.length === 0 || values[0].length === 0 || !values[0][0]) {
      sheet.appendRow(STANDARD_HEADERS);
      values = [STANDARD_HEADERS];
    }

    // Baca header yang sudah ada
    let headers = values[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/\s+/g, "_");
    });

    // Pastikan kolom-kolom penting ada di header
    STANDARD_HEADERS.forEach(function(stdHeader) {
      if (headers.indexOf(stdHeader) === -1 && headers.indexOf(stdHeader === "gambar" ? "gambar_url" : (stdHeader === "tersedia" ? "status" : "")) === -1) {
        // Tambahkan kolom baru di sebelah kanan
        const nextCol = headers.length + 1;
        sheet.getRange(1, nextCol).setValue(stdHeader);
        headers.push(stdHeader);
      }
    });

    // Helper untuk mengambil nilai item yang cocok dengan header sheet
    function getValForHeader(item, header) {
      if (header === "id") return item.id || "";
      if (header === "nama" || header === "name") return item.nama || item.name || "";
      if (header === "harga" || header === "price") return Number(item.harga || item.price) || 0;
      if (header === "kategori" || header === "category") return item.kategori || item.category || "kambing";
      if (header === "deskripsi" || header === "desc") return item.deskripsi || item.desc || "";
      if (header === "gambar" || header === "gambar_url" || header === "image") return item.gambar || item.gambar_url || item.image || "";
      if (header === "tersedia" || header === "status") {
        if (item.tersedia !== undefined) return item.tersedia;
        return (item.status === "habis") ? false : true;
      }
      if (header === "porsi" || header === "subtitle") return item.porsi || item.subtitle || "1 porsi";
      if (header === "tag") return item.tag || "";
      if (header === "populer") return item.populer || (item.isPopular ? "ya" : "tidak");
      return item[header] !== undefined ? item[header] : "";
    }

    // ==========================================================
    // AKSI 1: Sinkronisasi Total (syncAll) dari Admin Panel
    // ==========================================================
    if (payload.action === "syncAll" && Array.isArray(payload.data)) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      if (payload.data.length > 0) {
        const rowsToInsert = payload.data.map(function(menuItem) {
          return headers.map(function(header) {
            return getValForHeader(menuItem, header);
          });
        });
        sheet.getRange(2, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
      }

      return responseJSON({
        success: true,
        message: "Data menu (" + payload.data.length + " item) berhasil disinkronkan ke Google Sheets secara real-time!",
        total: payload.data.length
      });
    }

    // ==========================================================
    // AKSI 2: Tambah 1 Menu Baru (add)
    // ==========================================================
    if (payload.action === "add" && payload.menu) {
      const newRow = headers.map(function(header) {
        return getValForHeader(payload.menu, header);
      });
      sheet.appendRow(newRow);
      return responseJSON({ success: true, message: "Menu baru berhasil ditambahkan ke Spreadsheet" });
    }

    // ==========================================================
    // AKSI 3: Update Menu / Ubah Harga / Ubah Foto (update)
    // ==========================================================
    if (payload.action === "update" && payload.id && payload.menu) {
      const idColIdx = headers.indexOf("id");
      if (idColIdx === -1) {
        return responseJSON({ success: false, message: "Kolom ID tidak ditemukan di sheet" });
      }

      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColIdx]) === String(payload.id)) {
          headers.forEach(function(header, colIdx) {
            const val = getValForHeader(payload.menu, header);
            if (val !== undefined && val !== "") {
              sheet.getRange(i + 1, colIdx + 1).setValue(val);
            }
          });
          return responseJSON({ success: true, message: "Menu ID " + payload.id + " berhasil diperbarui di Spreadsheet" });
        }
      }
      return responseJSON({ success: false, message: "ID menu tidak ditemukan: " + payload.id });
    }

    // ==========================================================
    // AKSI 4: Hapus Menu (delete)
    // ==========================================================
    if (payload.action === "delete" && payload.id) {
      const idColIdx = headers.indexOf("id");
      if (idColIdx !== -1) {
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][idColIdx]) === String(payload.id)) {
            sheet.deleteRow(i + 1);
            return responseJSON({ success: true, message: "Menu ID " + payload.id + " berhasil dihapus dari Spreadsheet" });
          }
        }
      }
      return responseJSON({ success: false, message: "ID menu tidak ditemukan untuk dihapus" });
    }

    return responseJSON({ success: false, message: "Aksi tidak dikenali: " + payload.action });

  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

/**
 * Output helper dengan MIME type JSON (CORS-friendly)
 */
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
