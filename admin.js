/**
 * ==========================================================================
 * NASI KEBULI ROYAL - ADMIN PANEL JAVASCRIPT
 * Ubah Foto, Ubah Harga, dan Tambah Menu Baru
 * ==========================================================================
 */

const STORAGE_KEY = "kebuli_royal_menus"

// Preset photo options from high-resolution Middle Eastern & Kebuli culinary gallery
const PRESET_PHOTOS = [
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
]

const DEFAULT_MENUS = [
  {
    id: "m-1",
    name: "Nasi Kebuli Kambing Spesial",
    category: "kambing",
    catLabel: "Kambing",
    subtitle: "1 porsi • acar & sambal",
    price: 55000,
    priceFormatted: "Rp55.000",
    portion: "/ porsi",
    tag: "Paling favorit",
    isPopular: true,
    desc: "Kambing empuk, nasi berempah, acar segar, dan sambal khas Royal.",
    image: PRESET_PHOTOS[0],
  },
  {
    id: "m-2",
    name: "Nasi Kebuli Ayam Bakar",
    category: "ayam",
    catLabel: "Ayam",
    subtitle: "1 porsi • acar & sambal",
    price: 35000,
    priceFormatted: "Rp35.000",
    portion: "/ porsi",
    tag: "Pilihan nikmat",
    isPopular: true,
    desc: "Ayam bakar berbumbu meresap dengan aroma panggang yang menggoda.",
    image: PRESET_PHOTOS[1],
  },
  {
    id: "m-3",
    name: "Paket Loyang Kebuli",
    category: "tampah",
    catLabel: "Tampah/Loyang",
    subtitle: "4 porsi • lauk ayam pilihan",
    price: 165000,
    priceFormatted: "Rp165.000",
    portion: "/ 4 porsi",
    tag: "Untuk berbagi",
    isPopular: true,
    desc: "Nasi kebuli melimpah dengan lauk pilihan. Pas untuk momen bersama.",
    image: PRESET_PHOTOS[2],
  },
  {
    id: "m-4",
    name: "Kambing Jumbo",
    category: "kambing",
    catLabel: "Kambing",
    subtitle: "1 porsi besar • ekstra daging",
    price: 75000,
    priceFormatted: "Rp75.000",
    portion: "/ porsi besar",
    tag: "Ekstra Daging",
    isPopular: false,
    desc: "Porsi dobel daging kambing lembut berempah khas Timur Tengah.",
    image: PRESET_PHOTOS[3],
  },
  {
    id: "m-5",
    name: "Ayam Rempah",
    category: "ayam",
    catLabel: "Ayam",
    subtitle: "1 porsi • ayam bumbu gurih",
    price: 32000,
    priceFormatted: "Rp32.000",
    portion: "/ porsi",
    tag: "Gurih Mantap",
    isPopular: false,
    desc: "Ayam bumbu rempah kuning gurih digoreng kering dan renyah.",
    image: PRESET_PHOTOS[4],
  },
  {
    id: "m-6",
    name: "Tampah Keluarga",
    category: "tampah",
    catLabel: "Tampah/Loyang",
    subtitle: "8 porsi • ayam & kambing",
    price: 320000,
    priceFormatted: "Rp320.000",
    portion: "/ 8 porsi",
    tag: "Pesta Keluarga",
    isPopular: false,
    desc: "Kombinasi komplit ayam bakar & kambing untuk 8 porsi perayaan.",
    image: PRESET_PHOTOS[5],
  },
]

// --- State ---
let menus = []
let activeFilter = "all"
let searchQuery = ""
let editingMenuId = null
let photoTargetMenuId = null

// --- Format Helper ---
function formatRupiah(num) {
  return "Rp" + Number(num).toLocaleString("id-ID")
}

