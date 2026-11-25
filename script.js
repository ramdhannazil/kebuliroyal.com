/**
 * ==========================================================================
 * NASI KEBULI ROYAL - INTERACTIVE SCRIPTS
 * Data diambil dari Google Sheets via Google Apps Script Web App
 * ==========================================================================
 */

// --- DEFAULT MENUS (Fallback jika API belum dikonfigurasi) ---
const DEFAULT_MENUS = [
  {
    id: "m-1",
    nama: "Nasi Kebuli Kambing Spesial",
    kategori: "kambing",
    harga: 55000,
    deskripsi: "Kambing empuk, nasi berempah, acar segar, dan sambal khas Royal.",
    porsi: "/ porsi",
    gambar_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
    status: "tersedia",
    tag: "Paling favorit",
    populer: "ya",
  },
  {
    id: "m-2",
    nama: "Nasi Kebuli Ayam Bakar",
    kategori: "ayam",
    harga: 35000,
    deskripsi: "Ayam bakar berbumbu meresap dengan aroma panggang yang menggoda.",
    porsi: "/ porsi",
    gambar_url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500&q=80",
    status: "tersedia",
    tag: "Pilihan nikmat",
    populer: "ya",
  },
  {
    id: "m-3",
    nama: "Paket Loyang Kebuli",
    kategori: "tampah",
    harga: 165000,
    deskripsi: "Nasi kebuli melimpah dengan lauk pilihan. Pas untuk momen bersama.",
    porsi: "/ 4 porsi",
    gambar_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80",
    status: "tersedia",
    tag: "Untuk berbagi",
    populer: "ya",
  },
  {
    id: "m-4",
    nama: "Kambing Jumbo",
    kategori: "kambing",
    harga: 75000,
    deskripsi: "Porsi dobel daging kambing lembut berempah khas Timur Tengah.",
    porsi: "/ porsi besar",
    gambar_url: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=500&q=80",
    status: "tersedia",
    tag: "Ekstra Daging",
    populer: "tidak",
  },
  {
    id: "m-5",
    nama: "Ayam Rempah",
    kategori: "ayam",
    harga: 32000,
    deskripsi: "Ayam bumbu rempah kuning gurih digoreng kering dan renyah.",
    porsi: "/ porsi",
    gambar_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80",
    status: "tersedia",
    tag: "Gurih Mantap",
    populer: "tidak",
  },
  {
    id: "m-6",
    nama: "Tampah Keluarga",
    kategori: "tampah",
    harga: 320000,
    deskripsi: "Nasi kebuli loyang besar dengan lauk ayam dan kambing untuk seluruh keluarga.",
    porsi: "/ 8 porsi",
    gambar_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80",
    status: "tersedia",
    tag: "Pesta Keluarga",
    populer: "tidak",
  },
]

// --- Label mapping untuk kategori bawaan & dinamis ---
const DEFAULT_CATEGORY_LABELS = {
  kambing: "Kambing",
  ayam: "Ayam",
  tampah: "Tampah/Loyang",
}

function getCategories() {
  const catKey = (typeof CONFIG !== "undefined" && CONFIG.CATEGORIES_KEY) || "kebuli_royal_categories"
  const stored = localStorage.getItem(catKey)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch (_) {}
  }
  return [
    { id: "kambing", label: "Kambing" },
    { id: "ayam", label: "Ayam" },
    { id: "tampah", label: "Tampah/Loyang" },
  ]
}

function getCategoryLabel(catId) {
  const categories = getCategories()
  const found = categories.find((c) => c.id === catId || c.id === String(catId).toLowerCase())
  if (found) return found.label
  return DEFAULT_CATEGORY_LABELS[catId] || catId || ""
}

