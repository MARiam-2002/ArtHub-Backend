/**
 * وحدة التسجيل المركزية للتطبيق
 * توفر واجهة موحدة لتسجيل الأحداث والأخطاء
 */

export const logger = {
  /**
   * تسجيل معلومات عامة
   * @param {string} message - رسالة المعلومات
   * @param {Object} [data] - بيانات إضافية اختيارية
   */
  info: (message, data) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? data : '');
  },

  /**
   * تسجيل تحذيرات
   * @param {string} message - رسالة التحذير
   * @param {Object} [data] - بيانات إضافية اختيارية
   */
  warn: (message, data) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? data : '');
  },

  /**
   * تسجيل أخطاء
   * @param {string} message - رسالة الخطأ
   * @param {Object} [data] - بيانات إضافية اختيارية مثل كائن الخطأ
   */
  error: (message, data) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, data ? data : '');
  },

  /**
   * تسجيل معلومات تصحيح الأخطاء
   * @param {string} message - رسالة التصحيح
   * @param {Object} [data] - بيانات إضافية اختيارية
   */
  debug: (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? data : '');
    }
  }
};