// --- LocalStorage & Real-Time Google Sheets Operations ---
async function loadMenus() {
  // Jika API dikonfigurasi, coba fetch dari Sheets terlebih dahulu secara Real-Time
  if (typeof isApiConfigured === "function" && isApiConfigured()) {
    try {
      const baseUrl = typeof getActiveApiUrl === "function" ? getActiveApiUrl() : ""
      const url = baseUrl + (baseUrl.includes("?") ? "&" : "?") + "_t=" + Date.now()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (response.ok) {
        const json = await response.json()
        let rawList = []
        if (Array.isArray(json)) {
          rawList = json
        } else if (json && Array.isArray(json.data)) {
          rawList = json.data
        } else if (json && Array.isArray(json.result)) {
          rawList = json.result
        }

        if (rawList.length > 0) {
          // Konversi kolom Sheets → format admin internal
          menus = rawList.map((m, index) => {
            const rawKat = String(m.kategori || m.category || "kambing").toLowerCase()
            const category = rawKat.includes("kambing") ? "kambing" : (rawKat.includes("ayam") ? "ayam" : (rawKat.includes("tampah") || rawKat.includes("loyang") ? "tampah" : rawKat))

            const isHabis =
              String(m.status).toLowerCase() === "habis" ||
              String(m.tersedia).toLowerCase() === "habis" ||
              m.tersedia === false ||
              String(m.tersedia).toLowerCase() === "false" ||
              String(m.tersedia).toLowerCase() === "tidak"

            return {
              id: m.id || ("menu-" + (index + 1)),
              name: m.nama || m.name || "Menu",
              category: category,
              catLabel: { kambing: "Kambing", ayam: "Ayam", tampah: "Tampah/Loyang" }[category] || category,
              price: Number(m.harga || m.price) || 0,
              priceFormatted: "Rp" + (Number(m.harga || m.price) || 0).toLocaleString("id-ID"),
              subtitle: m.porsi || m.subtitle || "1 porsi • acar & sambal",
              tag: m.tag || "",
              desc: m.deskripsi || m.desc || "",
              image: m.gambar || m.gambar_url || m.image || PRESET_PHOTOS[0],
              isPopular: String(m.populer || "").toLowerCase() === "ya" || m.populer === true || index < 3,
              status: isHabis ? "habis" : "tersedia",
            }
          })
          localStorage.setItem(STORAGE_KEY, JSON.stringify(menus))
          renderAll()
          showToast("✓ Data menu berhasil dimuat dari Google Sheets (Real-Time).")
          return
        } else {
          showToast("ℹ️ Spreadsheet terhubung namun belum ada baris data menu.")
        }
      }
    } catch (err) {
      console.warn("Gagal fetch real-time dari Sheets saat admin load:", err)
    }
  }

  // Fallback: LocalStorage atau DEFAULT_MENUS
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      menus = JSON.parse(stored)
    } catch (e) {
      menus = [...DEFAULT_MENUS]
    }
  } else {
    menus = [...DEFAULT_MENUS]
    saveMenus()
  }
}

function saveMenus() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(menus))
  renderAll()
  // Push ke Google Sheets secara Real-Time
  pushMenusToSheets()
}

// --- Push ke Google Sheets secara Real-Time ---
async function pushMenusToSheets() {
  if (typeof isApiConfigured !== "function" || !isApiConfigured()) {
    showToast("💾 Disimpan di browser lokal (Google Sheets belum aktif).")
    return
  }
  const url = typeof getActiveApiUrl === "function" ? getActiveApiUrl() : ""
  if (!url) return

  showToast("🔄 Menyinkronkan perubahan ke Google Sheets...")

  try {
    // Format payload sesuai kolom spreadsheet: id, nama, harga, kategori, deskripsi, gambar, tersedia, porsi, tag, populer
    const payload = menus.map((m) => ({
      id: m.id,
      nama: m.name,
      harga: m.price,
      kategori: m.category,
      deskripsi: m.desc || "",
      gambar: m.image || "",
      gambar_url: m.image || "",
      tersedia: m.status !== "habis",
      status: m.status || "tersedia",
      porsi: m.subtitle || "1 porsi",
      tag: m.tag || "",
      populer: m.isPopular ? "ya" : "tidak",
    }))

    // Menggunakan text/plain agar tidak memicu CORS preflight OPTIONS yang ditolak Google Apps Script
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "syncAll", data: payload }),
    })

    if (response.ok) {
      showToast("✓ Berhasil disimpan ke Google Sheets secara Real-Time!")
    } else {
      showToast("⚠️ Respon Sheets: " + response.status + ". Pastikan Code.gs sudah diperbarui.")
    }
  } catch (err) {
    console.warn("Gagal push ke Sheets:", err)
    showToast("⚠️ Gagal terhubung ke Google Sheets. Perubahan tetap tersimpan lokal.")
  }
}