// ============================================================
// ENTRY POINT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // 0. Tampilkan skeleton dulu, lalu fetch data
  renderSkeletons(document.getElementById("popularMenuGrid"), "popular")
  renderSkeletons(document.getElementById("priceMenuGrid"), "price")
  fetchMenusFromSheets()

  // 1. Inisialisasi Tautan Pengantaran (GoFood, GrabFood, ShopeeFood)
  setupDeliveryLinks()

  // 2. Sticky Header & Active Nav on Scroll
  const header = document.querySelector(".site-header")
  const sections = document.querySelectorAll("section[id]")
  const navLinks = document.querySelectorAll(".nav-link")

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }

    // ScrollSpy for Nav Links
    let currentId = ""
    sections.forEach((sec) => {
      const secTop = sec.offsetTop - 120
      const secHeight = sec.offsetHeight
      if (window.scrollY >= secTop && window.scrollY < secTop + secHeight) {
        currentId = sec.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${currentId}`) {
        link.classList.add("active")
      }
    })
  })

  // 2. Mobile Menu Toggle
  const mobileToggle = document.querySelector(".mobile-toggle")
  const navMenu = document.querySelector(".nav-menu")

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open")
      const isOpen = navMenu.classList.contains("open")
      mobileToggle.innerHTML = isOpen
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`
    })

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("open")
        mobileToggle.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`
      })
    })
  }

  // 3. Scroll Reveal Animation (IntersectionObserver)
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
        }
      })
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  )

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el))

  // 4. Daftar Harga Filter Tabs
  bindPriceTabs()

  // 5. Interactive Order Modal & WhatsApp Integration
  setupOrderModal()

  // 6. Toast & Newsletter
  const newsletterForm = document.querySelector(".newsletter-form")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const emailInput = newsletterForm.querySelector("input")
      if (emailInput && emailInput.value.trim()) {
        showToast("Terima kasih! Email Anda telah terdaftar untuk kabar lezat.")
        emailInput.value = ""
      }
    })
  }
})

// ============================================================
// FETCH DATA DARI GOOGLE SHEETS
// ============================================================
async function fetchMenusFromSheets() {
  const popularGrid = document.getElementById("popularMenuGrid")
  const priceGrid = document.getElementById("priceMenuGrid")

  // Jika API belum dikonfigurasi, tampilkan fallback + banner panduan
  if (typeof isApiConfigured === "function" && !isApiConfigured()) {
    console.info("ℹ️ Google Script URL belum dikonfigurasi. Menampilkan data default.")
    showApiBanner(popularGrid)
    renderPopularMenus(DEFAULT_MENUS)
    renderPriceGrid(DEFAULT_MENUS)
    return
  }

  try {
    const baseUrl = typeof getActiveApiUrl === "function" ? getActiveApiUrl() : CONFIG.GOOGLE_SCRIPT_URL
    // Real-time parameter cache-buster agar browser tidak mengambil cache lama
    const url = baseUrl + (baseUrl.includes("?") ? "&" : "?") + "_t=" + Date.now()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), (CONFIG && CONFIG.FETCH_TIMEOUT) || 10000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

    const json = await response.json()

    // Muat Kategori dari Sheets jika tersedia
    if (json && Array.isArray(json.categories) && json.categories.length > 0) {
      localStorage.setItem((typeof CONFIG !== "undefined" && CONFIG.CATEGORIES_KEY) || "kebuli_royal_categories", JSON.stringify(json.categories))
    }

    // Muat Link Pengantaran dari Sheets jika tersedia
    if (json && json.settings) {
      localStorage.setItem((typeof CONFIG !== "undefined" && CONFIG.DELIVERY_KEY) || "kebuli_royal_delivery_links", JSON.stringify(json.settings))
      if (typeof setupDeliveryLinks === "function") {
        setupDeliveryLinks()
      }
    }

    // Mendukung baik format array langsung [ ... ] maupun wrapped { data: [ ... ] } / { result: [ ... ] }
    let rawList = []
    if (Array.isArray(json)) {
      rawList = json
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data
    } else if (json && Array.isArray(json.result)) {
      rawList = json.result
    } else {
      throw new Error("Format data dari Google Sheets tidak dikenali.")
    }

    // Jika database Google Sheets masih kosong (0 baris menu), gunakan default
    if (rawList.length === 0) {
      console.warn("Spreadsheet masih kosong (0 baris). Menggunakan data default.")
      renderPopularMenus(DEFAULT_MENUS)
      renderPriceGrid(DEFAULT_MENUS)
      return
    }

    // Normalisasi struktur data dari kolom Google Sheets ke format internal
    const menus = rawList.map((m, index) => {
      const isHabis =
        String(m.status).toLowerCase() === "habis" ||
        String(m.tersedia).toLowerCase() === "habis" ||
        m.tersedia === false ||
        String(m.tersedia).toLowerCase() === "false" ||
        String(m.tersedia).toLowerCase() === "tidak"

      const rawKat = String(m.kategori || m.category || "kambing").toLowerCase()
      const kategori = rawKat.includes("kambing") ? "kambing" : (rawKat.includes("ayam") ? "ayam" : (rawKat.includes("tampah") || rawKat.includes("loyang") ? "tampah" : rawKat))

      let portion = m.porsi || m.portion || ""
      let notes = m.keterangan || m.notes || m.catatan || ""
      if (!portion && m.subtitle) {
        const parts = m.subtitle.split("•")
        portion = parts[0] ? parts[0].trim() : "1 porsi"
        notes = parts[1] ? parts[1].trim() : ""
      }
      if (!portion) portion = "1 porsi"
      if (!notes && !m.subtitle) notes = "acar segar & sambal khas Royal"

      return {
        id: m.id || ("menu-" + (index + 1)),
        nama: m.nama || m.name || "Menu Nasi Kebuli",
        kategori: kategori,
        harga: Number(m.harga || m.price) || 0,
        deskripsi: m.deskripsi || m.desc || "Hidangan nasi kebuli rempah autentik khas Royal.",
        porsi: portion,
        keterangan: notes,
        subtitle: notes ? `${portion} • ${notes}` : portion,
        gambar_url: m.gambar || m.gambar_url || m.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
        status: isHabis ? "habis" : "tersedia",
        tag: m.tag || (index === 0 ? "Paling favorit" : (index === 1 ? "Pilihan nikmat" : (index === 2 ? "Untuk berbagi" : ""))),
        populer: String(m.populer || "").toLowerCase() === "ya" || m.populer === true || index < 3 ? "ya" : "tidak"
      }
    })

    // Simpan ke cache localStorage dengan timestamp
    const storageKey = (CONFIG && CONFIG.STORAGE_KEY) || "kebuli_royal_menus"
    const timestampKey = (CONFIG && CONFIG.STORAGE_TIMESTAMP_KEY) || "kebuli_royal_menus_time"
    localStorage.setItem(storageKey, JSON.stringify(menus))
    localStorage.setItem(timestampKey, Date.now().toString())

    renderPopularMenus(menus)
    renderPriceGrid(menus)
  } catch (err) {
    console.error("Gagal memuat data dari Google Sheets:", err)

    // Coba ambil dari cache localStorage
    const storageKey = (CONFIG && CONFIG.STORAGE_KEY) || "kebuli_royal_menus"
    const cached = localStorage.getItem(storageKey)

    if (cached) {
      try {
        const menus = JSON.parse(cached)
        if (Array.isArray(menus) && menus.length > 0) {
          console.info("📦 Menggunakan data cache offline.")
          showCacheBanner(document.getElementById("popularMenuGrid"))
          renderPopularMenus(menus)
          renderPriceGrid(menus)
          return
        }
      } catch (_) {}
    }

    // Tidak ada cache, tampilkan error
    renderError(document.getElementById("popularMenuGrid"), fetchMenusFromSheets)
    renderError(document.getElementById("priceMenuGrid"), null)
  }
}

// Ekspos agar tombol retry bisa memanggil ulang
window.retryMenuFetch = fetchMenusFromSheets

// ============================================================
// RENDER: MENU POPULER
// ============================================================
function renderPopularMenus(menus) {
  const container = document.getElementById("popularMenuGrid")
  if (!container) return

  // Filter: yang populer = 'ya', jika tidak ada, ambil 3 pertama yang tersedia
  let popular = menus.filter((m) => String(m.populer).toLowerCase() === "ya")
  if (popular.length === 0) {
    popular = menus.filter((m) => String(m.status).toLowerCase() !== "habis").slice(0, 3)
  }
  // Batasi maksimal 3 kartu
  popular = popular.slice(0, 3)

  if (popular.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 2rem 0; grid-column:1/-1; text-align:center;">Belum ada menu populer tersedia.</p>`
    return
  }

  container.innerHTML = popular
    .map((m, i) => {
      const harga = Number(m.harga) || 0
      const hargaStr = "Rp" + harga.toLocaleString("id-ID")
      const isHabis = String(m.status).toLowerCase() === "habis"
      const namaSafe = (m.nama || "Menu").replace(/'/g, "\\'")
      const imgSafe = (m.gambar_url || "").replace(/'/g, "\\'")
      const delayClass = `delay-${i + 1}`
      const porsiLabel = m.porsi || "/ porsi"

      return `
        <div class="menu-card reveal ${delayClass} visible">
          <div class="menu-card-header">
            <span class="menu-badge">${m.tag || "Favorit"}</span>
            ${isHabis ? `<span class="out-of-stock-pill">Habis</span>` : ""}
          </div>
          <div class="menu-card-visual">
            <div class="menu-plate-wrap">
              <img src="${m.gambar_url || ""}" alt="${m.nama || "Menu"}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80'">
            </div>
          </div>
          <div class="menu-card-body">
            <div class="menu-rating">
              <span class="stars">★★★★★</span>
              <span>5.0</span>
            </div>
            <h3 class="menu-card-title">${m.nama || "-"}</h3>
            <p class="menu-card-desc">${m.deskripsi || "Hidangan nasi kebuli rempah autentik khas Royal."}</p>
            <div class="menu-card-footer">
              <div class="menu-price-box">
                <b>${hargaStr}</b>
                <small>${porsiLabel}</small>
              </div>
              <button
                class="btn-card-order${isHabis ? " btn-disabled" : ""}"
                ${isHabis ? "disabled" : `onclick="openOrderModal('${namaSafe}', '${hargaStr}', ${harga}, '${imgSafe}')"`}
              >
                <span>${isHabis ? "Habis" : "Order"}</span>
                <span>${isHabis ? "✕" : "↗"}</span>
              </button>
            </div>
          </div>
        </div>
      `
    })
    .join("")

  // Trigger reveal observer untuk kartu baru
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible")
      })
    },
    { threshold: 0.1 }
  )
  container.querySelectorAll(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el))
}

