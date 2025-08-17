import joi from 'joi';

// MongoDB ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// General field definitions
const generalFields = {
  id: joi.string().pattern(objectIdPattern).messages({
    'string.pattern.base': 'معرف غير صالح'
  })
};

// Validation for charts query parameters
export const getChartsValidation = {
  query: joi.object({
    period: joi.string().valid('1month', '3months', '6months', '9months', '12months').default('12months').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 1month, 3months, 6months, 9months, أو 12months'
    })
  }).optional()
};

// Validation for artists performance query parameters
export const getArtistsPerformanceValidation = {
  query: joi.object({
    limit: joi.number().integer().min(1).max(20).default(3).messages({
      'number.min': 'عدد الفنانين يجب أن يكون 1 على الأقل',
      'number.max': 'عدد الفنانين يجب أن يكون 20 كحد أقصى'
    }),
    period: joi.string().valid('1week', '1month', '3months', '6months', '1year').default('1month').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 1week, 1month, 3months, 6months, أو 1year'
    })
  }).optional()
};

// Validation for sales analytics query parameters
export const getSalesAnalyticsValidation = {
  query: joi.object({
    period: joi.string().valid('7days', '30days', '90days', '1year').default('30days').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 7days, 30days, 90days, أو 1year'
    })
  }).optional()
};

// Validation for sales trends query parameters
export const getSalesTrendsValidation = {
  query: joi.object({
    period: joi.string().valid('1month', '3months', '6months', '9months', '12months').default('12months').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 1month, 3months, 6months, 9months, أو 12months'
    })
  }).optional()
};

// Validation for top selling artists query parameters
export const getTopSellingArtistsValidation = {
  query: joi.object({
    limit: joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'عدد الفنانين يجب أن يكون 1 على الأقل',
      'number.max': 'عدد الفنانين يجب أن يكون 100 كحد أقصى'
    }),
    page: joi.number().integer().min(1).default(1).messages({
      'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
    }),
    year: joi.number().integer().min(1900).max(2100).messages({
      'number.min': 'السنة يجب أن تكون 1900 أو أحدث',
      'number.max': 'السنة يجب أن تكون 2100 أو أقل'
    }),
    month: joi.number().integer().min(1).max(12).messages({
      'number.min': 'الشهر يجب أن يكون 1 على الأقل',
      'number.max': 'الشهر يجب أن يكون 12 كحد أقصى'
    })
  }).optional()
};

// Validation for sales report query parameters
export const downloadSalesReportValidation = {
  query: joi.object({
    period: joi.string().valid('7days', '30days', '90days', '1year').default('30days').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 7days, 30days, 90days, أو 1year'
    }),
    format: joi.string().valid('json', 'csv').default('json').messages({
      'any.only': 'صيغة التقرير يجب أن تكون json أو csv'
    })
  }).optional()
};

// Validation for comprehensive sales analysis query parameters
export const getComprehensiveSalesAnalysisValidation = {
  query: joi.object({
    year: joi.number().integer().min(2020).max(2030).messages({
      'number.min': 'السنة يجب أن تكون 2020 أو أحدث',
      'number.max': 'السنة يجب أن تكون 2030 أو أقل'
    })
  }).optional()
}; 