// --- Sinkronisasi Manual Semua Menu ke Google Sheets ---
window.syncInitialMenusToSheets = async function () {
  if (confirm("Unggah seluruh daftar menu saat ini (" + menus.length + " item) ke Google Sheets?")) {
    await pushMenusToSheets()
  }
}

// --- Simpan & Muat URL Konfigurasi API ---
window.saveApiUrl = function () {
  const input = document.getElementById("apiUrlInput")
  if (!input) return
  const url = input.value.trim()
  if (url && url.startsWith("https://script.google.com")) {
    localStorage.setItem("kebuli_google_script_url", url)
    updateApiStatus()
    showToast("✓ URL Google Script berhasil disimpan!")
    loadMenus()
  } else if (url === "") {
    localStorage.removeItem("kebuli_google_script_url")
    updateApiStatus()
    showToast("URL API telah dihapus. Menggunakan data default.")
  } else {
    alert("URL tidak valid. Pastikan diawali dengan: https://script.google.com")
  }
}

function updateApiStatus() {
  const statusEl = document.getElementById("apiStatusText")
  const inputEl = document.getElementById("apiUrlInput")
  if (!statusEl) return

  const configured = typeof isApiConfigured === "function" && isApiConfigured()
  const url = typeof getActiveApiUrl === "function" ? getActiveApiUrl() : ""

  if (configured) {
    statusEl.innerHTML = `<span style="color:#16a34a; font-weight:600;">✓ Terhubung</span> — <span style="font-size:0.78rem; color:#6b7280; word-break:break-all;">${url}</span>`
    if (inputEl) inputEl.value = url
  } else {
    statusEl.innerHTML = `<span style="color:#ef4444; font-weight:600;">✗ Belum dikonfigurasi</span> — Masukkan URL Google Apps Script di bawah.`
  }
}

// --- Toast Notice ---
function showToast(message) {
  const toast = document.getElementById("adminToast")
  const toastText = document.getElementById("toastMsgText")
  if (!toast || !toastText) return
  toastText.textContent = message
  toast.classList.add("show")
  setTimeout(() => {
    toast.classList.remove("show")
  }, 3200)
}

// --- Render Statistics ---
function renderStats() {
  const statTotal = document.getElementById("statTotal")
  const statKambing = document.getElementById("statKambing")
  const statAyam = document.getElementById("statAyam")
  const statTampah = document.getElementById("statTampah")
  const badgeCount = document.getElementById("sidebarMenuCount")

  if (statTotal) statTotal.textContent = menus.length
  if (badgeCount) badgeCount.textContent = menus.length

  const kambingCount = menus.filter((m) => m.category === "kambing").length
  const ayamCount = menus.filter((m) => m.category === "ayam").length
  const tampahCount = menus.filter((m) => m.category === "tampah").length

  if (statKambing) statKambing.textContent = kambingCount
  if (statAyam) statAyam.textContent = ayamCount
  if (statTampah) statTampah.textContent = tampahCount
}