// ============================================================
// RENDER: DAFTAR HARGA
// ============================================================
function renderPriceGrid(menus) {
  const container = document.getElementById("priceMenuGrid")
  if (!container) return

  if (!menus || menus.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 2rem 0; grid-column:1/-1; text-align:center;">Belum ada data menu.</p>`
    return
  }

  // Urutkan berdasarkan kategori: kambing → ayam → tampah
  const order = ["kambing", "ayam", "tampah"]
  const sorted = [...menus].sort((a, b) => {
    return order.indexOf(a.kategori) - order.indexOf(b.kategori)
  })

  container.innerHTML = sorted
    .map((m) => {
      const harga = Number(m.harga) || 0
      const hargaStr = "Rp" + harga.toLocaleString("id-ID")
      const isHabis = String(m.status).toLowerCase() === "habis"
      const namaSafe = (m.nama || "Menu").replace(/'/g, "\\'")
      const imgSafe = (m.gambar_url || "").replace(/'/g, "\\'")
      const catLabel = getCategoryLabel(m.kategori)
      const subtitle = m.keterangan ? `${m.porsi || "1 porsi"} • ${m.keterangan}` : (m.subtitle || m.porsi || "1 porsi • acar & sambal")

      return `
        <div class="price-item-card${isHabis ? " habis" : ""}" data-category="${m.kategori || ""}">
          <div class="price-item-left">
            <img src="${m.gambar_url || ""}" alt="${m.nama || "Menu"}" class="price-item-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=160&q=80'">
            <div>
              <span class="price-item-category">${catLabel}</span>
              <h4 class="price-item-title">${m.nama || "-"}</h4>
              <p class="price-item-subtitle">${subtitle}${isHabis ? " • <em style='color:#ef4444'>Habis</em>" : ""}</p>
            </div>
          </div>
          <div class="price-item-right">
            <span class="price-item-amount">${hargaStr}</span>
            <button
              class="btn-pesan-pill${isHabis ? " btn-disabled" : ""}"
              ${isHabis ? "disabled" : `onclick="openOrderModal('${namaSafe}', '${hargaStr}', ${harga}, '${imgSafe}')"`}
            >
              <span>${isHabis ? "Habis" : "Pesan"}</span>
              <span>${isHabis ? "✕" : "↗"}</span>
            </button>
          </div>
        </div>
      `
    })
    .join("")

  // Rebind filter tabs setelah render ulang
  bindPriceTabs()
}

// ============================================================
// RENDER: SKELETON LOADER
// ============================================================
function renderSkeletons(container, type) {
  if (!container) return

  if (type === "popular") {
    container.innerHTML = Array(3)
      .fill(0)
      .map(
        () => `
        <div class="skeleton-card">
          <div class="skeleton-visual skeleton-shimmer"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-shimmer" style="width:40%; height:12px;"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:70%; height:18px; margin-top:8px;"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:90%; height:12px; margin-top:6px;"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:50%; height:12px; margin-top:4px;"></div>
            <div style="display:flex; justify-content:space-between; margin-top:16px;">
              <div class="skeleton-line skeleton-shimmer" style="width:35%; height:22px;"></div>
              <div class="skeleton-line skeleton-shimmer" style="width:28%; height:36px; border-radius:50px;"></div>
            </div>
          </div>
        </div>
      `
      )
      .join("")
  } else if (type === "price") {
    container.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
        <div class="skeleton-price-card skeleton-shimmer" style="display:flex; align-items:center; gap:14px; padding:14px 16px; border-radius:14px; background:#f0ede8; margin-bottom:8px;">
          <div style="width:60px; height:60px; border-radius:10px; background:#ddd8d0; flex-shrink:0;"></div>
          <div style="flex:1;">
            <div class="skeleton-line skeleton-shimmer" style="width:30%; height:11px; background:#ddd8d0;"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:60%; height:15px; background:#ddd8d0; margin-top:6px;"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:45%; height:11px; background:#ddd8d0; margin-top:5px;"></div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
            <div class="skeleton-line skeleton-shimmer" style="width:70px; height:18px; background:#ddd8d0;"></div>
            <div class="skeleton-line skeleton-shimmer" style="width:70px; height:30px; border-radius:50px; background:#ddd8d0;"></div>
          </div>
        </div>
      `
      )
      .join("")
  }
}

// ============================================================
// RENDER: ERROR STATE
// ============================================================
function renderError(container, retryFn) {
  if (!container) return
  container.innerHTML = `
    <div class="menu-error-state" style="grid-column:1/-1; text-align:center; padding:3rem 1rem;">
      <div class="error-icon">🌐</div>
      <h3>Gagal Memuat Menu</h3>
      <p>Koneksi ke database tidak berhasil. Periksa koneksi internet Anda atau konfigurasi API.</p>
      ${
        retryFn
          ? `<button class="btn-retry" onclick="window.retryMenuFetch()">
              <span>↺</span> Coba Lagi
            </button>`
          : ""
      }
    </div>
  `
}

// ============================================================
// BANNER: API belum dikonfigurasi
// ============================================================
function showApiBanner(container) {
  if (!container) return
  const existing = document.getElementById("apiBannerNotice")
  if (existing) return

  const banner = document.createElement("div")
  banner.id = "apiBannerNotice"
  banner.className = "api-guide-banner"
  banner.innerHTML = `
    <strong>⚙ Mode Demo:</strong> Data menu ini bersifat contoh. Hubungkan ke Google Sheets di
    <a href="/hahaadmin" style="color:inherit; font-weight:600; text-decoration:underline;">Admin Panel → Konfigurasi API</a>
    untuk menampilkan menu aktual.
  `
  container.parentElement && container.parentElement.insertBefore(banner, container)
}

// ============================================================
// BANNER: Menggunakan data cache
// ============================================================
function showCacheBanner(container) {
  if (!container) return
  const existing = document.getElementById("cacheBannerNotice")
  if (existing) return

  const banner = document.createElement("div")
  banner.id = "cacheBannerNotice"
  banner.className = "api-guide-banner"
  banner.style.background = "#fefce8"
  banner.style.borderColor = "#fbbf24"
  banner.style.color = "#92400e"
  banner.innerHTML = `
    <strong>📦 Offline Mode:</strong> Menampilkan data terakhir yang tersimpan. Periksa koneksi internet Anda.
  `
  container.parentElement && container.parentElement.insertBefore(banner, container)
}

// ============================================================
// HELPER: Tab Filter Binding
// ============================================================
function bindPriceTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      const filter = btn.getAttribute("data-filter")
      const priceItems = document.querySelectorAll(".price-item-card")

      priceItems.forEach((card) => {
        const category = card.getAttribute("data-category")
        if (filter === "all" || category === filter) {
          card.style.display = "flex"
          setTimeout(() => {
            card.style.opacity = "1"
            card.style.transform = "translateY(0)"
          }, 20)
        } else {
          card.style.opacity = "0"
          card.style.transform = "translateY(10px)"
          setTimeout(() => {
            card.style.display = "none"
          }, 200)
        }
      })
    })
  })
}

// ============================================================
// ORDER MODAL & WHATSAPP
// ============================================================
function setupOrderModal() {
  const modalOverlay = document.getElementById("orderModalOverlay")
  const modalCloseBtn = document.getElementById("modalCloseBtn")
  const modalThumb = document.getElementById("modalItemThumb")
  const modalTitle = document.getElementById("modalItemTitle")
  const modalPrice = document.getElementById("modalItemPrice")
  const modalQtyVal = document.getElementById("modalQtyVal")
  const btnQtyMinus = document.getElementById("btnQtyMinus")
  const btnQtyPlus = document.getElementById("btnQtyPlus")
  const inputCustomerName = document.getElementById("customerName")
  const inputCustomerNotes = document.getElementById("customerNotes")
  const btnConfirmOrder = document.getElementById("btnConfirmOrder")

  let currentItem = {
    name: "",
    price: 0,
    priceStr: "",
    image: "",
    qty: 1,
  }

  // Open modal — exposed globally untuk onclick HTML
  window.openOrderModal = function (name, priceStr, priceNum, image) {
    currentItem.name = name
    currentItem.priceStr = priceStr
    currentItem.price = priceNum
    currentItem.image = image
    currentItem.qty = 1

    if (modalTitle) modalTitle.textContent = name
    if (modalPrice) modalPrice.textContent = priceStr
    if (modalThumb) modalThumb.src = image
    if (modalQtyVal) modalQtyVal.textContent = "1"
    if (inputCustomerNotes) inputCustomerNotes.value = ""

    if (modalOverlay) {
      modalOverlay.classList.add("active")
      document.body.style.overflow = "hidden"
    }
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove("active")
    document.body.style.overflow = ""
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal)

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal()
    })
  }

  if (btnQtyMinus && btnQtyPlus && modalQtyVal) {
    btnQtyMinus.addEventListener("click", () => {
      if (currentItem.qty > 1) {
        currentItem.qty--
        modalQtyVal.textContent = currentItem.qty
      }
    })
    btnQtyPlus.addEventListener("click", () => {
      currentItem.qty++
      modalQtyVal.textContent = currentItem.qty
    })
  }

  if (btnConfirmOrder) {
    btnConfirmOrder.addEventListener("click", (e) => {
      e.preventDefault()
      const custName = inputCustomerName ? inputCustomerName.value.trim() : ""
      const notes = inputCustomerNotes ? inputCustomerNotes.value.trim() : ""
      const totalNum = currentItem.price * currentItem.qty
      const totalFormatted = `Rp${totalNum.toLocaleString("id-ID")}`

      let message = `Halo Nasi Kebuli Royal! 🍛✨\n\nSaya ingin memesan hidangan berikut:\n`
      message += `• *${currentItem.name}*\n`
      message += `  Jumlah: ${currentItem.qty} porsi\n`
      message += `  Estimasi Total: ${totalFormatted}\n`
      if (custName) message += `\nNama Pemesan: ${custName}`
      if (notes) message += `\nCatatan Tambahan: ${notes}`
      message += `\n\nMohon info ketersediaan dan ongkos kirim ya. Terima kasih!`

      const waPhone = (typeof CONFIG !== "undefined" && CONFIG.WHATSAPP_PHONE) || "6287875764847"
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`

      closeModal()
      showToast(`Membuka WhatsApp untuk pesanan: ${currentItem.name}`)
      setTimeout(() => window.open(waUrl, "_blank"), 300)
    })
  }
}

