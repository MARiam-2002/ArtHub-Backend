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
    try {
      // التحقق من وجود file و mimetype
      if (!file) {
        return cb(new Error('No file provided'), false);
      }
      
      if (!file.mimetype) {
        return cb(new Error('File mimetype is missing'), false);
      }
      
      if (!filterArray || !Array.isArray(filterArray)) {
        return cb(new Error('Invalid filter array'), false);
      }
      
      if (!filterArray.includes(file.mimetype)) {
        return cb(new Error(`Invalid file format. Allowed types: ${filterArray.join(', ')}`), false);
      }
      
      return cb(null, true);
    } catch (error) {
      return cb(new Error(`File validation error: ${error.message}`), false);
    }
  };

  return multer({ 
    storage: diskStorage({}), 
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
      files: 1
    }
  });
};