// --- Render Menu Table ---
function renderMenuTable() {
  const tbody = document.getElementById("menuTableBody")
  if (!tbody) return

  let filtered = menus.filter((m) => {
    const matchCategory = activeFilter === "all" || m.category === activeFilter
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subtitle && m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCategory && matchSearch
  })

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #8e887a;">
          Tidak ada menu yang sesuai dengan pencarian atau filter kategori.
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = filtered
    .map((item) => {
      const catClass =
        item.category === "kambing"
          ? "cat-kambing"
          : item.category === "ayam"
          ? "cat-ayam"
          : "cat-tampah"

      return `
      <tr data-id="${item.id}">
        <!-- Foto -->
        <td style="width: 80px;">
          <div class="table-photo-box" onclick="openPhotoModal('${item.id}')" title="Klik untuk ubah foto">
            <img src="${item.image}" alt="${item.name}">
            <div class="photo-overlay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Ubah</span>
            </div>
          </div>
        </td>

        <!-- Nama & Deskripsi Menu -->
        <td>
          <div class="menu-item-details">
            <b>${item.name}</b>
            <small>${item.subtitle || "1 porsi"}</small>
          </div>
        </td>

        <!-- Kategori -->
        <td>
          <span class="cat-badge ${catClass}">${item.catLabel || item.category}</span>
        </td>

        <!-- Harga (Quick Edit) -->
        <td>
          <div class="price-display-wrap">
            <b>${item.priceFormatted || formatRupiah(item.price)}</b>
            <button class="btn-quick-price" onclick="promptQuickPrice('${item.id}')" title="Ubah Harga Cepat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
          </div>
        </td>

        <!-- Aksi -->
        <td>
          <div class="action-btn-group">
            <button class="action-btn" onclick="openPhotoModal('${item.id}')" title="Ganti Foto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              </svg>
              Foto
            </button>
            <button class="action-btn" onclick="openEditMenuModal('${item.id}')" title="Edit Lengkap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button class="action-btn btn-delete" onclick="deleteMenu('${item.id}')" title="Hapus Menu">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Hapus
            </button>
          </div>
        </td>
      </tr>
      `
    })
    .join("")
}

function renderAll() {
  renderStats()
  renderMenuTable()
}

// --- Quick Price Prompt ---
window.promptQuickPrice = function (id) {
  const item = menus.find((m) => m.id === id)
  if (!item) return
  const currentNum = item.price || 0
  const input = prompt(`Masukkan harga baru untuk "${item.name}":\n(Hanya angka, contoh: 65000)`, currentNum)
  if (input !== null) {
    const cleanNum = parseInt(input.replace(/[^0-9]/g, ""), 10)
    if (!isNaN(cleanNum) && cleanNum > 0) {
      item.price = cleanNum
      item.priceFormatted = formatRupiah(cleanNum)
      saveMenus()
      showToast(`Harga "${item.name}" berhasil diubah menjadi ${item.priceFormatted}!`)
    } else {
      alert("Harga tidak valid. Harap masukkan angka yang benar.")
    }
  }
}

// --- Delete Menu ---
window.deleteMenu = function (id) {
  const item = menus.find((m) => m.id === id)
  if (!item) return
  if (confirm(`Yakin ingin menghapus menu "${item.name}"?`)) {
    menus = menus.filter((m) => m.id !== id)
    saveMenus()
    showToast(`Menu "${item.name}" berhasil dihapus.`)
  }
}

