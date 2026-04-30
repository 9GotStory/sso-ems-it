// ============================================================
// SheetService.gs — อ่าน/เขียน Google Sheets (CRUD ทั้งหมด)
// ============================================================

// ---- Sheet Access Helpers ----------------------------------

/**
 * เปิด Spreadsheet หลัก
 * @returns {Spreadsheet}
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * เปิด Sheet ตามชื่อ
 * @param {string} sheetName
 * @returns {Sheet}
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`ไม่พบ Sheet: ${sheetName}`);
  return sheet;
}

/**
 * ดึงข้อมูลทั้งหมดจาก Sheet เป็น array of objects
 * @param {string} sheetName
 * @returns {Object[]}
 */
function getAllRows(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    return rowsToObjects(data);
  } catch (e) {
    logError("getAllRows:" + sheetName, e);
    return [];
  }
}

/**
 * ดึง header row ของ Sheet
 * @param {string} sheetName
 * @returns {string[]}
 */
function getHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => sanitize(h));
}

// ============================================================
// ASSETS CRUD
// ============================================================

const ASSET_HEADERS = [
  "asset_id", "name", "type", "asset_number", "brand", "model",
  "serial_number", "mac_address", "ip_address", "location",
  "department", "purchase_date", "warranty_expire", "status",
  "is_nt_device", "description", "created_at", "updated_at"
];

/**
 * ดึง Asset ทั้งหมด
 * @returns {Object[]}
 */
function getAssets() {
  return getAllRows(CONFIG.SHEET_NAMES.ASSETS);
}

/**
 * ดึง Asset ตาม asset_id
 * @param {string} assetId
 * @returns {Object|null}
 */
function getAssetById(assetId) {
  const assets = getAssets();
  return assets.find(a => a.asset_id === assetId) || null;
}

/**
 * ดึงข้อมูล Asset แบบครบทุก Sheet (สำหรับ Asset Detail page)
 * @param {string} assetId
 * @returns {Object}
 */
function getAssetFull(assetId) {
  try {
    const asset   = getAssetById(assetId);
    if (!asset) return errorResponse("ไม่พบ Asset ID: " + assetId, 404);

    const roles   = getAllRows(CONFIG.SHEET_NAMES.ROLES).find(r => r.asset_id === assetId) || {};
    const risk    = getAllRows(CONFIG.SHEET_NAMES.RISK).find(r => r.asset_id === assetId) || {};
    const access  = getAllRows(CONFIG.SHEET_NAMES.ACCESS).find(r => r.asset_id === assetId) || {};
    const plan    = getAllRows(CONFIG.SHEET_NAMES.PLANS).find(r => r.asset_id === assetId) || {};

    // ซ่อน windows_password ถ้าไม่ใช่ Admin
    if (!checkIsAdmin() && access.windows_password) {
      access.windows_password = "••••••••";
    }

    return successResponse({ asset, roles, risk, access, plan });
  } catch (e) {
    logError("getAssetFull", e);
    return errorResponse("เกิดข้อผิดพลาด: " + e.message);
  }
}

/**
 * สร้าง Asset ใหม่พร้อมข้อมูลทุก Sheet
 * @param {Object} payload - ข้อมูลทั้งหมดจาก form
 * @returns {Object} response
 */
