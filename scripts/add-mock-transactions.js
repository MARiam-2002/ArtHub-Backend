import mongoose from 'mongoose';
import { connectDB } from '../DB/connection.js';
import userModel from '../DB/models/user.model.js';
import specialRequestModel from '../DB/models/specialRequest.model.js';
import categoryModel from '../DB/models/category.model.js';

async function addMockSpecialRequests() {
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

    // إنشاء طلبات خاصة للشهور الـ 12 الماضية
    const specialRequests = [];
    const requestTypes = [
      'custom_artwork', 'portrait', 'logo_design', 'illustration', 
      'digital_art', 'traditional_art', 'animation', 'graphic_design'
    ];
    const currentDate = new Date();

    for (let month = 11; month >= 0; month--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - month, 1);
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      
      // عدد الطلبات لكل شهر (متغير)
      const requestsPerMonth = Math.floor(Math.random() * 30) + 15; // 15-45 طلب
      
      for (let i = 0; i < requestsPerMonth; i++) {
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const requestDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), randomDay);
        
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomArtist = artists[Math.floor(Math.random() * artists.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomRequestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
        
        const budget = Math.floor(Math.random() * 2000) + 500; // 500-2500 ريال
        const quotedPrice = budget + Math.floor(Math.random() * 500); // سعر مقتبس أعلى قليلاً
        const finalPrice = quotedPrice; // السعر النهائي
        
        const specialRequest = new specialRequestModel({
          sender: randomUser._id,
          artist: randomArtist._id,
          requestType: randomRequestType,
          title: `طلب ${randomRequestType} ${i + 1}`,
          description: `وصف تفصيلي للطلب ${i + 1} في الشهر ${month + 1}`,
          budget: budget,
          currency: 'SAR',
          quotedPrice: quotedPrice,
          finalPrice: finalPrice,
          status: 'completed', // جميع الطلبات مكتملة
          priority: Math.random() > 0.7 ? 'high' : 'medium',
          category: randomCategory._id,
          duration: Math.floor(Math.random() * 14) + 7, // 7-21 يوم
          currentProgress: 100,
          completedAt: new Date(requestDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // إكمال خلال 30 يوم
          acceptedAt: new Date(requestDate.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // قبول خلال أسبوع
          createdAt: requestDate,
          updatedAt: requestDate
        });
        
        specialRequests.push(specialRequest);
      }
    }

    // حفظ الطلبات الخاصة
    const savedRequests = await specialRequestModel.insertMany(specialRequests);
    console.log(`💰 Created ${savedRequests.length} completed special requests`);

    // عرض إحصائيات سريعة
    const totalRevenue = await specialRequestModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } } } }
    ]);

    const monthlyStats = await specialRequestModel.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const topArtists = await specialRequestModel.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'artist',
          foreignField: '_id',
          as: 'artistData'
        }
      },
      {
        $group: {
          _id: '$artist',
          totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
          orderCount: { $sum: 1 },
          artistName: { $first: { $arrayElemAt: ['$artistData.displayName', 0] } }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 5
      }
    ]);

    console.log('\n📈 Quick Statistics:');
    console.log(`Total Revenue: ${totalRevenue[0]?.total || 0} SAR`);
    console.log(`Total Completed Requests: ${savedRequests.length}`);
    console.log('\nMonthly Breakdown:');
    monthlyStats.forEach(stat => {
      console.log(`${stat._id.year}-${stat._id.month}: ${stat.count} requests, ${stat.revenue} SAR`);
    });

    console.log('\n🏆 Top Artists:');
    topArtists.forEach((artist, index) => {
      console.log(`${index + 1}. ${artist.artistName}: ${artist.totalSales} SAR (${artist.orderCount} requests)`);
    });

    console.log('\n✅ Mock special requests added successfully!');
    console.log('🎯 You can now test the dashboard sales analytics with real data.');

  } catch (error) {
    console.error('❌ Error adding mock special requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// تشغيل السكريبت
addMockSpecialRequests(); 