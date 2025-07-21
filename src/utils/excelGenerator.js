import ExcelJS from 'exceljs';

/**
 * إنشاء ملف Excel جميل لتصدير بيانات المستخدمين
 * @param {Array} users - قائمة المستخدمين
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Buffer>} ملف Excel كـ Buffer
 */
export const generateUsersExcel = async (users, options = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('المستخدمين', {
    views: [{ rightToLeft: true }] // دعم اللغة العربية
  });

  // تعريف ألوان التطبيق
  const colors = {
    primary: '4A90E2',      // أزرق فاتح
    secondary: 'F5A623',    // برتقالي
    success: '7ED321',      // أخضر
    danger: 'D0021B',       // أحمر
    warning: 'F8E71C',      // أصفر
    info: '9013FE',         // بنفسجي
    light: 'F8F9FA',        // رمادي فاتح
    dark: '2C3E50',         // رمادي داكن
    white: 'FFFFFF',
    border: 'E1E8ED'
  };

  // تعريف الأنماط
  const styles = {
    header: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
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
    data: {
      font: {
        name: 'Arial',
        size: 11
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
      }
    },
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
      }
    },
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
      }
    },
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
      }
    }
  };

  // تعريف الأعمدة
  const columns = [
    { header: 'الرقم', key: 'index', width: 8 },
    { header: 'الاسم', key: 'displayName', width: 25 },
    { header: 'البريد الإلكتروني', key: 'email', width: 30 },
    { header: 'رقم الهاتف', key: 'phoneNumber', width: 15 },
    { header: 'النوع', key: 'role', width: 12 },
    { header: 'الحالة', key: 'status', width: 12 },
    { header: 'مفعل', key: 'isVerified', width: 10 },
    { header: 'تاريخ الانضمام', key: 'createdAt', width: 15 },
    { header: 'آخر نشاط', key: 'lastActive', width: 15 },
    { header: 'الوظيفة', key: 'job', width: 15 },
    { header: 'الموقع', key: 'location', width: 20 },
    { header: 'النبذة', key: 'bio', width: 30 }
  ];

  // إضافة الأعمدة
  worksheet.columns = columns;

  // تنسيق رأس الجدول
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = styles.header;
  });

  // إضافة البيانات
  users.forEach((user, index) => {
    const row = worksheet.addRow({
      index: index + 1,
      displayName: user.displayName || 'غير محدد',
      email: user.email,
      phoneNumber: user.phoneNumber || 'غير محدد',
      role: user.role === 'artist' ? 'فنان' : 'عميل',
      status: user.isActive ? 'نشط' : 'محظور',
      isVerified: user.isVerified ? 'نعم' : 'لا',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : 'غير محدد',
      lastActive: user.lastActive ? new Date(user.lastActive).toLocaleDateString('ar-EG') : 'غير محدد',
      job: user.job || 'غير محدد',
      location: user.location || 'غير محدد',
      bio: user.bio || 'غير محدد'
    });

    // تطبيق الأنماط على الصف
    row.eachCell((cell, colNumber) => {
      cell.style = styles.data;

      // تنسيق خاص للحقول
      if (colNumber === 5) { // النوع
        cell.style = user.role === 'artist' ? styles.roleArtist : styles.roleUser;
      } else if (colNumber === 6) { // الحالة
        cell.style = user.isActive ? styles.statusActive : styles.statusInactive;
      } else if (colNumber === 7) { // مفعل
        cell.style = user.isVerified ? styles.statusActive : styles.statusInactive;
      }
    });
  });

  // إضافة إحصائيات في نهاية الملف
  const statsRow = worksheet.addRow([]);
  const statsRow2 = worksheet.addRow([]);
  
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const artists = users.filter(u => u.role === 'artist').length;
  const clients = users.filter(u => u.role === 'user').length;
  const verifiedUsers = users.filter(u => u.isVerified).length;

  // إضافة الإحصائيات
  worksheet.addRow(['إحصائيات المستخدمين', '', '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['إجمالي المستخدمين', totalUsers, '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['المستخدمين النشطين', activeUsers, '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['الفنانين', artists, '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['العملاء', clients, '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['المستخدمين المفعلين', verifiedUsers, '', '', '', '', '', '', '', '', '', '']);

  // تنسيق صفوف الإحصائيات
  for (let i = statsRow.number; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.eachCell((cell) => {
      cell.style = {
        ...styles.data,
        font: {
          name: 'Arial',
          size: 11,
          bold: i === statsRow.number + 1 // جعل العنوان عريض
        }
      };
    });
  }

  // إضافة معلومات إضافية
  const infoRow = worksheet.addRow([]);
  worksheet.addRow(['تم إنشاء هذا الملف بواسطة', 'ArtHub Admin Dashboard', '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['تاريخ التصدير', new Date().toLocaleDateString('ar-EG'), '', '', '', '', '', '', '', '', '', '']);
  worksheet.addRow(['وقت التصدير', new Date().toLocaleTimeString('ar-EG'), '', '', '', '', '', '', '', '', '', '']);

  // تنسيق صفوف المعلومات
  for (let i = infoRow.number + 1; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.eachCell((cell) => {
      cell.style = {
        ...styles.data,
        font: {
          name: 'Arial',
          size: 10,
          italic: true
        }
      };
    });
  }

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