function createAsset(payload) {
  return requireAdmin(() => {
    try {
      const assetId = generateAssetId(payload.type || "Other");
      const now = nowISO();

      // --- Sheet: Assets ---
      appendRow(CONFIG.SHEET_NAMES.ASSETS, ASSET_HEADERS, {
        asset_id:        assetId,
        name:            sanitize(payload.name),
        type:            sanitize(payload.type),
        asset_number:    sanitize(payload.asset_number),
        brand:           sanitize(payload.brand),
        model:           sanitize(payload.model),
        serial_number:   sanitize(payload.serial_number),
        mac_address:     sanitize(payload.mac_address),
        ip_address:      sanitize(payload.ip_address),
        location:        sanitize(payload.location),
        department:      sanitize(payload.department),
        purchase_date:   sanitize(payload.purchase_date),
        warranty_expire: sanitize(payload.warranty_expire),
        status:          sanitize(payload.status) || "ใช้งาน",
        is_nt_device:    payload.is_nt_device === true || payload.is_nt_device === "true" ? "TRUE" : "FALSE",
        description:     sanitize(payload.description),
        created_at:      now,
        updated_at:      now,
      });

      // --- Sheet: Asset_Roles ---
      const roleHeaders = ["asset_id", "responsibilities", "connected_systems", "owner", "notes", "updated_at"];
      appendRow(CONFIG.SHEET_NAMES.ROLES, roleHeaders, {
        asset_id:           assetId,
        responsibilities:   sanitize(payload.responsibilities),
        connected_systems:  sanitize(payload.connected_systems),
        owner:              sanitize(payload.owner),
        notes:              sanitize(payload.role_notes),
        updated_at:         now,
      });

      // --- Sheet: Risk_Assessment ---
      const riskHeaders = ["asset_id", "risk_level_id", "risk_description", "impact_if_failed", "cascading_impact", "updated_at"];
      appendRow(CONFIG.SHEET_NAMES.RISK, riskHeaders, {
        asset_id:          assetId,
        risk_level_id:     sanitize(payload.risk_level_id) || "low",
        risk_description:  sanitize(payload.risk_description),
        impact_if_failed:  sanitize(payload.impact_if_failed),
        cascading_impact:  sanitize(payload.cascading_impact),
        updated_at:        now,
      });

      // --- Sheet: Access_Rights ---
      const accessHeaders = ["asset_id", "windows_username", "windows_password", "access_level", "last_password_change", "updated_at"];
      appendRow(CONFIG.SHEET_NAMES.ACCESS, accessHeaders, {
        asset_id:             assetId,
        windows_username:     sanitize(payload.windows_username),
        windows_password:     sanitize(payload.windows_password),
        access_level:         sanitize(payload.access_level) || "Standard User",
        last_password_change: sanitize(payload.last_password_change),
        updated_at:           now,
      });

      // --- Sheet: Management_Plans ---
      const planHeaders = ["asset_id", "backup_plan", "contingency_plan", "maintenance_schedule", "responsible_person", "notes", "updated_at"];
      appendRow(CONFIG.SHEET_NAMES.PLANS, planHeaders, {
        asset_id:             assetId,
        backup_plan:          sanitize(payload.backup_plan),
        contingency_plan:     sanitize(payload.contingency_plan),
        maintenance_schedule: sanitize(payload.maintenance_schedule),
        responsible_person:   sanitize(payload.responsible_person),
        notes:                sanitize(payload.plan_notes),
        updated_at:           now,
      });

      // --- Audit Log ---
      writeAuditLog("CREATE", assetId, payload.name, null, payload);

      return successResponse({ asset_id: assetId }, `เพิ่มอุปกรณ์ "${payload.name}" สำเร็จ`);
    } catch (e) {
      logError("createAsset", e);
      return errorResponse("เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    }
  });
}

/**
 * อัปเดต Asset (แก้ไขข้อมูล)
 * @param {string} assetId
 * @param {Object} payload
 * @returns {Object} response
 */
function updateAsset(assetId, payload) {
  return requireAdmin(() => {
    try {
      const now = nowISO();
      const oldAsset = getAssetById(assetId);
      if (!oldAsset) return errorResponse("ไม่พบ Asset ID: " + assetId, 404);

      // อัปเดตแต่ละ Sheet
      updateRowByAssetId(CONFIG.SHEET_NAMES.ASSETS, assetId, {
        name:            sanitize(payload.name),
        type:            sanitize(payload.type),
        asset_number:    sanitize(payload.asset_number),
        brand:           sanitize(payload.brand),
        model:           sanitize(payload.model),
        serial_number:   sanitize(payload.serial_number),
        mac_address:     sanitize(payload.mac_address),
        ip_address:      sanitize(payload.ip_address),
        location:        sanitize(payload.location),
        department:      sanitize(payload.department),
        purchase_date:   sanitize(payload.purchase_date),
        warranty_expire: sanitize(payload.warranty_expire),
        status:          sanitize(payload.status),
        is_nt_device:    payload.is_nt_device === true || payload.is_nt_device === "true" ? "TRUE" : "FALSE",
        description:     sanitize(payload.description),
        updated_at:      now,
      });

      updateRowByAssetId(CONFIG.SHEET_NAMES.ROLES, assetId, {
        responsibilities:  sanitize(payload.responsibilities),
        connected_systems: sanitize(payload.connected_systems),
        owner:             sanitize(payload.owner),
        notes:             sanitize(payload.role_notes),
        updated_at:        now,
      });

      updateRowByAssetId(CONFIG.SHEET_NAMES.RISK, assetId, {
        risk_level_id:    sanitize(payload.risk_level_id),
        risk_description: sanitize(payload.risk_description),
        impact_if_failed: sanitize(payload.impact_if_failed),
        cascading_impact: sanitize(payload.cascading_impact),
        updated_at:       now,
      });

      updateRowByAssetId(CONFIG.SHEET_NAMES.ACCESS, assetId, {
        windows_username:     sanitize(payload.windows_username),
        windows_password:     sanitize(payload.windows_password),
        access_level:         sanitize(payload.access_level),
        last_password_change: sanitize(payload.last_password_change),
        updated_at:           now,
      });

      updateRowByAssetId(CONFIG.SHEET_NAMES.PLANS, assetId, {
        backup_plan:          sanitize(payload.backup_plan),
        contingency_plan:     sanitize(payload.contingency_plan),
        maintenance_schedule: sanitize(payload.maintenance_schedule),
        responsible_person:   sanitize(payload.responsible_person),
        notes:                sanitize(payload.plan_notes),
        updated_at:           now,
      });

      writeAuditLog("UPDATE", assetId, payload.name, oldAsset, payload);

      return successResponse({ asset_id: assetId }, `อัปเดตอุปกรณ์ "${payload.name}" สำเร็จ`);
    } catch (e) {
      logError("updateAsset", e);
      return errorResponse("เกิดข้อผิดพลาด: " + e.message);
    }
  });
}

/**
 * Soft Delete — เปลี่ยน status เป็น "เลิกใช้"
 * @param {string} assetId
 * @returns {Object} response
 */
function softDeleteAsset(assetId) {
  return requireAdmin(() => {
    try {
      const asset = getAssetById(assetId);
      if (!asset) return errorResponse("ไม่พบ Asset ID: " + assetId, 404);

      updateRowByAssetId(CONFIG.SHEET_NAMES.ASSETS, assetId, {
        status:     "เลิกใช้",
        updated_at: nowISO(),
      });

      writeAuditLog("SOFT_DELETE", assetId, asset.name, asset, { status: "เลิกใช้" });
      return successResponse({ asset_id: assetId }, `เปลี่ยนสถานะ "${asset.name}" เป็น "เลิกใช้" แล้ว`);
    } catch (e) {
      logError("softDeleteAsset", e);
      return errorResponse("เกิดข้อผิดพลาด: " + e.message);
    }
  });
}

/**
 * Hard Delete — ลบแถวออกจากทุก Sheet จริงๆ
 * @param {string} assetId
 * @returns {Object} response
 */
function hardDeleteAsset(assetId) {
  return requireAdmin(() => {
    try {
      const asset = getAssetById(assetId);
      if (!asset) return errorResponse("ไม่พบ Asset ID: " + assetId, 404);

      // ลบออกทุก Sheet
      [
        CONFIG.SHEET_NAMES.ASSETS,
        CONFIG.SHEET_NAMES.ROLES,
        CONFIG.SHEET_NAMES.RISK,
        CONFIG.SHEET_NAMES.ACCESS,
        CONFIG.SHEET_NAMES.PLANS,
      ].forEach(sheetName => {
        deleteRowByAssetId(sheetName, assetId);
      });

      writeAuditLog("HARD_DELETE", assetId, asset.name, asset, null);
      return successResponse({ asset_id: assetId }, `ลบอุปกรณ์ "${asset.name}" ออกจากระบบแล้ว`);
    } catch (e) {
      logError("hardDeleteAsset", e);
      return errorResponse("เกิดข้อผิดพลาด: " + e.message);
    }
  });
}

// ============================================================
// RISK LEVELS CRUD (Admin_Config)
// ============================================================

/**
 * ดึง Risk Levels ทั้งหมดจาก Admin_Config Sheet
 * ถ้าไม่มีข้อมูลให้ใช้ DEFAULT_RISK_LEVELS
 * @returns {Object[]}
 */
function getRiskLevels() {
  try {
    const rows = getAllRows(CONFIG.SHEET_NAMES.ADMIN_CONFIG);
    const riskRows = rows.filter(r => r.config_type === "risk_level");
    if (riskRows.length === 0) return CONFIG.DEFAULT_RISK_LEVELS;
    return riskRows.map(r => ({
      id:        sanitize(r.config_id),
      label:     sanitize(r.label),
      color:     sanitize(r.color),
      textColor: sanitize(r.text_color) || "#fff",
      order:     parseInt(r.order) || 0,
    })).sort((a, b) => a.order - b.order);
  } catch (e) {
    logError("getRiskLevels", e);
    return CONFIG.DEFAULT_RISK_LEVELS;
  }
}

/**
 * บันทึก Risk Levels ทั้งชุด (replace all)
 * @param {Object[]} levels - array ของ risk level objects
 * @returns {Object} response
 */
function saveRiskLevels(levels) {
  return requireAdmin(() => {
    try {
      const sheet = getSheet(CONFIG.SHEET_NAMES.ADMIN_CONFIG);
      const headers = ["config_type", "config_id", "label", "color", "text_color", "order", "updated_at"];

      // ลบแถว risk_level เดิมออก
      deleteRowsByConfigType(CONFIG.SHEET_NAMES.ADMIN_CONFIG, "risk_level");

      // เพิ่มชุดใหม่
      levels.forEach((level, idx) => {
        appendRow(CONFIG.SHEET_NAMES.ADMIN_CONFIG, headers, {
          config_type: "risk_level",
          config_id:   sanitize(level.id) || generateUUID().substring(0, 8),
          label:       sanitize(level.label),
          color:       sanitize(level.color),
          text_color:  sanitize(level.textColor) || "#fff",
          order:       idx + 1,
          updated_at:  nowISO(),
        });
      });

      return successResponse(levels, "บันทึก Risk Levels สำเร็จ");
    } catch (e) {
      logError("saveRiskLevels", e);
      return errorResponse("เกิดข้อผิดพลาด: " + e.message);
    }
  });
}

// ============================================================
// DASHBOARD DATA
// ============================================================

/**
 * ดึงข้อมูลสรุปสำหรับ Dashboard
 * @returns {Object} response
 */
function getDashboardData() {
  try {
    const assets     = getAssets();
    const riskLevels = getRiskLevels();
    const risks      = getAllRows(CONFIG.SHEET_NAMES.RISK);

    // นับตามประเภท
    const byType = {};
    assets.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    // นับตามสถานะ
    const byStatus = {};
    assets.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    // นับตามระดับความเสี่ยง
    const byRisk = {};
    riskLevels.forEach(l => { byRisk[l.id] = 0; });
    risks.forEach(r => {
      if (byRisk.hasOwnProperty(r.risk_level_id)) {
        byRisk[r.risk_level_id]++;
      }
    });

    // อุปกรณ์ NT
    const ntDevices = assets.filter(a => a.is_nt_device === "TRUE" || a.is_nt_device === true);

    // อุปกรณ์วิกฤต/สูง (ดึงรายชื่อ)
    const highRiskLevelIds = riskLevels
      .filter(l => l.order >= riskLevels.length - 1)
      .map(l => l.id);
    const highRiskAssets = risks
      .filter(r => highRiskLevelIds.includes(r.risk_level_id))
      .map(r => {
        const asset = assets.find(a => a.asset_id === r.asset_id);
        return asset ? { ...asset, risk_level_id: r.risk_level_id } : null;
      })
      .filter(Boolean);

    return successResponse({
      total:         assets.length,
      byType,
      byStatus,
      byRisk,
      ntCount:       ntDevices.length,
      highRiskCount: highRiskAssets.length,
      highRiskAssets,
      riskLevels,
    });
  } catch (e) {
    logError("getDashboardData", e);
    return errorResponse("เกิดข้อผิดพลาด: " + e.message);
  }
}

/**
 * ดึง Asset List พร้อม Risk Level (สำหรับตารางหน้า Asset List)
 * @param {Object} filters - { type, status, risk_level_id, search }
 * @returns {Object} response
 */
function getAssetList(filters) {
  try {
    filters = filters || {};
    let assets = getAssets();
    const risks = getAllRows(CONFIG.SHEET_NAMES.RISK);
    const riskMap = {};
    risks.forEach(r => { riskMap[r.asset_id] = r; });

    // รวม risk เข้ากับ asset
    assets = assets.map(a => ({
      ...a,
      risk_level_id: riskMap[a.asset_id] ? riskMap[a.asset_id].risk_level_id : "",
    }));

    // Filter
    if (filters.type)          assets = assets.filter(a => a.type === filters.type);
    if (filters.status)        assets = assets.filter(a => a.status === filters.status);
    if (filters.risk_level_id) assets = assets.filter(a => a.risk_level_id === filters.risk_level_id);
    if (filters.is_nt_device)  assets = assets.filter(a => a.is_nt_device === "TRUE");
    if (filters.search) {
      const q = filters.search.toLowerCase();
      assets = assets.filter(a =>
        (a.name        || "").toLowerCase().includes(q) ||
        (a.asset_id    || "").toLowerCase().includes(q) ||
        (a.ip_address  || "").toLowerCase().includes(q) ||
        (a.department  || "").toLowerCase().includes(q) ||
        (a.asset_number|| "").toLowerCase().includes(q)
      );
    }

    return successResponse({
      assets,
      total: assets.length,
      riskLevels: getRiskLevels(),
    });
  } catch (e) {
    logError("getAssetList", e);
    return errorResponse("เกิดข้อผิดพลาด: " + e.message);
  }
}

// ============================================================
// ROW-LEVEL HELPERS (Internal)
// ============================================================

/**
 * เพิ่มแถวใหม่ใน Sheet
 * @param {string} sheetName
 * @param {string[]} headers
 * @param {Object} data
 */
function appendRow(sheetName, headers, data) {
  const sheet = getSheet(sheetName);

  // ตรวจสอบว่า Sheet มี header แล้วหรือยัง
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  const row = objectToRow(data, headers);
  sheet.appendRow(row);
}

/**
 * อัปเดตแถวที่มี asset_id ตรงกัน
 * @param {string} sheetName
 * @param {string} assetId
 * @param {Object} updates - fields ที่ต้องการอัปเดต
 */
function updateRowByAssetId(sheetName, assetId, updates) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0].map(h => sanitize(h));
    const assetIdCol = headers.indexOf("asset_id");
    if (assetIdCol === -1) return;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][assetIdCol]).trim() === assetId) {
        Object.keys(updates).forEach(key => {
          const col = headers.indexOf(key);
          if (col !== -1) {
            sheet.getRange(i + 1, col + 1).setValue(updates[key]);
          }
        });
        return;
      }
    }

    // ถ้าไม่พบ row ให้ append แทน (กรณีข้อมูล sub-sheet ยังไม่มี)
    const subHeaders = headers;
    const newRow = { asset_id: assetId, ...updates };
    appendRow(sheetName, subHeaders, newRow);
  } catch (e) {
    logError("updateRowByAssetId:" + sheetName, e);
  }
}

