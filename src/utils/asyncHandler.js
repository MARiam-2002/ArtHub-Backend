export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (!res.headersSent) {
        next(error); 
      } else {
        console.error("تم إرسال الاستجابة بالفعل، ولا يمكن إرسال رد جديد.");
      }
    });
  };
};

export const globalErrorHandling = (error, req, res, next) => {
  if (!res.headersSent) {
    const statusCode = error.cause || error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "حدث خطأ غير متوقع في الخادم.",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } else {
    console.error("تم إرسال الاستجابة بالفعل، ولا يمكن إرسال رد جديد.");
    next(error);
  }
};
