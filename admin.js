/**
 * ==========================================================================
 * NASI KEBULI ROYAL - ADMIN PANEL JAVASCRIPT
 * Kelola Menu, Kategori, Foto Upload, Harga, dan Link Ojek Online
 * ==========================================================================
 */

const STORAGE_KEY = (typeof CONFIG !== "undefined" && CONFIG.STORAGE_KEY) || "kebuli_royal_menus"
const CATEGORIES_KEY = (typeof CONFIG !== "undefined" && CONFIG.CATEGORIES_KEY) || "kebuli_royal_categories"
const DELIVERY_KEY = (typeof CONFIG !== "undefined" && CONFIG.DELIVERY_KEY) || "kebuli_royal_delivery_links"

// Kategori Bawaan
const DEFAULT_CATEGORIES = [
  { id: "kambing", label: "Kambing" },
  { id: "ayam", label: "Ayam" },
  { id: "tampah", label: "Tampah / Loyang" },
]

// Preset photo fallback
const DEFAULT_PLACEHOLDER_PHOTO = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"

const DEFAULT_MENUS = [
  {
    id: "m-1",
    name: "Nasi Kebuli Kambing Spesial",
    category: "kambing",
    catLabel: "Kambing",
    portion: "1 porsi",
    notes: "acar segar & sambal khas Royal",
    subtitle: "1 porsi • acar segar & sambal khas Royal",
    price: 55000,
    priceFormatted: "Rp55.000",
    tag: "Paling favorit",
    isPopular: true,
    desc: "Kambing empuk, nasi berempah, acar segar, dan sambal khas Royal.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "m-2",
    name: "Nasi Kebuli Ayam Bakar",
    category: "ayam",
    catLabel: "Ayam",
    portion: "1 porsi",
    notes: "acar segar & sambal khas Royal",
    subtitle: "1 porsi • acar segar & sambal khas Royal",
    price: 35000,
    priceFormatted: "Rp35.000",
    tag: "Pilihan nikmat",
    isPopular: true,
    desc: "Ayam bakar berbumbu meresap dengan aroma panggang yang menggoda.",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "m-3",
    name: "Paket Loyang Kebuli",
    category: "tampah",
    catLabel: "Tampah / Loyang",
    portion: "4 porsi",
    notes: "lauk ayam pilihan & komplit",
    subtitle: "4 porsi • lauk ayam pilihan & komplit",
    price: 165000,
    priceFormatted: "Rp165.000",
    tag: "Untuk berbagi",
    isPopular: true,
    desc: "Nasi kebuli melimpah dengan lauk pilihan. Pas untuk momen bersama.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "m-4",
    name: "Kambing Jumbo",
    category: "kambing",
    catLabel: "Kambing",
    portion: "1 porsi besar",
    notes: "ekstra daging kambing lembut",
    subtitle: "1 porsi besar • ekstra daging kambing lembut",
    price: 75000,
    priceFormatted: "Rp75.000",
    tag: "Ekstra Daging",
    isPopular: false,
    desc: "Porsi dobel daging kambing lembut berempah khas Timur Tengah.",
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "m-5",
    name: "Ayam Rempah",
    category: "ayam",
    catLabel: "Ayam",
    portion: "1 porsi",
    notes: "ayam bumbu gurih kuning renyah",
    subtitle: "1 porsi • ayam bumbu gurih kuning renyah",
    price: 32000,
    priceFormatted: "Rp32.000",
    tag: "Gurih Mantap",
    isPopular: false,
    desc: "Ayam bumbu rempah kuning gurih digoreng kering dan renyah.",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "m-6",
    name: "Tampah Keluarga",
    category: "tampah",
    catLabel: "Tampah / Loyang",
    portion: "8 porsi",
    notes: "kombinasi ayam & kambing",
    subtitle: "8 porsi • kombinasi ayam & kambing",
    price: 320000,
    priceFormatted: "Rp320.000",
    tag: "Pesta Keluarga",
    isPopular: false,
    desc: "Kombinasi komplit ayam bakar & kambing untuk 8 porsi perayaan.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
  },
]

