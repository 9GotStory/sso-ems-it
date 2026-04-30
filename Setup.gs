// ============================================================
// Setup.gs — สร้าง Google Sheets Structure อัตโนมัติ
// รันครั้งเดียวตอนเริ่มต้นโปรเจกต์
// วิธีใช้: เปิด GAS Editor → เลือกฟังก์ชัน setupAllSheets → กด Run
// ============================================================

/**
 * Main setup function — รันครั้งเดียวเพื่อสร้างโครงสร้างทั้งหมด
 */
function setupAllSheets() {
  Logger.log("=== เริ่ม Setup IT Asset Registry ===");

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  setupAssetsSheet(ss);
  setupRolesSheet(ss);
  setupRiskSheet(ss);
  setupAccessSheet(ss);
  setupPlansSheet(ss);
  setupAdminConfigSheet(ss);
  setupAuditLogSheet(ss);
  insertSampleData(ss);

  Logger.log("=== Setup เสร็จสมบูรณ์ ===");
  SpreadsheetApp.getUi().alert("✅ Setup เสร็จสมบูรณ์!\n\nสร้าง Sheet ครบ 7 ชีต พร้อมข้อมูลตัวอย่าง");
}

// ---- Sheet Setup Functions ---------------------------------

function setupAssetsSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ASSETS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ASSETS);
  else sheet.clearContents();

  const headers = [
    "asset_id", "name", "type", "asset_number", "brand", "model",
    "serial_number", "mac_address", "ip_address", "location",
    "department", "purchase_date", "warranty_expire", "status",
    "is_nt_device", "description", "created_at", "updated_at"
  ];
  applySheetHeaders(sheet, headers, "#1e3a5f");
  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.ASSETS);
}

function setupRolesSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ROLES);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ROLES);
  else sheet.clearContents();

  const headers = [
    "asset_id", "responsibilities", "connected_systems",
    "owner", "notes", "updated_at"
  ];
  applySheetHeaders(sheet, headers, "#1e4d2b");
  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.ROLES);
}

function setupRiskSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.RISK);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.RISK);
  else sheet.clearContents();

  const headers = [
    "asset_id", "risk_level_id", "risk_description",
    "impact_if_failed", "cascading_impact", "updated_at"
  ];
  applySheetHeaders(sheet, headers, "#7b1e1e");
  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.RISK);
}

function setupAccessSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ACCESS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ACCESS);
  else sheet.clearContents();

  const headers = [
    "asset_id", "windows_username", "windows_password",
    "access_level", "last_password_change", "updated_at"
  ];
  applySheetHeaders(sheet, headers, "#4a1e6e");

  // ซ่อนคอลัมน์ windows_password (column C = index 3)
  sheet.hideColumns(3);

  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.ACCESS + " (ซ่อนคอลัมน์ password)");
}

function setupPlansSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLANS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PLANS);
  else sheet.clearContents();

  const headers = [
    "asset_id", "backup_plan", "contingency_plan",
    "maintenance_schedule", "responsible_person", "notes", "updated_at"
  ];
  applySheetHeaders(sheet, headers, "#1e3a5f");
  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.PLANS);
}

function setupAdminConfigSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ADMIN_CONFIG);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.ADMIN_CONFIG);
  else sheet.clearContents();

  const headers = [
    "config_type", "config_id", "label", "color",
    "text_color", "order", "updated_at"
  ];
  applySheetHeaders(sheet, headers, "#3d3d1e");

  // Insert Default Risk Levels
  const now = nowISO();
  CONFIG.DEFAULT_RISK_LEVELS.forEach(level => {
    sheet.appendRow([
      "risk_level",
      level.id,
      level.label,
      level.color,
      level.textColor,
      level.order,
      now,
    ]);
  });

  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.ADMIN_CONFIG + " + Default Risk Levels");
}

function setupAuditLogSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.AUDIT_LOG);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
  else sheet.clearContents();

  const headers = [
    "log_id", "timestamp", "action", "asset_id",
    "asset_name", "actor_email", "before_json", "after_json"
  ];
  applySheetHeaders(sheet, headers, "#2d2d2d");
  Logger.log("✅ สร้าง Sheet: " + CONFIG.SHEET_NAMES.AUDIT_LOG);
}

// ---- Sample Data -------------------------------------------

