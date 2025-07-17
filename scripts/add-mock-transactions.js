import mongoose from 'mongoose';
import transactionModel from '../DB/models/transaction.model.js';
import userModel from '../DB/models/user.model.js';
import artworkModel from '../DB/models/artwork.model.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // استخدام نفس إعدادات الاتصال التي يستخدمها المشروع
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

async function addMockTransactions() {
  try {
    await connectDB();

    // جلب المستخدمين والفنانين
    const users = await userModel.find({ role: 'user', isDeleted: false }).limit(20);
    const artists = await userModel.find({ role: 'artist', isDeleted: false }).limit(10);
    
    if (users.length === 0 || artists.length === 0) {
      console.log('❌ No users or artists found. Please add users first.');
      return;
    }

    console.log(`📊 Found ${users.length} users and ${artists.length} artists`);

    // إنشاء أعمال فنية للفنانين
    const artworks = [];
    for (const artist of artists) {
      const artistArtworks = [];
      for (let i = 0; i < 3; i++) {
        const artwork = new artworkModel({
          title: `عمل فني ${i + 1} - ${artist.displayName}`,
          description: `وصف العمل الفني ${i + 1}`,
          artist: artist._id,
          category: new mongoose.Types.ObjectId(), // إنشاء ObjectId جديد
          price: Math.floor(Math.random() * 1000) + 500,
          image: 'https://example.com/artwork.jpg',
          images: ['https://example.com/artwork1.jpg', 'https://example.com/artwork2.jpg'],
          isAvailable: true
        });
        const savedArtwork = await artwork.save();
        artistArtworks.push(savedArtwork);
      }
      artworks.push(...artistArtworks);
    }

    console.log(`🎨 Created ${artworks.length} artworks`);

    // إنشاء معاملات للشهور الـ 12 الماضية
    const transactions = [];
    const statuses = ['pending', 'processing', 'confirmed', 'completed', 'cancelled'];
    const currentDate = new Date();

    for (let month = 11; month >= 0; month--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - month, 1);
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      
      // عدد المعاملات لكل شهر (متغير)
      const transactionsPerMonth = Math.floor(Math.random() * 50) + 20; // 20-70 معاملة
      
      for (let i = 0; i < transactionsPerMonth; i++) {
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const transactionDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), randomDay);
        
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomArtwork = artworks[Math.floor(Math.random() * artworks.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const basePrice = randomArtwork.price;
        const quantity = Math.floor(Math.random() * 3) + 1;
        const subtotal = basePrice * quantity;
        const netAmount = subtotal; // بدون خصم
        const totalAmount = subtotal; // بدون ضريبة
        const transactionNumber = `TRX-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        
        const transaction = new transactionModel({
          user: randomUser._id,
          artwork: randomArtwork._id,
          artist: randomArtwork.artist,
          seller: randomArtwork.artist,
          buyer: randomUser._id,
          status: randomStatus,
          transactionNumber,
          pricing: {
            basePrice: basePrice,
            quantity: quantity,
            subtotal: subtotal,
            netAmount: netAmount,
            totalAmount: totalAmount
          },
          description: `طلب ${i + 1} للشهر ${month + 1}`,
          createdAt: transactionDate,
          updatedAt: transactionDate
        });
        
        transactions.push(transaction);
      }
    }

    // حفظ المعاملات
    const savedTransactions = await transactionModel.insertMany(transactions);
    console.log(`💰 Created ${savedTransactions.length} transactions`);

    // عرض إحصائيات سريعة
    const totalRevenue = await transactionModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]);

    const monthlyStats = await transactionModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('\n📈 Quick Statistics:');
    console.log(`Total Revenue: ${totalRevenue[0]?.total || 0} SAR`);
    console.log(`Total Transactions: ${savedTransactions.length}`);
    console.log('\nMonthly Breakdown:');
    monthlyStats.forEach(stat => {
      console.log(`${stat._id.year}-${stat._id.month}: ${stat.count} orders, ${stat.revenue} SAR`);
    });

    console.log('\n✅ Mock transactions added successfully!');
    console.log('🎯 You can now test the dashboard charts with real data.');

  } catch (error) {
    console.error('❌ Error adding mock transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// تشغيل السكريبت
addMockTransactions(); 