// --- State ---
let menus = []
let categories = []
let activeFilter = "all"
let searchQuery = ""
let editingMenuId = null
let photoTargetMenuId = null
let selectedPhotoUrl = ""
let formActivePhoto = DEFAULT_PLACEHOLDER_PHOTO

// --- Format Helper ---
function formatRupiah(num) {
  return "Rp" + Number(num).toLocaleString("id-ID")
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

// ============================================================
// 1. MANAJEMEN KATEGORI (EDIT & HAPUS KATEGORI)
// ============================================================
function loadCategories() {
  const stored = localStorage.getItem(CATEGORIES_KEY)
  if (stored) {
    try {
      categories = JSON.parse(stored)
      if (!Array.isArray(categories) || categories.length === 0) {
        categories = [...DEFAULT_CATEGORIES]
      }
    } catch (_) {
      categories = [...DEFAULT_CATEGORIES]
    }
  } else {
    categories = [...DEFAULT_CATEGORIES]
    saveCategories()
  }
}

function saveCategories() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  renderCategoryTabs()
  populateCategorySelect()
  renderCategoryList()
}

function getCategoryLabel(catId) {
  const found = categories.find((c) => c.id === catId)
  return found ? found.label : catId
}

function renderCategoryTabs() {
  const tabsContainer = document.getElementById("adminCategoryTabs")
  if (!tabsContainer) return

  let html = `<button class="admin-tab-btn ${activeFilter === "all" ? "active" : ""}" data-filter="all">Semua Menu</button>`
  categories.forEach((cat) => {
    html += `<button class="admin-tab-btn ${activeFilter === cat.id ? "active" : ""}" data-filter="${cat.id}">${cat.label}</button>`
  })
  tabsContainer.innerHTML = html

  // Rebind click listener
  tabsContainer.querySelectorAll(".admin-tab-btn").forEach((tab) => {
    tab.addEventListener("click", () => {
      tabsContainer.querySelectorAll(".admin-tab-btn").forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
      activeFilter = tab.getAttribute("data-filter")
      renderMenuTable()
    })
  })
}

function populateCategorySelect() {
  const select = document.getElementById("menuCategory")
  if (!select) return
  select.innerHTML = categories
    .map((cat) => `<option value="${cat.id}">${cat.label}</option>`)
    .join("")
}

function renderCategoryList() {
  const container = document.getElementById("categoryListContainer")
  if (!container) return

  if (categories.length === 0) {
    container.innerHTML = `<p style="color: #9e988c; font-size: 0.85rem;">Belum ada kategori. Silakan tambahkan di bawah.</p>`
    return
  }

  container.innerHTML = categories
    .map((cat) => {
      const count = menus.filter((m) => m.category === cat.id).length
      return `
        <div class="category-item-row">
          <div>
            <b style="font-size: 0.9rem; color: #1a1208;">${cat.label}</b>
            <small style="color: #9e988c; margin-left: 6px;">(${count} menu)</small>
          </div>
          <div class="category-item-actions">
            <button type="button" class="action-btn" onclick="editCategory('${cat.id}')" title="Ubah Nama Kategori">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Ubah
            </button>
            <button type="button" class="action-btn btn-delete" onclick="deleteCategory('${cat.id}')" title="Hapus Kategori">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Hapus
            </button>
          </div>
        </div>
      `
    })
    .join("")
}

window.addNewCategory = function () {
  const input = document.getElementById("newCategoryName")
  if (!input) return
  const label = input.value.trim()
  if (!label) {
    alert("Harap masukkan nama kategori.")
    return
  }
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kat-" + Date.now()
  if (categories.some((c) => c.id === id)) {
    alert("Kategori ini sudah ada.")
    return
  }

  categories.push({ id, label })
  saveCategories()
  input.value = ""
  showToast(`✓ Kategori "${label}" berhasil ditambahkan!`)
}

window.editCategory = function (catId) {
  const cat = categories.find((c) => c.id === catId)
  if (!cat) return
  const newName = prompt(`Ubah nama kategori "${cat.label}":`, cat.label)
  if (newName !== null && newName.trim()) {
    cat.label = newName.trim()
    saveCategories()
    renderMenuTable()
    showToast(`✓ Kategori diperbarui menjadi "${cat.label}"`)
  }
}

