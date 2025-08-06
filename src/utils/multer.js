import multer, { diskStorage } from 'multer';

export const filterObject = {
  // الصور
  image: [
    'image/png', 
    'image/jpeg', 
    'image/jpg', 
    'image/gif', 
    'image/webp', 
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ],
  
  // المستندات
  document: [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain', // .txt
    'text/csv', // .csv
    'application/rtf' // .rtf
  ],
  
  // الفيديوهات
  video: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-ms-wmv', // .wmv
    'video/webm',
    'video/ogg',
    'video/3gpp', // .3gp
    'video/x-flv' // .flv
  ],
  
  // الصوت
  audio: [
    'audio/mpeg', // .mp3
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/webm'
  ],
  
  // الملفات المضغوطة
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar'
  ],
  
  // ملفات البرمجة
  code: [
    'text/javascript',
    'application/json',
    'text/xml',
    'text/html',
    'text/css',
    'application/x-python-code',
    'text/x-java-source'
  ]
};

export const fileUpload = filterArray => {
  const fileFilter = (req, file, cb) => {
    console.log('🔍 File filter checking:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    // التحقق من امتداد الملف أيضاً
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    
    // التحقق من الـ mimetype
    const isValidMimeType = filterArray.includes(file.mimetype);
    
    // التحقق من امتداد الملف
    const isValidExtension = validExtensions.includes(fileExtension);
    
    console.log('📊 Validation results:', {
      isValidMimeType,
      isValidExtension,
      fileExtension,
      mimetype: file.mimetype
    });
    
    // قبول الملف إذا كان الـ mimetype صحيح أو امتداد الملف صحيح
    if (isValidMimeType || isValidExtension) {
      console.log('✅ File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('❌ File rejected:', file.originalname);
      return cb(new Error(`نوع الملف غير مدعوم: ${file.originalname}`), false);
    }
  };

  return multer({ 
    storage: diskStorage({}), 
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5 // 5 files max
    }
  });
};
