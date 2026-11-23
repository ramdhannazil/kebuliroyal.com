/**
 * ==========================================================================
 * NASI KEBULI ROYAL - CONFIGURATION
 * Google Sheets & Google Apps Script Web App Settings
 * ==========================================================================
 */

const CONFIG = {
  // URL Deployment Google Apps Script Web App resmi:
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxSGw8N1Tda3OlNRjMHOfdrQJDjg9xqmPMyoqmO2i8P_vyJwRxTgZzPJc4j3Ibb70ZJtg/exec",

  // Nama kunci penyimpanan lokal (untuk cache & offline fallback)
  STORAGE_KEY: "kebuli_royal_menus",
  STORAGE_TIMESTAMP_KEY: "kebuli_royal_menus_time",
  CONFIG_URL_KEY: "kebuli_google_script_url",

  // Nomor WhatsApp Resmi Pemesanan
  WHATSAPP_PHONE: "6281234567890",

  // Timeout fetch dalam milidetik (10 detik)
  FETCH_TIMEOUT: 10000,
}

/**
 * Mendapatkan URL API aktif (mengutamakan URL yang disimpan di browser via Admin jika ada)
 */
function getActiveApiUrl() {
  const customUrl = localStorage.getItem(CONFIG.CONFIG_URL_KEY)
  if (customUrl && customUrl.trim().startsWith("http")) {
    return customUrl.trim()
  }
  return CONFIG.GOOGLE_SCRIPT_URL
}

/**
 * Memeriksa apakah URL API sudah dikonfigurasi dan bukan placeholder
 */
function isApiConfigured() {
  const url = getActiveApiUrl()
  return (
    url &&
    url.trim().startsWith("https://script.google.com") &&
    !url.includes("[MASUKKAN_URL_WEB_APP_APPS_SCRIPT_ANDA]")
  )
}