window.deleteCategory = function (catId) {
  const cat = categories.find((c) => c.id === catId)
  if (!cat) return
  const count = menus.filter((m) => m.category === catId).length
  if (count > 0) {
    if (!confirm(`Ada ${count} menu dalam kategori "${cat.label}". Menu tersebut akan dialihkan ke kategori default jika dihapus. Tetap hapus?`)) {
      return
    }
    menus.forEach((m) => {
      if (m.category === catId) {
        m.category = "kambing"
        m.catLabel = getCategoryLabel("kambing")
      }
    })
    saveMenus()
  } else {
    if (!confirm(`Hapus kategori "${cat.label}"?`)) return
  }

  categories = categories.filter((c) => c.id !== catId)
  if (activeFilter === catId) activeFilter = "all"
  saveCategories()
  renderMenuTable()
  showToast(`✓ Kategori "${cat.label}" berhasil dihapus.`)
}

const categoryModal = document.getElementById("categoryModal")
const categoryModalClose = document.getElementById("categoryModalClose")

window.openCategoryModal = function () {
  renderCategoryList()
  if (categoryModal) categoryModal.classList.add("active")
}

if (categoryModalClose && categoryModal) {
  categoryModalClose.addEventListener("click", () => categoryModal.classList.remove("active"))
}

// ============================================================
// 2. MANAJEMEN LINK SHOPEEFOOD & GRABFOOD
// ============================================================
const deliveryModal = document.getElementById("deliveryModal")
const deliveryModalClose = document.getElementById("deliveryModalClose")
const inputLinkGofood = document.getElementById("inputLinkGofood")
const inputLinkGrabfood = document.getElementById("inputLinkGrabfood")
const inputLinkShopeefood = document.getElementById("inputLinkShopeefood")

function loadDeliveryLinks() {
  const stored = localStorage.getItem(DELIVERY_KEY)
  const defaultLinks = (typeof CONFIG !== "undefined" && CONFIG.DEFAULT_DELIVERY) || {
    gofood: "https://gofood.co.id/jakarta/restaurant/kebuli-royal-tanah-abang-8e022711-7249-4662-888b-c4fdcd131d35",
    grabfood: "",
    shopeefood: "",
  }

  if (stored) {
    try {
      return { ...defaultLinks, ...JSON.parse(stored) }
    } catch (_) {
      return defaultLinks
    }
  }
  return defaultLinks
}

window.openDeliveryModal = function () {
  const links = loadDeliveryLinks()
  if (inputLinkGofood) inputLinkGofood.value = links.gofood || ""
  if (inputLinkGrabfood) inputLinkGrabfood.value = links.grabfood || ""
  if (inputLinkShopeefood) inputLinkShopeefood.value = links.shopeefood || ""
  if (deliveryModal) deliveryModal.classList.add("active")
}

if (deliveryModalClose && deliveryModal) {
  deliveryModalClose.addEventListener("click", () => deliveryModal.classList.remove("active"))
}

window.saveDeliveryLinks = function (e) {
  if (e) e.preventDefault()
  const links = {
    gofood: inputLinkGofood ? inputLinkGofood.value.trim() : "",
    grabfood: inputLinkGrabfood ? inputLinkGrabfood.value.trim() : "",
    shopeefood: inputLinkShopeefood ? inputLinkShopeefood.value.trim() : "",
  }
  localStorage.setItem(DELIVERY_KEY, JSON.stringify(links))
  if (deliveryModal) deliveryModal.classList.remove("active")
  showToast("✓ Link ShopeeFood, GrabFood, dan GoFood berhasil disimpan!")
}

