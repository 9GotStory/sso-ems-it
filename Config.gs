// ============================================================
// Config.gs — ค่าคงที่และการตั้งค่าระบบทั้งหมด
// ============================================================

const CONFIG = {
  // ---- Admin Emails ----
  ADMIN_EMAILS: [
    "mister.gotx@gmail.com",
    // เพิ่ม email admin เพิ่มเติมได้ที่นี่
  ],

  // ---- Google Sheets ID ----
  // วิธีหา: เปิด Google Sheet แล้วดู URL
  // https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  SPREADSHEET_ID: "1F2Ipf_vCkiCwJSqS8PeTyqUFD8pt2rDXlaizAbf2XhU",

  // ---- Sheet Names ----
  SHEET_NAMES: {
    ASSETS:       "Assets",
    ROLES:        "Asset_Roles",
    RISK:         "Risk_Assessment",
    ACCESS:       "Access_Rights",
    PLANS:        "Management_Plans",
    ADMIN_CONFIG: "Admin_Config",
    AUDIT_LOG:    "Audit_Log",
  },

  // ---- Asset Type Prefix สำหรับ UUID ----
  ASSET_TYPE_PREFIX: {
    "PC":         "PC",
    "Notebook":   "NB",
    "MikroTik":   "MT",
    "Switch Hub": "SW",
    "Router":     "RT",
    "Mesh WiFi":  "MW",
    "Other":      "AS",
  },

  // ---- Default Risk Levels (ถ้า Admin_Config Sheet ยังไม่มีข้อมูล) ----
  DEFAULT_RISK_LEVELS: [
    { id: "low",      label: "ต่ำ",      color: "#22c55e", textColor: "#fff", order: 1 },
    { id: "medium",   label: "ปานกลาง", color: "#eab308", textColor: "#fff", order: 2 },
    { id: "high",     label: "สูง",      color: "#f97316", textColor: "#fff", order: 3 },
    { id: "critical", label: "วิกฤต",   color: "#ef4444", textColor: "#fff", order: 4 },
  ],

  // ---- Asset Status Options ----
  ASSET_STATUS: ["ใช้งาน", "ซ่อม", "เลิกใช้", "สำรอง"],

  // ---- Windows Access Level ----
  ACCESS_LEVELS: ["Administrator", "Standard User", "Guest"],

  // ---- Pagination ----
  PAGE_SIZE: 20,

  // ---- Version ----
  VERSION: "1.0.0",
};