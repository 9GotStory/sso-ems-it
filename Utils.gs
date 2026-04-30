// ============================================================
// Utils.gs — ฟังก์ชันช่วยเหลือทั่วไป
// ============================================================

// ---- UUID & Asset ID ----------------------------------------

/**
 * สร้าง UUID v4 โดยใช้ GAS built-in
 * @returns {string} UUID เช่น "110e8400-e29b-41d4-a716-446655440000"
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * สร้าง Asset ID ในรูปแบบ PREFIX-xxxxxxxx
 * @param {string} assetType - ประเภทอุปกรณ์
 * @returns {string} เช่น "PC-a3f2b1c4"
 */
function generateAssetId(assetType) {
  const prefix = CONFIG.ASSET_TYPE_PREFIX[assetType] || "AS";
  const shortUuid = Utilities.getUuid().replace(/-/g, "").substring(0, 8).toLowerCase();
  return `${prefix}-${shortUuid}`;
}

// ---- Date & Time -------------------------------------------

/**
 * คืนค่าวันเวลาปัจจุบันในรูปแบบ ISO string (Asia/Bangkok)
 * @returns {string}
 */
function nowISO() {
  return Utilities.formatDate(
    new Date(),
    "Asia/Bangkok",
    "yyyy-MM-dd'T'HH:mm:ss"
  );
}

/**
 * Format Date object เป็น dd/MM/yyyy
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateTH(date) {
  if (!date) return "";
  const d = (date instanceof Date) ? date : new Date(date);
  return Utilities.formatDate(d, "Asia/Bangkok", "dd/MM/yyyy");
}

// ---- Response Helpers --------------------------------------

/**
 * สร้าง response สำเร็จ
 * @param {*} data
 * @param {string} [message]
 * @returns {Object}
 */
function successResponse(data, message = "สำเร็จ") {
  return { success: true, message, data };
}

/**
 * สร้าง response ผิดพลาด
 * @param {string} message
 * @param {number} [code]
 * @returns {Object}
 */
function errorResponse(message, code = 400) {
  return { success: false, message, code, data: null };
}

/**
 * Serialize response เป็น JSON สำหรับ ContentService
 * @param {Object} obj
 * @returns {TextOutput}
 */
function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Validation --------------------------------------------

/**
 * ตรวจสอบว่า string ไม่ว่าง
 * @param {*} value
 * @returns {boolean}
 */
function isNonEmpty(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/**
 * Sanitize string — ตัด whitespace หัวท้าย
 * @param {*} value
 * @returns {string}
 */
function sanitize(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * แปลง array of arrays (raw sheet data) เป็น array of objects
 * โดยใช้แถวแรกเป็น header
 * @param {Array[]} rawData - SpreadsheetApp.getValues()
 * @returns {Object[]}
 */
function rowsToObjects(rawData) {
  if (!rawData || rawData.length < 2) return [];
  const headers = rawData[0].map(h => sanitize(h));
  return rawData.slice(1).map((row, index) => {
    const obj = { _rowIndex: index + 2 }; // +2 เพราะ index จาก 0 + header row
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : "";
    });
    return obj;
  });
}

/**
 * แปลง object กลับเป็น array ตาม header order
 * @param {Object} obj
 * @param {string[]} headers
 * @returns {Array}
 */
function objectToRow(obj, headers) {
  return headers.map(h => obj[h] !== undefined ? obj[h] : "");
}

/**
 * Parse JSON string อย่างปลอดภัย
 * @param {string} str
 * @param {*} fallback
 * @returns {*}
 */
function safeParseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// ---- Logging -----------------------------------------------

/**
 * บันทึก error log ใน Apps Script Logger
 * @param {string} context
 * @param {Error|string} error
 */
function logError(context, error) {
  const msg = error instanceof Error ? error.message : String(error);
  Logger.log(`[ERROR] ${context}: ${msg}`);
}