// ============================================================
// 3. OPERASI DATA MENU & GOOGLE SHEETS
// ============================================================
async function loadMenus() {
  if (typeof isApiConfigured === "function" && isApiConfigured()) {
    try {
      const baseUrl = typeof getActiveApiUrl === "function" ? getActiveApiUrl() : CONFIG.GOOGLE_SCRIPT_URL
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
          menus = rawList.map((m, index) => {
            const rawKat = String(m.kategori || m.category || "kambing").toLowerCase()
            const category = rawKat.includes("kambing") ? "kambing" : (rawKat.includes("ayam") ? "ayam" : (rawKat.includes("tampah") || rawKat.includes("loyang") ? "tampah" : rawKat))

            const isHabis =
              String(m.status).toLowerCase() === "habis" ||
              String(m.tersedia).toLowerCase() === "habis" ||
              m.tersedia === false ||
              String(m.tersedia).toLowerCase() === "false" ||
              String(m.tersedia).toLowerCase() === "tidak"

            // Porsi dan Keterangan dipisah
            let portion = m.porsi || ""
            let notes = m.keterangan || m.catatan || ""
            if (!portion && m.subtitle) {
              const parts = m.subtitle.split("•")
              portion = parts[0] ? parts[0].trim() : "1 porsi"
              notes = parts[1] ? parts[1].trim() : ""
            }
            if (!portion) portion = "1 porsi"
            if (!notes && !m.subtitle) notes = "acar segar & sambal khas Royal"

            return {
              id: m.id || ("menu-" + (index + 1)),
              name: m.nama || m.name || "Menu",
              category: category,
              catLabel: getCategoryLabel(category),
              price: Number(m.harga || m.price) || 0,
              priceFormatted: "Rp" + (Number(m.harga || m.price) || 0).toLocaleString("id-ID"),
              portion: portion,
              notes: notes,
              subtitle: notes ? `${portion} • ${notes}` : portion,
              tag: m.tag || "",
              desc: m.deskripsi || m.desc || "",
              image: m.gambar || m.gambar_url || m.image || DEFAULT_PLACEHOLDER_PHOTO,
              isPopular: String(m.populer || "").toLowerCase() === "ya" || m.populer === true || index < 3,
              status: isHabis ? "habis" : "tersedia",
            }
          })
          localStorage.setItem(STORAGE_KEY, JSON.stringify(menus))
          renderAll()
          showToast("✓ Data menu berhasil dimuat dari Google Sheets.")
          return
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
  pushMenusToSheets()
}

// --- Push ke Google Sheets secara Real-Time ---
async function pushMenusToSheets() {
  const url = (typeof CONFIG !== "undefined" && CONFIG.GOOGLE_SCRIPT_URL) || ""
  if (!url || !url.startsWith("https://script.google.com")) return

  showToast("🔄 Menyimpan perubahan ke Google Sheets...")

  try {
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
      porsi: m.portion || "1 porsi",
      keterangan: m.notes || "",
      tag: m.tag || "",
      populer: m.isPopular ? "ya" : "tidak",
    }))

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "syncAll", data: payload }),
    })

    if (response.ok) {
      showToast("✓ Berhasil disimpan ke Google Sheets secara Real-Time!")
    } else {
      showToast("⚠️ Catatan: Pastikan Code.gs sudah dideploy versi baru.")
    }
  } catch (err) {
    console.warn("Gagal push ke Sheets:", err)
    showToast("✓ Perubahan tersimpan di browser. (Koneksi ke Sheets dijadwalkan ulang)")
  }
}

// ============================================================
// 4. TOAST, STATS & TABEL MENU
// ============================================================
function showToast(message) {
  const toast = document.getElementById("adminToast")
  const toastText = document.getElementById("toastMsgText")
  if (!toast || !toastText) return
  toastText.textContent = message
  toast.classList.add("show")
  setTimeout(() => toast.classList.remove("show"), 3200)
}

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