function insertSampleData(ss) {
  Logger.log("กำลังเพิ่มข้อมูลตัวอย่าง...");

  const now = nowISO();
  const sampleAssets = [
    {
      asset_id:        "PC-a1b2c3d4",
      name:            "PC-FINANCE-01",
      type:            "PC",
      asset_number:    "ครภ.001/2566",
      brand:           "Dell",
      model:           "OptiPlex 7090",
      serial_number:   "DL7090-001",
      mac_address:     "AA:BB:CC:DD:EE:01",
      ip_address:      "192.168.1.101",
      location:        "ห้องการเงิน ชั้น 2",
      department:      "การเงิน",
      purchase_date:   "2023-01-15",
      warranty_expire: "2026-01-15",
      status:          "ใช้งาน",
      is_nt_device:    "FALSE",
      description:     "เครื่องหลักฝ่ายการเงิน",
      created_at:      now,
      updated_at:      now,
    },
    {
      asset_id:        "NB-e5f6g7h8",
      name:            "NB-IT-ADMIN-01",
      type:            "Notebook",
      asset_number:    "ครภ.002/2566",
      brand:           "Lenovo",
      model:           "ThinkPad E14",
      serial_number:   "LNV-E14-002",
      mac_address:     "AA:BB:CC:DD:EE:02",
      ip_address:      "192.168.1.102",
      location:        "ห้อง IT ชั้น 1",
      department:      "IT",
      purchase_date:   "2023-03-01",
      warranty_expire: "2026-03-01",
      status:          "ใช้งาน",
      is_nt_device:    "FALSE",
      description:     "Notebook ผู้ดูแลระบบ IT",
      created_at:      now,
      updated_at:      now,
    },
    {
      asset_id:        "MT-i9j0k1l2",
      name:            "MikroTik-CORE-01",
      type:            "MikroTik",
      asset_number:    "ครภ.NT-001/2566",
      brand:           "MikroTik",
      model:           "RB4011iGS+",
      serial_number:   "MT-RB4011-001",
      mac_address:     "AA:BB:CC:DD:EE:03",
      ip_address:      "192.168.1.1",
      location:        "ห้อง Server ชั้น 1",
      department:      "NT",
      purchase_date:   "2022-06-01",
      warranty_expire: "2025-06-01",
      status:          "ใช้งาน",
      is_nt_device:    "TRUE",
      description:     "Router หลักของเครือข่าย NT",
      created_at:      now,
      updated_at:      now,
    },
    {
      asset_id:        "SW-m3n4o5p6",
      name:            "Switch-FLOOR2-01",
      type:            "Switch Hub",
      asset_number:    "ครภ.NT-002/2566",
      brand:           "NT",
      model:           "Managed Switch 24-Port",
      serial_number:   "NT-SW24-001",
      mac_address:     "AA:BB:CC:DD:EE:04",
      ip_address:      "192.168.1.2",
      location:        "ตู้ Rack ชั้น 2",
      department:      "NT",
      purchase_date:   "2022-06-01",
      warranty_expire: "2025-06-01",
      status:          "ใช้งาน",
      is_nt_device:    "TRUE",
      description:     "Switch ชั้น 2 เชื่อมต่อ PC ทุกเครื่องในชั้น",
      created_at:      now,
      updated_at:      now,
    },
    {
      asset_id:        "MW-q7r8s9t0",
      name:            "Mesh-WiFi-01",
      type:            "Mesh WiFi",
      asset_number:    "ครภ.NT-003/2566",
      brand:           "NT",
      model:           "Mesh WiFi Pro",
      serial_number:   "NT-MESH-001",
      mac_address:     "AA:BB:CC:DD:EE:05",
      ip_address:      "192.168.1.3",
      location:        "ชั้น 1 โถงกลาง",
      department:      "NT",
      purchase_date:   "2023-01-01",
      warranty_expire: "2026-01-01",
      status:          "ใช้งาน",
      is_nt_device:    "TRUE",
      description:     "Mesh WiFi ครอบคลุมชั้น 1-2",
      created_at:      now,
      updated_at:      now,
    },
  ];

  const assetsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ASSETS);
  sampleAssets.forEach(a => {
    assetsSheet.appendRow([
      a.asset_id, a.name, a.type, a.asset_number, a.brand, a.model,
      a.serial_number, a.mac_address, a.ip_address, a.location,
      a.department, a.purchase_date, a.warranty_expire, a.status,
      a.is_nt_device, a.description, a.created_at, a.updated_at
    ]);
  });

  // --- Roles ---
  const rolesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ROLES);
  const sampleRoles = [
    ["PC-a1b2c3d4", "ระบบบัญชี, จัดทำรายงานการเงิน, ประมวลผล ERP", "ระบบ ERP, ระบบบัญชี Oracle", "นายสมชาย ใจดี", "", now],
    ["NB-e5f6g7h8", "บริหารจัดการระบบ IT, ดูแล Server, ซัพพอร์ต User", "Server หลัก, Google Admin Console", "นางสาวสมหญิง ดูแล", "", now],
    ["MT-i9j0k1l2", "Router หลัก ควบคุม Traffic ทั้งหมดขององค์กร", "Switch ทุกตัว, Internet Gateway, Firewall", "ทีม NT", "เป็น Core Router ถ้าล่มทั้งระบบเครือข่ายหยุด", now],
    ["SW-m3n4o5p6", "กระจายสัญญาณ LAN ชั้น 2 ให้กับ PC 20 เครื่อง", "MikroTik Core, PC ชั้น 2 ทุกเครื่อง", "ทีม NT", "", now],
    ["MW-q7r8s9t0", "ให้บริการ WiFi ชั้น 1-2 สำหรับ Notebook และมือถือ", "MikroTik Core, Notebook ทุกเครื่อง", "ทีม NT", "", now],
  ];
  sampleRoles.forEach(r => rolesSheet.appendRow(r));

  // --- Risk ---
  const riskSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.RISK);
  const sampleRisk = [
    ["PC-a1b2c3d4", "high",     "เครื่องเก่า RAM ไม่พอ HDD มีปัญหา",       "ระบบบัญชีหยุด งานการเงินสะดุด",                   "รายงานส่งผู้บริหารล่าช้า ERP ไม่ได้รับข้อมูล", now],
    ["NB-e5f6g7h8", "critical", "เป็นเครื่องเดียวที่ Admin ใช้",             "IT Support หยุด, ไม่มีใครจัดการ Server ได้",      "ระบบทั้งหมดอาจหยุดถ้า Server มีปัญหาและไม่มี Admin", now],
    ["MT-i9j0k1l2", "critical", "Core Router ถ้าล่มทุกอุปกรณ์ไม่มี Internet", "เครือข่ายทั้งองค์กรล่ม",                          "PC ทุกเครื่อง, Switch, Mesh WiFi ไม่ทำงาน", now],
    ["SW-m3n4o5p6", "high",     "Switch ชั้น 2 ไม่มีตัวสำรอง",              "PC ชั้น 2 จำนวน 20 เครื่องหมดอินเตอร์เน็ต",      "ฝ่ายการเงิน ฝ่ายบุคคล ฝ่ายธุรการ หยุดทำงาน", now],
    ["MW-q7r8s9t0", "medium",   "Mesh WiFi ชำรุด",                           "Notebook และมือถือไม่มี WiFi",                     "การประชุมออนไลน์ล่ม, Notebook ต้องใช้ LAN แทน", now],
  ];
  sampleRisk.forEach(r => riskSheet.appendRow(r));

  // --- Access Rights ---
  const accessSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ACCESS);
  const sampleAccess = [
    ["PC-a1b2c3d4", "finance01",   "P@ssw0rd!1", "Standard User",  "2024-01-01", now],
    ["NB-e5f6g7h8", "it_admin",    "Adm!nP@ss", "Administrator",   "2024-06-01", now],
    ["MT-i9j0k1l2", "nt_admin",    "NT@dm1n!",  "Administrator",   "2024-01-01", now],
    ["SW-m3n4o5p6", "nt_switch",   "Sw1tch@NT", "Administrator",   "2024-01-01", now],
    ["MW-q7r8s9t0", "nt_mesh",     "M3sh@NT!",  "Administrator",   "2024-01-01", now],
  ];
  sampleAccess.forEach(r => accessSheet.appendRow(r));

  // --- Management Plans ---
  const plansSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLANS);
  const samplePlans = [
    ["PC-a1b2c3d4", "Backup ข้อมูลไป NAS ทุกวัน 17:00",      "สลับไปใช้ PC สำรองในห้อง IT ชั่วคราว", "ทุก 3 เดือน ตรวจสอบ HDD และ RAM",    "ทีม IT",  "", now],
    ["NB-e5f6g7h8", "Sync ข้อมูลขึ้น Google Drive ทุกวัน",    "ใช้ PC สำรองเข้า Remote Desktop แทน",   "ทุก 6 เดือน อัปเดต Driver และ OS",    "IT Admin", "", now],
    ["MT-i9j0k1l2", "มี Backup Config บน USB และ Cloud",        "ติดต่อ NT ทันที เพื่อ Replace ตัวสำรอง", "ทุก 6 เดือน อัปเดต Firmware",        "ทีม NT",  "มี Backup Unit เก็บไว้ห้อง Server", now],
    ["SW-m3n4o5p6", "Backup Config ไว้ใน MikroTik",             "ใช้ Unmanaged Switch ชั่วคราว",          "ทุก 12 เดือน ตรวจสอบ Port",           "ทีม NT",  "", now],
    ["MW-q7r8s9t0", "ไม่มี Backup เพิ่มเติม",                  "ใช้ LAN Cable แทนชั่วคราว",              "ทุก 6 เดือน ตรวจสอบสัญญาณ",          "ทีม NT",  "", now],
  ];
  samplePlans.forEach(r => plansSheet.appendRow(r));

  Logger.log("✅ เพิ่มข้อมูลตัวอย่าง 5 อุปกรณ์เรียบร้อย");
}

// ---- Formatting Helper ------------------------------------

/**
 * ตั้งค่า header row ของ Sheet
 * @param {Sheet} sheet
 * @param {string[]} headers
 * @param {string} bgColor - Hex color
 */
function applySheetHeaders(sheet, headers, bgColor) {
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  sheet.setFrozenRows(1);

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  // กำหนดความสูง header row
  sheet.setRowHeight(1, 35);
}

// ---- Utility: Reset (ใช้ในการ dev/test) ------------------

/**
 * ⚠️ ลบข้อมูลทั้งหมดใน Sheet แล้ว setup ใหม่ (ระวัง!)
 * ใช้ตอน dev เท่านั้น อย่ารันใน production
 */
function resetAndSetup() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    "⚠️ ยืนยันการ Reset",
    "จะลบข้อมูลทั้งหมดและสร้างใหม่ ดำเนินการต่อหรือไม่?",
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    setupAllSheets();
  }
}