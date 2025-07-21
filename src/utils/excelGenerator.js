import ExcelJS from 'exceljs';

/**
 * إنشاء ملف Excel جميل لتصدير بيانات المستخدمين - مثل الداشبورد
 * @param {Array} users - قائمة المستخدمين
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Buffer>} ملف Excel كـ Buffer
 */
export const generateUsersExcel = async (users, options = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('إدارة المستخدمين', {
    views: [{ rightToLeft: true }] // دعم اللغة العربية
  });

  // تعريف ألوان التطبيق - ألوان الداشبورد
  const colors = {
    primary: '4A90E2',      // أزرق فاتح - لون العنوان الرئيسي
    secondary: 'F5A623',    // برتقالي - لون الفنانين
    success: '7ED321',      // أخضر - لون النشط
    danger: 'D0021B',       // أحمر - لون المحظور
    warning: 'F8E71C',      // أصفر - لون التحذير
    info: '9013FE',         // بنفسجي - لون العملاء
    light: 'F8F9FA',        // رمادي فاتح - خلفية
    dark: '2C3E50',         // رمادي داكن - نص
    white: 'FFFFFF',
    border: 'E1E8ED',
    headerBlue: '2C3E50',   // أزرق داكن للهيدر
    lightBlue: 'E3F2FD',    // أزرق فاتح للخلفية
    lightGreen: 'E8F5E8',   // أخضر فاتح
    lightRed: 'FFEBEE'      // أحمر فاتح
  };

  // تعريف الأنماط - أنماط الداشبورد
  const styles = {
    // عنوان رئيسي
    mainTitle: {
      font: {
        name: 'Arial',
        size: 18,
        bold: true,
        color: { argb: colors.headerBlue }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // عنوان فرعي
    subtitle: {
      font: {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: colors.dark }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // هيدر الجدول
    header: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.headerBlue }
      },
      font: {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: colors.white }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      },
      border: {
        top: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      }
    },
    // بيانات الجدول
    data: {
      font: {
        name: 'Arial',
        size: 11,
        color: { argb: colors.dark }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      },
      border: {
        top: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      }
    },
    // صف زوجي
    dataEven: {
      font: {
        name: 'Arial',
        size: 11,
        color: { argb: colors.dark }
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.lightBlue }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      },
      border: {
        top: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      }
    },
    // حالة نشط
    statusActive: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.success }
      },
      font: {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: colors.white }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // حالة محظور
    statusInactive: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.danger }
      },
      font: {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: colors.white }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // نوع فنان
    roleArtist: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.secondary }
      },
      font: {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: colors.white }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // نوع عميل
    roleUser: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.info }
      },
      font: {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: colors.white }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // إحصائيات
    stats: {
      font: {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: colors.dark }
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.lightGreen }
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      }
    },
    // معلومات التصدير
    exportInfo: {
      font: {
        name: 'Arial',
        size: 10,
        color: { argb: colors.dark }
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.light }
      },
      alignment: {
        horizontal: 'right',
        vertical: 'middle'
      }
    }
  };

  // إضافة مسافة صغيرة
  worksheet.addRow([]);
  
  // تعريف الأعمدة - مثل الداشبورد تماماً
  const columns = [
    { header: 'الاسم', key: 'displayName', width: 25 },
    { header: 'النوع', key: 'role', width: 12 },
    { header: 'البريد الإلكتروني', key: 'email', width: 30 },
    { header: 'الحالة', key: 'status', width: 12 },
    { header: 'تاريخ الانضمام', key: 'createdAt', width: 15 }
  ];

  // إضافة الأعمدة
  worksheet.columns = columns;

  // تنسيق رأس الجدول
  const headerRow = worksheet.getRow(4);
  headerRow.eachCell((cell) => {
    cell.style = styles.header;
  });

  // إضافة البيانات - مثل الداشبورد تماماً
  users.forEach((user, index) => {
    const row = worksheet.addRow({
      displayName: user.displayName || 'غير محدد',
      role: user.role === 'artist' ? 'فنان' : 'عميل',
      email: user.email,
      status: user.isActive ? 'نشط' : 'محظور',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'
    });

    // تطبيق الأنماط على الصف - صفوف متناوبة
    row.eachCell((cell, colNumber) => {
      // تطبيق نمط الصف الزوجي أو الفردي
      const isEvenRow = (index + 1) % 2 === 0;
      cell.style = isEvenRow ? styles.dataEven : styles.data;

      // تنسيق خاص للحقول
      if (colNumber === 2) { // النوع
        cell.style = user.role === 'artist' ? styles.roleArtist : styles.roleUser;
      } else if (colNumber === 4) { // الحالة
        cell.style = user.isActive ? styles.statusActive : styles.statusInactive;
      }
    });
  });

  // إنشاء الملف كـ Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * إنشاء ملف Excel للتقارير المتقدمة
 * @param {Array} users - قائمة المستخدمين
 * @param {Object} filters - الفلاتر المطبقة
 * @returns {Promise<Buffer>} ملف Excel كـ Buffer
 */
export const generateAdvancedUsersReport = async (users, filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  
  // ورقة المستخدمين الأساسية
  const usersSheet = workbook.addWorksheet('المستخدمين', {
    views: [{ rightToLeft: true }]
  });

  // ورقة الإحصائيات
  const statsSheet = workbook.addWorksheet('الإحصائيات', {
    views: [{ rightToLeft: true }]
  });

  // ورقة التحليل
  const analysisSheet = workbook.addWorksheet('التحليل', {
    views: [{ rightToLeft: true }]
  });

  // ألوان التطبيق
  const colors = {
    primary: '4A90E2',
    secondary: 'F5A623',
    success: '7ED321',
    danger: 'D0021B',
    warning: 'F8E71C',
    info: '9013FE',
    light: 'F8F9FA',
    dark: '2C3E50'
  };

  // إنشاء ورقة المستخدمين
  await generateUsersExcel(users, { worksheet: usersSheet });

  // إنشاء ورقة الإحصائيات
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    artists: users.filter(u => u.role === 'artist').length,
    clients: users.filter(u => u.role === 'user').length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified).length
  };

  // إضافة الإحصائيات
  statsSheet.addRow(['إحصائيات شاملة للمستخدمين']);
  statsSheet.addRow(['إجمالي المستخدمين', stats.total]);
  statsSheet.addRow(['المستخدمين النشطين', stats.active]);
  statsSheet.addRow(['المستخدمين المحظورين', stats.inactive]);
  statsSheet.addRow(['الفنانين', stats.artists]);
  statsSheet.addRow(['العملاء', stats.clients]);
  statsSheet.addRow(['المستخدمين المفعلين', stats.verified]);
  statsSheet.addRow(['المستخدمين غير المفعلين', stats.unverified]);

  // إنشاء ورقة التحليل
  analysisSheet.addRow(['تحليل المستخدمين']);
  analysisSheet.addRow(['نسبة النشاط', `${((stats.active / stats.total) * 100).toFixed(1)}%`]);
  analysisSheet.addRow(['نسبة الفنانين', `${((stats.artists / stats.total) * 100).toFixed(1)}%`]);
  analysisSheet.addRow(['نسبة العملاء', `${((stats.clients / stats.total) * 100).toFixed(1)}%`]);
  analysisSheet.addRow(['نسبة التفعيل', `${((stats.verified / stats.total) * 100).toFixed(1)}%`]);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export default {
  generateUsersExcel,
  generateAdvancedUsersReport
}; 