function renderMenuTable() {
  const tbody = document.getElementById("menuTableBody")
  if (!tbody) return

  let filtered = menus.filter((m) => {
    const matchCategory = activeFilter === "all" || m.category === activeFilter
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subtitle && m.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.portion && m.portion.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCategory && matchSearch
  })

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #8e887a;">
          Tidak ada menu yang sesuai dengan filter atau pencarian.
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = filtered
    .map((item) => {
      const catLabel = getCategoryLabel(item.category)
      const portionText = item.portion || "1 porsi"
      const notesText = item.notes || (item.subtitle && item.subtitle.includes("•") ? item.subtitle.split("•")[1].trim() : "")

      return `
      <tr data-id="${item.id}">
        <!-- Foto -->
        <td style="width: 80px;">
          <div class="table-photo-box" onclick="openPhotoModal('${item.id}')" title="Klik untuk upload foto baru">
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

        <!-- Nama, Porsi, & Keterangan -->
        <td>
          <div class="menu-item-details">
            <b>${item.name}</b>
            <div style="font-size: 0.8rem; margin-top: 3px;">
              <span style="color: #ea8a10; font-weight: 700; background: #fdf5ea; padding: 2px 7px; border-radius: 6px; font-size: 0.75rem;">${portionText}</span>
              ${notesText ? `<span style="color: #8c8577; margin-left: 6px;">${notesText}</span>` : ""}
            </div>
          </div>
        </td>

        <!-- Kategori -->
        <td>
          <span class="cat-badge" style="background:#f3f0ea; color:#4a4233;">${catLabel}</span>
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
            <button class="action-btn" onclick="openPhotoModal('${item.id}')" title="Upload Foto Baru">
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
  renderCategoryTabs()
  populateCategorySelect()
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
      showToast(`✓ Harga "${item.name}" berhasil diubah menjadi ${item.priceFormatted}!`)
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
    showToast(`✓ Menu "${item.name}" berhasil dihapus.`)
  }
}

// ============================================================
// 5. MODAL FOTO (HANYA UPLOAD DARI FILE)
// ============================================================
const photoModal = document.getElementById("photoModal")
const photoModalClose = document.getElementById("photoModalClose")
const photoTargetName = document.getElementById("photoTargetName")
const currentPhotoPreview = document.getElementById("currentPhotoPreview")
const inputPhotoFile = document.getElementById("inputPhotoFile")
const btnSavePhoto = document.getElementById("btnSavePhoto")

window.openPhotoModal = function (id) {
  const item = menus.find((m) => m.id === id)
  if (!item) return
  photoTargetMenuId = id
  selectedPhotoUrl = item.image

  if (photoTargetName) photoTargetName.textContent = item.name
  if (currentPhotoPreview) currentPhotoPreview.src = item.image
  if (inputPhotoFile) inputPhotoFile.value = ""

  if (photoModal) photoModal.classList.add("active")
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

if (photoModalClose && photoModal) {
  photoModalClose.addEventListener("click", () => photoModal.classList.remove("active"))
}

if (btnSavePhoto) {
  btnSavePhoto.addEventListener("click", () => {
    if (!photoTargetMenuId || !selectedPhotoUrl) return
    const item = menus.find((m) => m.id === photoTargetMenuId)
    if (item) {
      item.image = selectedPhotoUrl
      saveMenus()
      showToast(`✓ Foto untuk "${item.name}" berhasil diperbarui!`)
    }
    if (photoModal) photoModal.classList.remove("active")
  })
}

// ============================================================
// 6. MODAL TAMBAH & EDIT MENU (PORSI & KETERANGAN DIPISAH)
// ============================================================
const menuModal = document.getElementById("menuModal")
const menuModalClose = document.getElementById("menuModalClose")
const menuModalTitle = document.getElementById("menuModalTitle")
const menuForm = document.getElementById("menuForm")
const inputMenuName = document.getElementById("menuName")
const selectMenuCategory = document.getElementById("menuCategory")
const inputMenuPrice = document.getElementById("menuPrice")
const inputMenuPortion = document.getElementById("menuPortion")
const inputMenuNotes = document.getElementById("menuNotes")
const inputMenuTag = document.getElementById("menuTag")
const inputMenuDesc = document.getElementById("menuDesc")
const formPhotoPreview = document.getElementById("formPhotoPreview")
const formPhotoFile = document.getElementById("formPhotoFile")

window.openAddMenuModal = function () {
  editingMenuId = null
  if (menuModalTitle) menuModalTitle.textContent = "Tambah Menu Baru"
  if (menuForm) menuForm.reset()
  populateCategorySelect()

  if (inputMenuPortion) inputMenuPortion.value = "1 porsi"
  if (inputMenuNotes) inputMenuNotes.value = "acar segar & sambal khas Royal"

  formActivePhoto = DEFAULT_PLACEHOLDER_PHOTO
  if (formPhotoPreview) formPhotoPreview.src = formActivePhoto
  if (formPhotoFile) formPhotoFile.value = ""

  if (menuModal) menuModal.classList.add("active")
}

window.openEditMenuModal = function (id) {
  const item = menus.find((m) => m.id === id)
  if (!item) return
  editingMenuId = id
  if (menuModalTitle) menuModalTitle.textContent = "Edit Menu"
  populateCategorySelect()

  if (inputMenuName) inputMenuName.value = item.name
  if (selectMenuCategory) selectMenuCategory.value = item.category
  if (inputMenuPrice) inputMenuPrice.value = item.price
  if (inputMenuPortion) inputMenuPortion.value = item.portion || "1 porsi"
  if (inputMenuNotes) inputMenuNotes.value = item.notes || ""
  if (inputMenuTag) inputMenuTag.value = item.tag || ""
  if (inputMenuDesc) inputMenuDesc.value = item.desc || ""

  formActivePhoto = item.image
  if (formPhotoPreview) formPhotoPreview.src = item.image
  if (formPhotoFile) formPhotoFile.value = ""

  if (menuModal) menuModal.classList.add("active")
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

if (menuModalClose && menuModal) {
  menuModalClose.addEventListener("click", () => menuModal.classList.remove("active"))
}

if (menuForm) {
  menuForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const name = inputMenuName.value.trim()
    const category = selectMenuCategory.value
    const priceNum = parseInt(inputMenuPrice.value.replace(/[^0-9]/g, ""), 10)
    const portion = (inputMenuPortion && inputMenuPortion.value.trim()) || "1 porsi"
    const notes = (inputMenuNotes && inputMenuNotes.value.trim()) || ""
    const tag = inputMenuTag ? inputMenuTag.value.trim() : ""
    const desc = inputMenuDesc ? inputMenuDesc.value.trim() : ""
    const subtitle = notes ? `${portion} • ${notes}` : portion

    if (!name || isNaN(priceNum) || priceNum <= 0) {
      alert("Harap isi nama menu dan harga dengan benar.")
      return
    }

    if (editingMenuId) {
      // Update
      const item = menus.find((m) => m.id === editingMenuId)
      if (item) {
        item.name = name
        item.category = category
        item.catLabel = getCategoryLabel(category)
        item.price = priceNum
        item.priceFormatted = formatRupiah(priceNum)
        item.portion = portion
        item.notes = notes
        item.subtitle = subtitle
        item.tag = tag
        item.desc = desc
        item.image = formActivePhoto
        showToast(`✓ Menu "${name}" berhasil diperbarui!`)
      }
    } else {
      // Tambah baru
      const newMenu = {
        id: "m-" + Date.now(),
        name,
        category,
        catLabel: getCategoryLabel(category),
        price: priceNum,
        priceFormatted: formatRupiah(priceNum),
        portion,
        notes,
        subtitle,
        tag: tag || "Baru",
        desc: desc || "Hidangan nasi kebuli rempah autentik khas Royal.",
        image: formActivePhoto,
        isPopular: false,
        status: "tersedia",
      }
      menus.unshift(newMenu)
      showToast(`✓ Menu baru "${name}" berhasil ditambahkan!`)
    }

    saveMenus()
    if (menuModal) menuModal.classList.remove("active")
  })
}

// --- Reset to Default Menus ---
window.resetToDefaultMenus = function () {
  if (confirm("Apakah Anda yakin ingin mengembalikan daftar menu ke bawaan awal?")) {
    menus = JSON.parse(JSON.stringify(DEFAULT_MENUS))
    saveMenus()
    showToast("✓ Daftar menu telah direset ke setelan awal.")
  }
}

// ============================================================
// 7. INISIALISASI
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadCategories()
  loadMenus().then(() => renderAll())

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
