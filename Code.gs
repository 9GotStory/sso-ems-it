// ============================================================
// Code.gs — Entry Point หลักของ GAS Web App
// doGet()  → serve HTML
// doPost() → รับ API request จาก client
// ============================================================

/**
 * HTTP GET — serve หน้าเว็บ
 * @param {Object} e - event object
 * @returns {HtmlOutput}
 */
function doGet(e) {
  try {
    const userInfo = getUserInfo();
    const template = HtmlService.createTemplateFromFile("index");

    // ส่งข้อมูล user ไปยัง template ตั้งแต่ load ครั้งแรก
    template.userInfo     = JSON.stringify(userInfo);
    template.riskLevels   = JSON.stringify(getRiskLevels());
    template.assetTypes   = JSON.stringify(Object.keys(CONFIG.ASSET_TYPE_PREFIX));
    template.assetStatus  = JSON.stringify(CONFIG.ASSET_STATUS);
    template.accessLevels = JSON.stringify(CONFIG.ACCESS_LEVELS);
    template.version      = CONFIG.VERSION;

    return template
      .evaluate()
      .setTitle("IT Asset Registry")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    logError("doGet", err);
    return HtmlService.createHtmlOutput(
      `<h3>เกิดข้อผิดพลาด</h3><p>${err.message}</p>`
    );
  }
}

/**
 * HTTP POST — API endpoint (สำหรับ CRUD operations)
 * body: { action: string, payload: object }
 * @param {Object} e
 * @returns {TextOutput} JSON
 */
function doPost(e) {
  try {
    const body    = safeParseJSON(e.postData.contents, {});
    const action  = body.action  || "";
    const payload = body.payload || {};

    const result = routeAction(action, payload);
    return jsonOutput(result);
  } catch (err) {
    logError("doPost", err);
    return jsonOutput(errorResponse("Server Error: " + err.message, 500));
  }
}

/**
 * Route action string ไปยัง function ที่ถูกต้อง
 * @param {string} action
 * @param {Object} payload
 * @returns {Object} response
 */
function routeAction(action, payload) {
  switch (action) {

    // ---- Auth ----
    case "GET_USER_INFO":
      return successResponse(getUserInfo());

    // ---- Dashboard ----
    case "GET_DASHBOARD":
      return getDashboardData();

    // ---- Asset List ----
    case "GET_ASSET_LIST":
      return getAssetList(payload);

    // ---- Asset Detail ----
    case "GET_ASSET_FULL":
      if (!payload.asset_id) return errorResponse("กรุณาระบุ asset_id");
      return getAssetFull(payload.asset_id);

    // ---- Asset CRUD ----
    case "CREATE_ASSET":
      return createAsset(payload);

    case "UPDATE_ASSET":
      if (!payload.asset_id) return errorResponse("กรุณาระบุ asset_id");
      return updateAsset(payload.asset_id, payload);

    case "SOFT_DELETE_ASSET":
      if (!payload.asset_id) return errorResponse("กรุณาระบุ asset_id");
      return softDeleteAsset(payload.asset_id);

    case "HARD_DELETE_ASSET":
      if (!payload.asset_id) return errorResponse("กรุณาระบุ asset_id");
      return hardDeleteAsset(payload.asset_id);

    // ---- Risk Levels ----
    case "GET_RISK_LEVELS":
      return successResponse(getRiskLevels());

    case "SAVE_RISK_LEVELS":
      if (!Array.isArray(payload.levels)) return errorResponse("กรุณาส่งข้อมูล levels");
      return saveRiskLevels(payload.levels);

    // ---- Audit Log ----
    case "GET_AUDIT_LOG":
      return getAuditLog(payload.limit);

    default:
      return errorResponse(`ไม่รู้จัก action: "${action}"`, 400);
  }
}

// ============================================================
// HTML Include Helper (สำหรับ template)
// ============================================================

/**
 * Include HTML file อื่นเข้ามาใน template
 * ใช้ใน index.html ด้วย <?!= include('filename') ?>
 * @param {string} filename - ชื่อไฟล์ .html ใน GAS project
 * @returns {string} HTML content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}