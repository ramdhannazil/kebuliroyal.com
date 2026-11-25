/**
 * ==========================================================================
 * NASI KEBULI ROYAL - CONFIGURATION
 * Google Sheets & App Settings (Edit langsung di file ini)
 * ==========================================================================
 */

const CONFIG = {
  // URL Deployment Google Apps Script Web App resmi:
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxSGw8N1Tda3OlNRjMHOfdrQJDjg9xqmPMyoqmO2i8P_vyJwRxTgZzPJc4j3Ibb70ZJtg/exec",

  // Nomor WhatsApp Resmi Pemesanan (087875764847)
  WHATSAPP_PHONE: "6287875764847",

  // Alamat Resmi Outlet
  OUTLET_ADDRESS: "Jl. K.H. Mas Mansyur No.40 B, RT.1/RW.7, Kb. Kacang, Kecamatan Tanah Abang, Jakarta, Daerah Khusus Ibukota Jakarta 10230",
  MAPS_LINK: "https://www.google.com/maps/search/?api=1&query=Jl.+K.H.+Mas+Mansyur+No.40+B,+RT.1/RW.7,+Kb.+Kacang,+Kecamatan+Tanah+Abang,+Jakarta+10230",

  // Link Pemesanan Online Default
  DEFAULT_DELIVERY: {
    gofood: "https://gofood.co.id/jakarta/restaurant/kebuli-royal-tanah-abang-8e022711-7249-4662-888b-c4fdcd131d35",
    grabfood: "",
    shopeefood: "",
  },

  // Kunci Penyimpanan Browser
  STORAGE_KEY: "kebuli_royal_menus",
  STORAGE_TIMESTAMP_KEY: "kebuli_royal_menus_time",
  CATEGORIES_KEY: "kebuli_royal_categories",
  DELIVERY_KEY: "kebuli_royal_delivery_links",

  // Timeout fetch dalam milidetik (10 detik)
  FETCH_TIMEOUT: 10000,
}

/**
 * Mendapatkan URL API Google Apps Script
 */
function getActiveApiUrl() {
  return CONFIG.GOOGLE_SCRIPT_URL
}

/**
 * Memeriksa apakah URL API sudah dikonfigurasi
 */
function isApiConfigured() {
  const url = getActiveApiUrl()
  return Boolean(
    url &&
    url.trim().startsWith("https://script.google.com") &&
    !url.includes("[MASUKKAN_URL_WEB_APP_APPS_SCRIPT_ANDA]")
  )
}
