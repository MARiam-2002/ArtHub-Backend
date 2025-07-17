import mongoose from 'mongoose';
import specialRequestModel from '../DB/models/specialRequest.model.js';
import userModel from '../DB/models/user.model.js';
import categoryModel from '../DB/models/category.model.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const connectionUrl = process.env.CONNECTION_URL || 'mongodb://localhost:27017/arthub';
    console.log('🔄 Connecting to MongoDB...');
    console.log('📡 Connection URL pattern:', connectionUrl.split('@')[1]?.split('/')[0] || 'local');
    
    await mongoose.connect(connectionUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 20000
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('💡 Make sure MongoDB is running and CONNECTION_URL is set correctly');
    process.exit(1);
  }
};

async function addMockOrders() {
  try {
    await connectDB();

    // جلب المستخدمين والفنانين
    const users = await userModel.find({ role: 'user', isDeleted: false }).limit(20);
    const artists = await userModel.find({ role: 'artist', isDeleted: false }).limit(10);
    const categories = await categoryModel.find({}).limit(5);
    
    if (users.length === 0 || artists.length === 0) {
      console.log('❌ No users or artists found. Please add users first.');
      return;
    }

    console.log(`📊 Found ${users.length} users and ${artists.length} artists`);

    // بيانات الطلبات بناءً على الصورة
    const orderData = [
      {
        title: 'لوحة زيتية مخصصة',
        description: 'لوحة زيتية مخصصة بألوان دافئة ومنظر طبيعي هادئ',
        requestType: 'custom_artwork',
        budget: 850,
        status: 'completed',
        priority: 'medium'
      },
      {
        title: 'لوحة مائية حديثة',
        description: 'لوحة مائية بتقنيات حديثة وألوان متدرجة',
        requestType: 'traditional_art',
        budget: 1180,
        status: 'completed',
        priority: 'high'
      },
      {
        title: 'رسم بالفحم لمنظر طبيعي',
        description: 'رسم بالفحم لمنظر طبيعي جبلي مع تفاصيل دقيقة',
        requestType: 'traditional_art',
        budget: 990,
        status: 'rejected',
        priority: 'low'
      },
      {
        title: 'بورتريه كلاسيكي',
        description: 'بورتريه كلاسيكي بأسلوب واقعي وتفاصيل دقيقة',
        requestType: 'portrait',
        budget: 1250,
        status: 'completed',
        priority: 'high'
      },
      {
        title: 'لوحة تجريدية ملونة',
        description: 'لوحة تجريدية بألوان حيوية وتكوين متميز',
        requestType: 'custom_artwork',
        budget: 1075,
        status: 'in_progress',
        priority: 'medium'
      },
      {
        title: 'رسم رقمي لمدينة',
        description: 'رسم رقمي لمدينة خيالية بتقنيات حديثة',
        requestType: 'digital_art',
        budget: 890,
        status: 'completed',
        priority: 'low'
      },
      {
        title: 'منظر بحري هادئ',
        description: 'منظر بحري هادئ مع أمواج متدرجة وألوان هادئة',
        requestType: 'custom_artwork',
        budget: 1130,
        status: 'in_progress',
        priority: 'medium'
      },
      {
        title: 'لوحة بانورامية للصحراء',
        description: 'لوحة بانورامية للصحراء مع غروب الشمس',
        requestType: 'custom_artwork',
        budget: 960,
        status: 'pending',
        priority: 'low'
      },
      {
        title: 'لوحة بألوان الباستيل',
        description: 'لوحة بألوان الباستيل الناعمة ومنظر رومانسي',
        requestType: 'traditional_art',
        budget: 780,
        status: 'completed',
        priority: 'medium'
      },
      {
        title: 'رسم تعبيري بالحبر',
        description: 'رسم تعبيري بالحبر الصيني مع خطوط ديناميكية',
        requestType: 'traditional_art',
        budget: 1040,
        status: 'review',
        priority: 'high'
      },
      {
        title: 'لوحة بورتريه عصري',
        description: 'لوحة بورتريه بأسلوب عصري وألوان جريئة',
        requestType: 'portrait',
        budget: 1150,
        status: 'completed',
        priority: 'high'
      },
      {
        title: 'منظر جبلي هادئ',
        description: 'منظر جبلي هادئ مع ضباب خفيف وألوان طبيعية',
        requestType: 'custom_artwork',
        budget: 990,
        status: 'in_progress',
        priority: 'medium'
      },
      {
        title: 'لوحة خيالية ساحرة',
        description: 'لوحة خيالية ساحرة بعالم من الخيال والألوان السحرية',
        requestType: 'custom_artwork',
        budget: 1220,
        status: 'completed',
        priority: 'urgent'
      }
    ];

    // أسماء الفنانين من الصورة
    const artistNames = [
      'أحمد محمد',
      'عمر خالد', 
      'ليلى علي',
      'سارة محمود',
      'محمود حسن',
      'نورا إبراهيم',
      'كريم مصطفى',
      'هدى عصام',
      'ياسر أحمد',
      'أميرة سامي',
      'حسن علاء',
      'نجلاء عبد الحليم',
      'رامي السيد'
    ];

    // أسماء العملاء من الصورة
    const customerNames = [
      'منى سالم',
      'ياسر فؤاد',
      'هدى إبراهيم',
      'زياد محسن',
      'ريهام عبد الله',
      'عماد مصطفى',
      'مروان خليل',
      'شهد مجدي',
      'نهي طارق',
      'سليم حسن',
      'أحمد يونس',
      'مها جمال',
      'فاطمة حسين'
    ];

    // تواريخ الطلبات من الصورة
    const orderDates = [
      '2025-01-18',
      '2024-11-10',
      '2025-02-05',
      '2025-03-22',
      '2025-04-17',
      '2025-05-09',
      '2025-06-01',
      '2025-06-12',
      '2025-06-28',
      '2025-07-05',
      '2025-07-19',
      '2025-07-30',
      '2025-08-09'
    ];

    // إنشاء الطلبات
    const orders = [];
    
    for (let i = 0; i < orderData.length; i++) {
      const orderInfo = orderData[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomArtist = artists[Math.floor(Math.random() * artists.length)];
      const randomCategory = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)] : null;
      
      // تحديث أسماء المستخدمين لتناسب البيانات
      if (i < artistNames.length) {
        randomArtist.displayName = artistNames[i];
      }
      if (i < customerNames.length) {
        randomUser.displayName = customerNames[i];
      }

      const order = new specialRequestModel({
        sender: randomUser._id,
        artist: randomArtist._id,
        requestType: orderInfo.requestType,
        title: orderInfo.title,
        description: orderInfo.description,
        budget: orderInfo.budget,
        currency: 'SAR',
        status: orderInfo.status,
        priority: orderInfo.priority,
        category: randomCategory?._id,
        tags: ['فن', 'إبداع', 'مخصص'],
        response: orderInfo.status === 'completed' ? 'تم إكمال العمل بنجاح' : null,
        deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // 30 يوم من الآن
        estimatedDelivery: orderInfo.status === 'completed' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null,
        currentProgress: orderInfo.status === 'completed' ? 100 : 
                       orderInfo.status === 'in_progress' ? Math.floor(Math.random() * 80) + 20 :
                       orderInfo.status === 'review' ? 90 : 0,
        usedRevisions: Math.floor(Math.random() * 3),
        maxRevisions: 3,
        allowRevisions: true,
        isPrivate: false,
        attachments: [
          {
            url: 'https://example.com/reference1.jpg',
            type: 'image',
            name: 'صورة مرجعية',
            description: 'صورة مرجعية للعمل المطلوب'
          }
        ],
        specifications: {
          dimensions: {
            width: 60,
            height: 80,
            unit: 'cm'
          },
          format: 'print',
          resolution: 300,
          colorMode: 'RGB',
          fileFormat: ['JPG', 'PNG']
        },
        communicationPreferences: {
          preferredMethod: 'chat',
          timezone: 'Asia/Riyadh',
          availableHours: {
            start: '09:00',
            end: '18:00'
          },
          language: 'ar'
        },
        createdAt: new Date(orderDates[i] || Date.now()),
        updatedAt: new Date(orderDates[i] || Date.now())
      });

      // تحديث التواريخ حسب الحالة
      if (orderInfo.status === 'completed') {
        order.completedAt = new Date(order.createdAt.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000);
        order.acceptedAt = new Date(order.createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
        order.startedAt = new Date(order.acceptedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
      } else if (orderInfo.status === 'in_progress') {
        order.acceptedAt = new Date(order.createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
        order.startedAt = new Date(order.acceptedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
      } else if (orderInfo.status === 'rejected') {
        order.rejectedAt = new Date(order.createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
      }

      orders.push(order);
    }

    // حفظ الطلبات
    const savedOrders = await specialRequestModel.insertMany(orders);
    console.log(`💰 Created ${savedOrders.length} orders`);

    // عرض إحصائيات سريعة
    const totalRevenue = await specialRequestModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);

    const statusStats = await specialRequestModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$budget' }
        }
      }
    ]);

    console.log('\n📈 Quick Statistics:');
    console.log(`Total Revenue: ${totalRevenue[0]?.total || 0} SAR`);
    console.log(`Total Orders: ${savedOrders.length}`);
    console.log('\nStatus Breakdown:');
    statusStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} orders, ${stat.revenue} SAR`);
    });

    console.log('\n✅ Mock orders added successfully!');
    console.log('🎯 You can now test the order management dashboard with real data.');

  } catch (error) {
    console.error('❌ Error adding mock orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// تشغيل السكريبت
addMockOrders(); 