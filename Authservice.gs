// ============================================================
// AuthService.gs — ระบบ Authentication ผ่าน Google Profile
// ============================================================

/**
 * ตรวจสอบว่า user ปัจจุบันเป็น Admin หรือไม่
 * @returns {boolean}
 */
function checkIsAdmin() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) return false;
    return CONFIG.ADMIN_EMAILS.includes(userEmail.toLowerCase().trim());
  } catch (e) {
    logError("checkIsAdmin", e);
    return false;
  }
}

/**
 * ดึงข้อมูล User ปัจจุบันทั้งหมด
 * @returns {{email: string, name: string, isAdmin: boolean, isLoggedIn: boolean}}
 */
function getUserInfo() {
  try {
    const user = Session.getActiveUser();
    const email = user.getEmail() || "";
    const isAdmin = checkIsAdmin();

    return {
      isLoggedIn: email !== "",
      email:      email,
      name:       email.split("@")[0] || "ผู้เยี่ยมชม",
      isAdmin:    isAdmin,
    };
  } catch (e) {
    logError("getUserInfo", e);
    return {
      isLoggedIn: false,
      email:      "",
      name:       "ผู้เยี่ยมชม",
      isAdmin:    false,
    };
  }
}

/**
 * Middleware — ตรวจสอบ Admin ก่อน execute action
 * ใช้ wrap ทุก function ที่ต้องการสิทธิ์ Admin
 * @param {Function} fn - function ที่ต้องการ protect
 * @returns {*} ผลลัพธ์จาก fn หรือ error response
 */
function requireAdmin(fn) {
  if (!checkIsAdmin()) {
    return errorResponse("ไม่มีสิทธิ์เข้าถึง — กรุณาเข้าสู่ระบบด้วย Admin account", 403);
  }
  return fn();
}