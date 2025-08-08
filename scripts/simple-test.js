console.log('🚀 بدء الاختبار...');

// محاكاة اختبار السرعة
const startTime = Date.now();

// محاكاة إرسال إشعار
setTimeout(() => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`📊 النتائج:`);
  console.log(`   ⏱️  الوقت: ${duration}ms`);
  
  if (duration < 1000) {
    console.log(`   🚀 ممتاز! سرعة عالية`);
  } else if (duration < 3000) {
    console.log(`   ✅ جيد! سرعة مقبولة`);
  } else {
    console.log(`   ⚠️  بطيء! يحتاج تحسين`);
  }
  
  console.log('\n🏁 انتهى الاختبار');
}, 500);
