import bcryptjs from 'bcryptjs';

async function generatePasswordHash() {
  try {
    // كلمة المرور المطلوبة
    const password = '123456789';
    
    // توليد hash
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    console.log('🔐 كلمة المرور:', password);
    console.log('🔒 كلمة المرور المشفرة:', hashedPassword);
    
    // التحقق من صحة الكلمة المرور
    const isValid = await bcryptjs.compare(password, hashedPassword);
    console.log('✅ التحقق من صحة كلمة المرور:', isValid);
    
    // مقارنة مع الكلمة المرور القديمة
    const oldHash = '$2b$12$ng.3VHiysSWnZWlExEAxhOxkV8ho72BorJ7uxeFUJhpFlBFC2Vy..';
    console.log('🔍 الكلمة المرور القديمة المشفرة:', oldHash);
    
    // التحقق من كلمة مرور معروفة
    const testPasswords = ['123456789', 'password', 'admin', '123456', 'password123'];
    
    console.log('\n🔍 اختبار الكلمات المرور المعروفة:');
    for (const testPassword of testPasswords) {
      const isValidOld = await bcryptjs.compare(testPassword, oldHash);
      if (isValidOld) {
        console.log(`✅ تم العثور على كلمة المرور: ${testPassword}`);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

generatePasswordHash(); 