// --- Helper: Kompres Foto Unggahan agar Muat di Google Sheets ---
function compressImage(file, maxWidth, maxHeight, quality, callback) {
  const reader = new FileReader()
  reader.onload = function (e) {
    const img = new Image()
    img.onload = function () {
      const canvas = document.createElement("canvas")
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL("image/jpeg", quality)
      callback(dataUrl)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// --- Photo Modal Controls ---
const photoModal = document.getElementById("photoModal")
const photoModalClose = document.getElementById("photoModalClose")
const photoTargetName = document.getElementById("photoTargetName")
const currentPhotoPreview = document.getElementById("currentPhotoPreview")
const inputPhotoUrl = document.getElementById("inputPhotoUrl")
const inputPhotoFile = document.getElementById("inputPhotoFile")
const presetPhotosContainer = document.getElementById("presetPhotosContainer")
const btnSavePhoto = document.getElementById("btnSavePhoto")

let selectedPhotoUrl = ""

window.openPhotoModal = function (id) {
  const item = menus.find((m) => m.id === id)
  if (!item) return
  photoTargetMenuId = id
  selectedPhotoUrl = item.image

  if (photoTargetName) photoTargetName.textContent = item.name
  if (currentPhotoPreview) currentPhotoPreview.src = item.image
  if (inputPhotoUrl) inputPhotoUrl.value = item.image.startsWith("data:") ? "" : item.image
  if (inputPhotoFile) inputPhotoFile.value = ""

  // Render presets
  if (presetPhotosContainer) {
    presetPhotosContainer.innerHTML = PRESET_PHOTOS.map(
      (url) => `
      <img 
        src="${url}" 
        class="preset-thumb ${url === selectedPhotoUrl ? "selected" : ""}" 
        onclick="selectPresetPhoto('${url}')"
      >
    `
    ).join("")
  }

  photoModal.classList.add("active")
}

window.selectPresetPhoto = function (url) {
  selectedPhotoUrl = url
  if (currentPhotoPreview) currentPhotoPreview.src = url
  if (inputPhotoUrl) inputPhotoUrl.value = url
  const thumbs = document.querySelectorAll(".preset-thumb")
  thumbs.forEach((t) => t.classList.toggle("selected", t.src === url))
}

if (inputPhotoUrl) {
  inputPhotoUrl.addEventListener("input", (e) => {
    const val = e.target.value.trim()
    if (val) {
      selectedPhotoUrl = val
      if (currentPhotoPreview) currentPhotoPreview.src = val
    }
  })
}

if (inputPhotoFile) {
  inputPhotoFile.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      showToast("Mengompres & memproses foto...")
      compressImage(file, 450, 450, 0.72, (compressedDataUrl) => {
        selectedPhotoUrl = compressedDataUrl
        if (currentPhotoPreview) currentPhotoPreview.src = selectedPhotoUrl
        showToast("✓ Foto siap diterapkan!")
      })
    }
  })
}

if (photoModalClose) {
  photoModalClose.addEventListener("click", () => photoModal.classList.remove("active"))
}

if (btnSavePhoto) {
  btnSavePhoto.addEventListener("click", () => {
    if (!photoTargetMenuId || !selectedPhotoUrl) return
    const item = menus.find((m) => m.id === photoTargetMenuId)
    if (item) {
      item.image = selectedPhotoUrl
      saveMenus()
      showToast(`Foto untuk "${item.name}" berhasil diperbarui!`)
    }
    photoModal.classList.remove("active")
  })
}

// --- Add / Edit Menu Modal ---
const menuModal = document.getElementById("menuModal")
const menuModalClose = document.getElementById("menuModalClose")
const menuModalTitle = document.getElementById("menuModalTitle")
const menuForm = document.getElementById("menuForm")
const inputMenuName = document.getElementById("menuName")
const selectMenuCategory = document.getElementById("menuCategory")
const inputMenuPrice = document.getElementById("menuPrice")
const inputMenuSubtitle = document.getElementById("menuSubtitle")
const inputMenuTag = document.getElementById("menuTag")
const inputMenuDesc = document.getElementById("menuDesc")
const formPhotoPreview = document.getElementById("formPhotoPreview")
const formPhotoUrl = document.getElementById("formPhotoUrl")
const formPhotoFile = document.getElementById("formPhotoFile")

let formActivePhoto = PRESET_PHOTOS[0]

window.openAddMenuModal = function () {
  editingMenuId = null
  if (menuModalTitle) menuModalTitle.textContent = "Tambah Menu Baru"
  if (menuForm) menuForm.reset()
  formActivePhoto = PRESET_PHOTOS[Math.floor(Math.random() * PRESET_PHOTOS.length)]
  if (formPhotoPreview) formPhotoPreview.src = formActivePhoto
  if (formPhotoUrl) formPhotoUrl.value = formActivePhoto
  menuModal.classList.add("active")
}