// ============================================================
// DELIVERY PLATFORM LINKS (GoFood, GrabFood, ShopeeFood)
// ============================================================
function setupDeliveryLinks() {
  let delivery = {
    gofood: "https://gofood.co.id/jakarta/restaurant/kebuli-royal-tanah-abang-8e022711-7249-4662-888b-c4fdcd131d35",
    grabfood: "",
    shopeefood: "",
  }

  const stored = localStorage.getItem((typeof CONFIG !== "undefined" && CONFIG.DELIVERY_KEY) || "kebuli_royal_delivery_links")
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      delivery = { ...delivery, ...parsed }
    } catch (_) {}
  } else if (typeof CONFIG !== "undefined" && CONFIG.DEFAULT_DELIVERY) {
    delivery = { ...delivery, ...CONFIG.DEFAULT_DELIVERY }
  }

  const cardGofood = document.getElementById("cardDeliveryGofood")
  const cardGrab = document.getElementById("cardDeliveryGrabfood")
  const cardShopee = document.getElementById("cardDeliveryShopeefood")

  if (cardGofood && delivery.gofood) {
    cardGofood.href = delivery.gofood
  }

  if (cardGrab) {
    if (delivery.grabfood && delivery.grabfood.trim() !== "" && delivery.grabfood.trim() !== "#") {
      cardGrab.href = delivery.grabfood.trim()
      cardGrab.onclick = null
    } else {
      cardGrab.href = "javascript:void(0)"
      cardGrab.onclick = (e) => {
        e.preventDefault()
        showToast("Tautan GrabFood sedang disiapkan. Silakan pesan via WhatsApp atau GoFood!")
      }
    }
  }

  if (cardShopee) {
    if (delivery.shopeefood && delivery.shopeefood.trim() !== "" && delivery.shopeefood.trim() !== "#") {
      cardShopee.href = delivery.shopeefood.trim()
      cardShopee.onclick = null
    } else {
      cardShopee.href = "javascript:void(0)"
      cardShopee.onclick = (e) => {
        e.preventDefault()
        showToast("Tautan ShopeeFood sedang disiapkan. Silakan pesan via WhatsApp atau GoFood!")
      }
    }
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(msg) {
  const toast = document.getElementById("toastNotice")
  const toastText = document.getElementById("toastText")
  if (!toast || !toastText) return
  toastText.textContent = msg
  toast.classList.add("show")
  setTimeout(() => toast.classList.remove("show"), 3800)
}

window.showToast = showToast
