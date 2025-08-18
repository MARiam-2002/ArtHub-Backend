import schedule from 'node-schedule';
import { cleanupInvalidFCMTokens } from './pushNotifications.js';
import { logger } from './logger.js';

/**
 * تهيئة المهام المجدولة للتطبيق
 * يتم استدعاء هذه الدالة عند بدء تشغيل الخادم
 */
export const initScheduledJobs = () => {
  // جدولة تنظيف رموز FCM الفاشلة كل 24 ساعة في الساعة 3 صباحاً
  // استخدام صيغة cron: "0 3 * * *" تعني: في الدقيقة 0، الساعة 3، كل يوم
  const cleanupTokensJob = schedule.scheduleJob('0 3 * * *', async () => {
    try {
      logger.info('بدء مهمة تنظيف رموز FCM الفاشلة');
      const result = await cleanupInvalidFCMTokens();
      logger.info(`اكتملت مهمة تنظيف رموز FCM الفاشلة: ${JSON.stringify(result)}`);
    } catch (error) {
      logger.error(`فشل في تنفيذ مهمة تنظيف رموز FCM الفاشلة: ${error.message}`, { error });
    }
  });

  // يمكن إضافة مهام مجدولة أخرى هنا

  logger.info('تم تهيئة جميع المهام المجدولة بنجاح');

  return {
    cleanupTokensJob,
    // إضافة مراجع لمهام أخرى هنا
  };
};

/**
 * إيقاف جميع المهام المجدولة
 * يمكن استدعاء هذه الدالة عند إيقاف الخادم بشكل آمن
 */
export const stopScheduledJobs = (jobs) => {
  if (jobs?.cleanupTokensJob) {
    jobs.cleanupTokensJob.cancel();
    logger.info('تم إيقاف مهمة تنظيف رموز FCM الفاشلة');
  }

  // إيقاف مهام أخرى هنا

  logger.info('تم إيقاف جميع المهام المجدولة');
};