window.openEditMenuModal = function (id) {
  const item = menus.find((m) => m.id === id)
  if (!item) return
  editingMenuId = id
  if (menuModalTitle) menuModalTitle.textContent = "Edit Menu"

  if (inputMenuName) inputMenuName.value = item.name
  if (selectMenuCategory) selectMenuCategory.value = item.category
  if (inputMenuPrice) inputMenuPrice.value = item.price
  if (inputMenuSubtitle) inputMenuSubtitle.value = item.subtitle || ""
  if (inputMenuTag) inputMenuTag.value = item.tag || ""
  if (inputMenuDesc) inputMenuDesc.value = item.desc || ""

  formActivePhoto = item.image
  if (formPhotoPreview) formPhotoPreview.src = item.image
  if (formPhotoUrl) formPhotoUrl.value = item.image.startsWith("data:") ? "" : item.image

  menuModal.classList.add("active")
}

if (formPhotoUrl) {
  formPhotoUrl.addEventListener("input", (e) => {
    const val = e.target.value.trim()
    if (val) {
      formActivePhoto = val
      if (formPhotoPreview) formPhotoPreview.src = val
    }
  })
}

if (formPhotoFile) {
  formPhotoFile.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      showToast("Mengompres & memproses foto...")
      compressImage(file, 450, 450, 0.72, (compressedDataUrl) => {
        formActivePhoto = compressedDataUrl
        if (formPhotoPreview) formPhotoPreview.src = formActivePhoto
        showToast("✓ Foto siap disimpan!")
      })
    }
  })
}

if (menuModalClose) {
  menuModalClose.addEventListener("click", () => menuModal.classList.remove("active"))
}

if (menuForm) {
  menuForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const name = inputMenuName.value.trim()
    const category = selectMenuCategory.value
    const priceNum = parseInt(inputMenuPrice.value.replace(/[^0-9]/g, ""), 10)
    const subtitle = inputMenuSubtitle.value.trim() || "1 porsi"
    const tag = inputMenuTag.value.trim() || ""
    const desc = inputMenuDesc.value.trim() || ""

    if (!name || isNaN(priceNum) || priceNum <= 0) {
      alert("Harap isi nama menu dan harga dengan benar.")
      return
    }

    const catLabelMap = {
      kambing: "Kambing",
      ayam: "Ayam",
      tampah: "Tampah/Loyang",
    }

    if (editingMenuId) {
      // Update
      const item = menus.find((m) => m.id === editingMenuId)
      if (item) {
        item.name = name
        item.category = category
        item.catLabel = catLabelMap[category] || category
        item.price = priceNum
        item.priceFormatted = formatRupiah(priceNum)
        item.subtitle = subtitle
        item.tag = tag
        item.desc = desc
        item.image = formActivePhoto
        showToast(`Menu "${name}" berhasil diperbarui!`)
      }
    } else {
      // Insert new
      const newMenu = {
        id: "m-" + Date.now(),
        name,
        category,
        catLabel: catLabelMap[category] || category,
        price: priceNum,
        priceFormatted: formatRupiah(priceNum),
        subtitle,
        tag: tag || "Baru",
        portion: subtitle.includes("porsi") ? subtitle.split("•")[0].trim() : "/ porsi",
        desc: desc || "Hidangan nasi kebuli rempah autentik khas Royal.",
        image: formActivePhoto,
        isPopular: false,
      }
      menus.unshift(newMenu)
      showToast(`Menu baru "${name}" berhasil ditambahkan!`)
    }

    saveMenus()
    menuModal.classList.remove("active")
  })
}

// --- Reset to Default Menus ---
window.resetToDefaultMenus = function () {
  if (confirm("Apakah Anda yakin ingin mengembalikan daftar menu ke bawaan awal?")) {
    menus = JSON.parse(JSON.stringify(DEFAULT_MENUS))
    saveMenus()
    showToast("Daftar menu telah direset ke setelan awal.")
  }
}

// --- Init Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  // Update status API konfigurasi
  updateApiStatus()

  loadMenus().then(() => renderAll())

  // Tabs Filter
  const tabs = document.querySelectorAll(".admin-tab-btn")
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
      activeFilter = tab.getAttribute("data-filter")
      renderMenuTable()
    })
  })

  // Search Box
  const searchInput = document.getElementById("adminSearchInput")
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim()
      renderMenuTable()
    })
  }

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById("mobileSidebarToggle")
  const sidebar = document.querySelector(".admin-sidebar")
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("show")
    })
  }
})