/**
 * ลบแถวที่มี asset_id ตรงกัน (ลบแถวแรกที่พบ)
 * @param {string} sheetName
 * @param {string} assetId
 */
function deleteRowByAssetId(sheetName, assetId) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0].map(h => sanitize(h));
    const assetIdCol = headers.indexOf("asset_id");
    if (assetIdCol === -1) return;

    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][assetIdCol]).trim() === assetId) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) {
    logError("deleteRowByAssetId:" + sheetName, e);
  }
}

/**
 * ลบแถวทั้งหมดที่มี config_type ตรงกัน (สำหรับ Admin_Config)
 * @param {string} sheetName
 * @param {string} configType
 */
function deleteRowsByConfigType(sheetName, configType) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0].map(h => sanitize(h));
    const typeCol = headers.indexOf("config_type");
    if (typeCol === -1) return;

    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][typeCol]).trim() === configType) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (e) {
    logError("deleteRowsByConfigType", e);
  }
}

// ============================================================
// AUDIT LOG
// ============================================================

/**
 * บันทึก Audit Log
 * @param {string} action - CREATE | UPDATE | SOFT_DELETE | HARD_DELETE
 * @param {string} assetId
 * @param {string} assetName
 * @param {Object|null} before
 * @param {Object|null} after
 */
function writeAuditLog(action, assetId, assetName, before, after) {
  try {
    const sheet = getSheet(CONFIG.SHEET_NAMES.AUDIT_LOG);
    const userInfo = getUserInfo();

    // ตรวจสอบ header
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["log_id", "timestamp", "action", "asset_id", "asset_name", "actor_email", "before_json", "after_json"]);
    }

    sheet.appendRow([
      generateUUID(),
      nowISO(),
      action,
      assetId,
      assetName,
      userInfo.email,
      before ? JSON.stringify(before) : "",
      after  ? JSON.stringify(after)  : "",
    ]);
  } catch (e) {
    logError("writeAuditLog", e);
    // ไม่ throw error เพื่อไม่ให้กระทบ main flow
  }
}

/**
 * ดึง Audit Log ล่าสุด N รายการ
 * @param {number} limit
 * @returns {Object} response
 */
function getAuditLog(limit) {
  return requireAdmin(() => {
    try {
      const logs = getAllRows(CONFIG.SHEET_NAMES.AUDIT_LOG);
      const sorted = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return successResponse(sorted.slice(0, limit || 50));
    } catch (e) {
      logError("getAuditLog", e);
      return errorResponse("เกิดข้อผิดพลาด: " + e.message);
    }
  });
}