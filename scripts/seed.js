import { fakerAR, faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import chalk from 'chalk';
import { connectDB } from '../DB/connection.js';
import userModel from '../DB/models/user.model.js';
import categoryModel from '../DB/models/category.model.js';
import artworkModel from '../DB/models/artwork.model.js';
import reviewModel from '../DB/models/review.model.js';
import followModel from '../DB/models/follow.model.js';
import transactionModel from '../DB/models/transaction.model.js';
import notificationModel from '../DB/models/notification.model.js';
import specialRequestModel from '../DB/models/specialRequest.model.js';
import reportModel from '../DB/models/report.model.js';
// import imageModel from '../DB/models/image.model.js';
import chatModel from '../DB/models/chat.model.js';
import messageModel from '../DB/models/message.model.js';
import tokenModel from '../DB/models/token.model.js';

// إعدادات البيانات
const COUNTS = {
  REGULAR_USERS: 50,
  ARTISTS: 25,
  ADMINS: 3,
  CATEGORIES: 12,
  ARTWORKS: 100,
  IMAGES: 150,
  REVIEWS: 80,
  FOLLOWS: 120,
  TRANSACTIONS: 60,
  SPECIAL_REQUESTS: 30,
  REPORTS: 15,
  CHATS: 40,
  MESSAGES: 200,
  NOTIFICATIONS: 100
};

// بيانات ثابتة للفئات الفنية
const ART_CATEGORIES = [
  { name: 'الرسم الزيتي', description: 'لوحات مرسومة بالألوان الزيتية' },
  { name: 'الرسم المائي', description: 'أعمال فنية بالألوان المائية' },
  { name: 'فن النحت', description: 'منحوتات ثلاثية الأبعاد' },
  { name: 'التصوير الفوتوغرافي', description: 'صور فوتوغرافية احترافية' },
  { name: 'الفن الرقمي', description: 'أعمال فنية رقمية ومعاصرة' },
  { name: 'الخط العربي', description: 'فن الخط العربي التقليدي والمعاصر' },
  { name: 'فن الخزف', description: 'قطع خزفية وفخارية' },
  { name: 'الفن التجريدي', description: 'لوحات تجريدية معاصرة' },
  { name: 'الرسم بالفحم', description: 'رسومات بالفحم والقلم الرصاص' },
  { name: 'فن الكولاج', description: 'أعمال فنية مركبة ومختلطة' },
  { name: 'النقش والحفر', description: 'أعمال النقش على المعادن والخشب' },
  { name: 'فن الزجاج', description: 'قطع فنية من الزجاج الملون' }
];

// أسماء عربية للمستخدمين
const ARABIC_NAMES = [
  'أحمد محمد الفنان', 'فاطمة علي الرسامة', 'محمد عبدالله النحات', 'عائشة حسن المصورة',
  'علي أحمد الخطاط', 'زينب محمد الفنانة', 'عمر سالم الرسام', 'مريم عبدالرحمن',
  'يوسف إبراهيم', 'خديجة عثمان', 'حسام الدين طارق', 'نورا أحمد الفنانة',
  'طارق محمود النحات', 'سارة عبدالله', 'كريم حسام الرسام', 'ليلى محمد الخطاطة',
  'وليد عبدالعزيز', 'رنا سليم الفنانة', 'ماجد عبدالله المصور', 'هدى إبراهيم',
  'سعد محمد الفنان', 'آية عثمان الرسامة', 'محمود أحمد النحات', 'رقية حسن',
  'عبدالرحمن محمد', 'إيمان علي الفنانة', 'خالد سالم الرسام', 'نهى عبدالله',
  'بدر الدين أحمد', 'سلمى محمود الخطاطة'
];

// عناوين للأعمال الفنية
const ARTWORK_TITLES = [
  'غروب الشمس فوق النيل', 'زهور الربيع الملونة', 'وجه امرأة تراثية', 'منظر طبيعي صحراوي',
  'الخط العربي الجميل', 'تجريد معاصر بألوان زاهية', 'منحوتة الحرية', 'صورة شخصية كلاسيكية',
  'لوحة البحر الهادئ', 'فن الكولاج الحديث', 'نقش إسلامي تقليدي', 'زجاج ملون فني',
  'رسم بالفحم للطبيعة', 'تصوير فوتوغرافي للمدينة', 'خزف مزخرف بنقوش عربية', 'لوحة تجريدية معاصرة',
  'منظر جبلي خلاب', 'رسم مائي للورود', 'نحت من الرخام الأبيض', 'خط عربي بآية قرآنية',
  'صورة فوتوغرافية بالأبيض والأسود', 'لوحة زيتية للبحر', 'فن رقمي معاصر', 'منحوتة خشبية تراثية',
  'رسم بورتريه واقعي', 'تصميم خزفي حديث', 'لوحة مائية للسماء', 'نقش على النحاس',
  'فن الكولاج بمواد طبيعية', 'زجاج فني ملون'
];

// رسائل للتقييمات
const REVIEW_COMMENTS = [
  'عمل فني رائع ومبدع، أنصح بشدة بشراء أعمال هذا الفنان',
  'جودة عالية وتسليم سريع، راضية جداً عن الشراء',
  'لوحة جميلة تناسب ديكور المنزل بشكل مثالي',
  'فنان محترف وذو ذوق رفيع، التعامل معه سهل ومريح',
  'العمل الفني يفوق التوقعات، ألوان زاهية وتفاصيل دقيقة',
  'تسليم في الوقت المحدد والعمل مطابق للوصف تماماً',
  'أسلوب فني مميز وإبداع واضح في كل التفاصيل',
  'قيمة ممتازة مقابل السعر، أنصح الجميع بالشراء',
  'فنان موهوب جداً، سأشتري منه مرة أخرى بالتأكيد',
  'عمل فني يحمل روح الثقافة العربية بشكل جميل'
];

// رسائل للطلبات الخاصة
const SPECIAL_REQUEST_DESCRIPTIONS = [
  'أريد لوحة زيتية بمقاس 80x60 سم لغرفة المعيشة بألوان دافئة',
  'طلب رسم بورتريه شخصي بالألوان المائية من صورة فوتوغرافية',
  'تصميم خط عربي لآية قرآنية بخط الثلث على قماش كبير',
  'منحوتة صغيرة من الطين للديكور المنزلي بتصميم عربي',
  'لوحة تجريدية معاصرة بألوان الأزرق والأبيض لمكتب العمل',
  'رسم كاريكاتوري لعائلة مكونة من 4 أشخاص بأسلوب مرح',
  'تصميم شعار فني لمطعم تراثي بالخط العربي',
  'لوحة فوتوغرافية بالأبيض والأسود لمنظر طبيعي محلي',
  'قطعة خزفية مزخرفة بنقوش إسلامية للإهداء',
  'رسم رقمي لشخصية كرتونية للأطفال'
];

// رسائل للتقارير
const REPORT_REASONS = [
  { reason: 'inappropriate', description: 'محتوى غير لائق أو مخالف للآداب العامة' },
  { reason: 'copyright', description: 'انتهاك حقوق الطبع والنشر' },
  { reason: 'spam', description: 'محتوى إعلاني مزعج أو غير مرغوب فيه' },
  { reason: 'offensive', description: 'محتوى مسيء أو يحتوي على كلمات نابية' },
  { reason: 'harassment', description: 'تحرش أو سلوك غير لائق تجاه المستخدمين' },
  { reason: 'other', description: 'أسباب أخرى تتطلب مراجعة الإدارة' }
];

// دالة لإنشاء المستخدمين
const seedUsers = async () => {
  console.log(chalk.blue('🔄 Creating users...'));
  
  const usersData = [];
  
  // إعداد بيانات المديرين
  for (let i = 0; i < COUNTS.ADMINS; i++) {
    usersData.push({
      email: `admin${i + 1}@arthub.com`,
      password: 'Admin123!',
      displayName: `مدير النظام ${i + 1}`,
      role: i === 0 ? 'superadmin' : 'admin',
      isVerified: true,
      status: 'active',
      job: 'مدير منصة الفن',
      preferredLanguage: 'ar'
    });
  }
  
  // إعداد بيانات الفنانين
  for (let i = 0; i < COUNTS.ARTISTS; i++) {
    usersData.push({
      email: faker.internet.email().toLowerCase(),
      password: 'Artist123!',
      displayName: ARABIC_NAMES[i] || fakerAR.person.fullName(),
      role: 'artist',
      isVerified: faker.datatype.boolean(0.8),
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive']),
      job: faker.helpers.arrayElement([
        'فنان تشكيلي', 'رسام محترف', 'نحات', 'مصور فوتوغرافي', 
        'خطاط عربي', 'فنان رقمي', 'مصمم جرافيك'
      ]),
      preferredLanguage: 'ar',
      profileImage: {
        url: faker.image.avatar(),
        id: faker.string.alphanumeric(10)
      }
    });
  }
  
  // إعداد بيانات المستخدمين العاديين
  for (let i = 0; i < COUNTS.REGULAR_USERS; i++) {
    usersData.push({
      email: faker.internet.email().toLowerCase(),
      password: 'User123!',
      displayName: fakerAR.person.fullName(),
      role: 'user',
      isVerified: faker.datatype.boolean(0.7),
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'active', 'inactive']),
      job: fakerAR.person.jobTitle(),
      preferredLanguage: faker.helpers.arrayElement(['ar', 'en']),
      profileImage: {
        url: faker.image.avatar(),
        id: faker.string.alphanumeric(10)
      }
    });
  }
  
  // استخدام create() لضمان تشغيل pre-save hooks
  const createdUsers = [];
  for (const userData of usersData) {
    const user = await userModel.create(userData);
    createdUsers.push(user);
  }
  
  console.log(chalk.green(`✅ Created and hashed passwords for ${createdUsers.length} users`));
  return createdUsers;
};

// دالة لإنشاء الفئات
const seedCategories = async () => {
  console.log(chalk.blue('🔄 Creating categories...'));
  
  const categories = ART_CATEGORIES.map(cat => ({
    name: cat.name,
    description: cat.description,
    image: faker.image.urlLoremFlickr({ category: 'art' })
  }));
  
  const createdCategories = await categoryModel.insertMany(categories);
  console.log(chalk.green(`✅ Created ${createdCategories.length} categories`));
  return createdCategories;
};

// دالة لإنشاء الصور
const seedImages = async (users, categories) => {
  console.log(chalk.blue('🔄 Creating images...'));
  
  const images = [];
  
  for (let i = 0; i < COUNTS.IMAGES; i++) {
    const randomUser = faker.helpers.arrayElement(users.filter(u => u.role === 'artist'));
    const randomCategory = faker.helpers.arrayElement(categories);
    
    images.push({
      user: randomUser._id,
      title: {
        ar: `صورة فنية ${i + 1}`,
        en: `Artwork Image ${i + 1}`
      },
      description: {
        ar: faker.lorem.sentence(),
        en: faker.lorem.sentence()
      },
      url: faker.image.urlLoremFlickr({ category: 'art' }),
      publicId: faker.string.alphanumeric(15),
      category: randomCategory._id,
      tags: faker.helpers.arrayElements(['فن', 'إبداع', 'جمال', 'ألوان', 'تصميم'], 3),
      size: faker.number.int({ min: 100000, max: 5000000 }),
      format: faker.helpers.arrayElement(['jpg', 'png', 'webp']),
      width: faker.number.int({ min: 800, max: 2000 }),
      height: faker.number.int({ min: 600, max: 1500 }),
      isPublic: faker.datatype.boolean(0.8),
      isFeatured: faker.datatype.boolean(0.1),
      forSale: faker.datatype.boolean(0.3),
      price: faker.datatype.boolean(0.3) ? faker.number.float({ min: 50, max: 1000, precision: 0.01 }) : 0,
      viewCount: faker.number.int({ min: 0, max: 500 }),
      likeCount: faker.number.int({ min: 0, max: 100 })
    });
  }
  
  const createdImages = await imageModel.insertMany(images);
  console.log(chalk.green(`✅ Created ${createdImages.length} images`));
  return createdImages;
};

// دالة لإنشاء الأعمال الفنية
const seedArtworks = async (users, categories, images) => {
  console.log(chalk.blue('🔄 Creating artworks...'));
  
  const artists = users.filter(u => u.role === 'artist');
  const artworks = [];
  
  for (let i = 0; i < COUNTS.ARTWORKS; i++) {
    const randomArtist = faker.helpers.arrayElement(artists);
    const randomCategory = faker.helpers.arrayElement(categories);
    const randomImages = faker.helpers.arrayElements(images, faker.number.int({ min: 1, max: 4 }));
    
    artworks.push({
      title: ARTWORK_TITLES[i % ARTWORK_TITLES.length] || `عمل فني ${i + 1}`,
      description: faker.lorem.paragraphs(2),
      artist: randomArtist._id,
      category: randomCategory._id,
      price: faker.number.float({ min: 100, max: 5000, precision: 0.01 }),
      currency: 'SAR',
      status: faker.helpers.arrayElement(['available', 'available', 'available', 'sold', 'draft']),
      tags: faker.helpers.arrayElements(['فن', 'إبداع', 'جمال', 'ألوان', 'تصميم', 'تراث', 'معاصر'], 4),
      dimensions: {
        width: faker.number.int({ min: 20, max: 200 }),
        height: faker.number.int({ min: 20, max: 200 }),
        depth: faker.number.int({ min: 1, max: 10 })
      },
      materials: faker.helpers.arrayElements([
        'قماش', 'ورق', 'خشب', 'معدن', 'زجاج', 'خزف', 'حجر'
      ], faker.number.int({ min: 1, max: 3 })),
      image: randomImages[0]?.url || faker.image.urlLoremFlickr({ category: 'art' }),
      images: randomImages.map(img => img.url),
      isFramed: faker.datatype.boolean(),
      yearCreated: faker.date.between({ from: '2020-01-01', to: '2024-01-01' }).getFullYear(),
      views: faker.number.int({ min: 0, max: 1000 }),
      likes: faker.number.int({ min: 0, max: 200 })
    });
  }
  
  const createdArtworks = await artworkModel.insertMany(artworks);
  console.log(chalk.green(`✅ Created ${createdArtworks.length} artworks`));
  return createdArtworks;
};

// دالة لإنشاء التقييمات
const seedReviews = async (users, artworks) => {
  if (USE_STATIC_MOCK_DATA) {
    console.log(chalk.blue('🔄 Inserting static mock reviews...'));
    await reviewModel.deleteMany({});
    const created = await reviewModel.insertMany(STATIC_REVIEWS);
    console.log(chalk.green(`✅ Inserted ${created.length} static reviews`));
    return created;
  }
  console.log(chalk.blue('🔄 Creating reviews...'));
  
  const regularUsers = users.filter(u => u.role === 'user');
  const reviews = [];
  
  for (let i = 0; i < COUNTS.REVIEWS; i++) {
    const randomUser = faker.helpers.arrayElement(regularUsers);
    const randomArtwork = faker.helpers.arrayElement(artworks);
    const artist = users.find(u => u._id.equals(randomArtwork.artist));
    
    reviews.push({
      user: randomUser._id,
      artwork: randomArtwork._id,
      artist: artist._id,
      rating: faker.number.int({ min: 3, max: 5 }),
      comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length] || faker.lorem.paragraph(),
      title: `تقييم رائع ${i + 1}`,
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'pending']),
      isVerified: faker.datatype.boolean(0.8),
      helpfulCount: faker.number.int({ min: 0, max: 50 }),
      purchaseInfo: {
        transactionId: new mongoose.Types.ObjectId(),
        purchaseDate: faker.date.recent({ days: 30 }),
        purchasePrice: randomArtwork.price
      }
    });
  }
  
  const createdReviews = await reviewModel.insertMany(reviews);
  console.log(chalk.green(`✅ Created ${createdReviews.length} reviews`));
  return createdReviews;
};

// دالة لإنشاء المتابعات
const seedFollows = async (users) => {
  if (USE_STATIC_MOCK_DATA) {
    console.log(chalk.blue('🔄 Inserting static mock follows...'));
    await followModel.deleteMany({});
    const created = await followModel.insertMany(STATIC_FOLLOWS);
    console.log(chalk.green(`✅ Inserted ${created.length} static follows`));
    return created;
  }
  console.log(chalk.blue('🔄 Creating follows...'));
  
  const regularUsers = users.filter(u => u.role === 'user');
  const artists = users.filter(u => u.role === 'artist');
  const follows = [];
  const createdFollows = new Set();
  
  for (let i = 0; i < COUNTS.FOLLOWS; i++) {
    const follower = faker.helpers.arrayElement(regularUsers);
    const following = faker.helpers.arrayElement(artists);
    
    const followKey = `${follower._id.toString()}-${following._id.toString()}`;
    
    if (!createdFollows.has(followKey)) {
      follows.push({
        follower: follower._id,
        following: following._id,
        createdAt: faker.date.recent({ days: 90 })
      });
      createdFollows.add(followKey);
    }
  }
  
  const createdFollowsResult = await followModel.insertMany(follows);
  console.log(chalk.green(`✅ Created ${createdFollowsResult.length} follows`));
  return createdFollowsResult;
};

// دالة لإنشاء المعاملات
const seedTransactions = async (users, artworks) => {
  console.log(chalk.blue('🔄 Creating transactions...'));
  
  const buyers = users.filter(u => u.role === 'user');
  const transactions = [];
  
  for (let i = 0; i < COUNTS.TRANSACTIONS; i++) {
    const randomBuyer = faker.helpers.arrayElement(buyers);
    const randomArtwork = faker.helpers.arrayElement(artworks);
    const seller = users.find(u => u._id.equals(randomArtwork.artist));
    
    const subtotal = randomArtwork.price;
    const tax = subtotal * 0.15; // ضريبة 15%
    const totalAmount = subtotal + tax;
    
    transactions.push({
      transactionNumber: `TXN-${faker.string.alphanumeric(8).toUpperCase()}`,
      buyer: randomBuyer._id,
      seller: seller._id,
      items: [{
        artwork: randomArtwork._id,
        quantity: 1,
        unitPrice: randomArtwork.price,
        totalPrice: randomArtwork.price,
        finalPrice: randomArtwork.price
      }],
      pricing: {
        subtotal: subtotal,
        tax: tax,
        totalAmount: totalAmount,
        netAmount: totalAmount
      },
      status: faker.helpers.arrayElement([
        'completed', 'completed', 'completed', 'pending', 'cancelled'
      ]),
      currency: 'SAR',
      payment: {
        method: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'stc_pay']),
        provider: 'stripe',
        transactionId: faker.string.uuid(),
        paidAt: faker.date.recent({ days: 30 })
      },
      shipping: {
        address: {
          fullName: randomBuyer.displayName,
          addressLine1: fakerAR.location.streetAddress(),
          addressLine2: faker.location.secondaryAddress(),
          city: fakerAR.location.city(),
          state: fakerAR.location.state(),
          country: 'السعودية',
          postalCode: faker.location.zipCode(),
          phoneNumber: faker.phone.number()
        },
        method: faker.helpers.arrayElement(['standard', 'express', 'pickup']),
        cost: faker.number.float({ min: 20, max: 100, precision: 0.01 })
      },
      notes: faker.lorem.sentence()
    });
  }
  
  const createdTransactions = await transactionModel.insertMany(transactions);
  console.log(chalk.green(`✅ Created ${createdTransactions.length} transactions`));
  return createdTransactions;
};

// دالة لإنشاء الطلبات الخاصة
const seedSpecialRequests = async (users, categories) => {
  console.log(chalk.blue('🔄 Creating special requests...'));
  
  const clients = users.filter(u => u.role === 'user');
  const artists = users.filter(u => u.role === 'artist');
  const specialRequests = [];
  
  for (let i = 0; i < COUNTS.SPECIAL_REQUESTS; i++) {
    const randomClient = faker.helpers.arrayElement(clients);
    const randomArtist = faker.helpers.arrayElement(artists);
    const randomCategory = faker.helpers.arrayElement(categories);
    
    specialRequests.push({
      sender: randomClient._id,
      artist: randomArtist._id,
      requestType: faker.helpers.arrayElement([
        'custom_artwork', 'portrait', 'logo_design', 'illustration', 'digital_art', 'traditional_art'
      ]),
      title: `طلب خاص ${i + 1}`,
      description: SPECIAL_REQUEST_DESCRIPTIONS[i % SPECIAL_REQUEST_DESCRIPTIONS.length],
      category: randomCategory._id,
      budget: faker.number.int({ min: 200, max: 5000 }),
      currency: 'SAR',
      deadline: faker.date.future({ years: 0.5 }),
      status: faker.helpers.arrayElement([
        'pending', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
      ]),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      tags: faker.helpers.arrayElements(['فن', 'تصميم', 'إبداع', 'مخصص'], 2),
      attachments: [
        {
          url: faker.image.url(),
          type: 'image',
          name: 'صورة مرجعية',
          description: 'صورة مرجعية للعمل المطلوب'
        }
      ],
      specifications: {
        dimensions: {
          width: faker.number.int({ min: 30, max: 150 }),
          height: faker.number.int({ min: 30, max: 150 }),
          unit: 'cm'
        },
        style: faker.helpers.arrayElement(['واقعي', 'تجريدي', 'كلاسيكي', 'معاصر']),
        colorScheme: faker.helpers.arrayElement(['ألوان دافئة', 'ألوان باردة', 'أبيض وأسود', 'ألوان زاهية'])
      }
    });
  }
  
  const createdRequests = await specialRequestModel.insertMany(specialRequests);
  console.log(chalk.green(`✅ Created ${createdRequests.length} special requests`));
  return createdRequests;
};

// دالة لإنشاء التقارير
const seedReports = async (users, artworks) => {
  console.log(chalk.blue('🔄 Creating reports...'));
  
  const reports = [];
  
  for (let i = 0; i < COUNTS.REPORTS; i++) {
    const randomReporter = faker.helpers.arrayElement(users);
    const randomArtwork = faker.helpers.arrayElement(artworks);
    const randomReason = faker.helpers.arrayElement(REPORT_REASONS);
    
    reports.push({
      reporter: randomReporter._id,
      contentType: faker.helpers.arrayElement(['artwork', 'user', 'comment']),
      contentId: randomArtwork._id,
      targetUser: randomArtwork.artist,
      reason: randomReason.reason,
      description: randomReason.description,
      status: faker.helpers.arrayElement(['pending', 'pending', 'resolved', 'rejected']),
      adminNotes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : undefined
    });
  }
  
  const createdReports = await reportModel.insertMany(reports);
  console.log(chalk.green(`✅ Created ${createdReports.length} reports`));
  return createdReports;
};

// دالة لإنشاء المحادثات والرسائل
const seedChatsAndMessages = async (users) => {
  if (USE_STATIC_MOCK_DATA) {
    console.log(chalk.blue('🔄 Inserting static mock chats/messages...'));
    await chatModel.deleteMany({});
    await messageModel.deleteMany({});
    const createdChats = await chatModel.insertMany(STATIC_CHATS);
    const createdMessages = await messageModel.insertMany(STATIC_MESSAGES);
    console.log(chalk.green(`✅ Inserted ${createdChats.length} static chats, ${createdMessages.length} static messages`));
    return { chats: createdChats, messages: createdMessages };
  }
  console.log(chalk.blue('🔄 Creating chats and messages...'));

  const artists = users.filter(u => u.role === 'artist');
  const regularUsers = users.filter(u => u.role === 'user');
  const chats = [];
  
  if (artists.length === 0 || regularUsers.length === 0) {
    console.log(chalk.yellow('⚠️ Not enough artists or users to create chats. Skipping.'));
    return { chats: [], messages: [] };
  }

  // إنشاء المحادثات
  for (let i = 0; i < COUNTS.CHATS; i++) {
    const artist = faker.helpers.arrayElement(artists);
    const user = faker.helpers.arrayElement(regularUsers);

    // التأكد من أن المشاركين موجودين
    if (artist && user && artist._id && user._id) {
      chats.push({
        members: [artist._id, user._id], // Use 'members' instead of 'participants'
        sender: artist._id,
        receiver: user._id
        // lastMessage is intentionally omitted, will be populated by application logic
      });
    }
  }

  if (chats.length === 0) {
    console.log(chalk.yellow('⚠️ No chats were created. Skipping message seeding.'));
    return { chats: [], messages: [] };
  }

  const createdChats = await chatModel.insertMany(chats);
  console.log(chalk.green(`✅ Created ${createdChats.length} chats`));

  // إنشاء الرسائل
  const messages = [];
  for (let i = 0; i < COUNTS.MESSAGES; i++) {
    const randomChat = faker.helpers.arrayElement(createdChats);
    
    // التأكد من أن المحادثة والمشاركين موجودين
    if (randomChat && randomChat.members && randomChat.members.length > 0) {
       const senderId = faker.helpers.arrayElement(randomChat.members);
       const receiverId = randomChat.members.find(p => p.toString() !== senderId.toString());

       if (senderId && receiverId) {
         messages.push({
           chat: randomChat._id,
           sender: senderId,
           receiver: receiverId,
           text: fakerAR.lorem.sentence(),
           read: faker.datatype.boolean(0.5)
         });
       }
    }
  }

  if (messages.length === 0) {
    console.log(chalk.yellow('⚠️ No messages were created.'));
    return { chats: createdChats, messages: [] };
  }

  const createdMessages = await messageModel.insertMany(messages);
  console.log(chalk.green(`✅ Created ${createdMessages.length} messages`));

  return { chats: createdChats, messages: createdMessages };
};

// دالة لإنشاء الإشعارات
const seedNotifications = async (users, artworks, transactions, follows) => {
  if (USE_STATIC_MOCK_DATA) {
    console.log(chalk.blue('🔄 Inserting static mock notifications...'));
    await notificationModel.deleteMany({});
    const created = await notificationModel.insertMany(STATIC_NOTIFICATIONS);
    console.log(chalk.green(`✅ Inserted ${created.length} static notifications`));
    return created;
  }
  console.log(chalk.blue('🔄 Creating notifications...'));
  
  const notifications = [];
  
  for (let i = 0; i < COUNTS.NOTIFICATIONS; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    const notificationType = faker.helpers.arrayElement([
      'request', 'message', 'review', 'system', 'other'
    ]);
    
    let title, message, ref, refModel;
    
    switch (notificationType) {
      case 'request':
        title = { ar: 'طلب جديد' };
        message = { ar: 'لديك طلب خاص جديد' };
        ref = faker.helpers.arrayElement(transactions)?._id;
        refModel = 'SpecialRequest';
        break;
      case 'message':
        title = { ar: 'رسالة جديدة' };
        message = { ar: 'لديك رسالة جديدة من أحد المستخدمين' };
        ref = randomUser._id;
        refModel = 'User';
        break;
      case 'review':
        title = { ar: 'تقييم جديد' };
        message = { ar: 'تم تقييم أحد أعمالك الفنية' };
        ref = faker.helpers.arrayElement(artworks)?._id;
        refModel = 'Artwork';
        break;
      case 'system':
        title = { ar: 'إشعار النظام' };
        message = { ar: 'مرحباً بك في منصة الفن' };
        break;
      default:
        title = { ar: 'إشعار عام' };
        message = { ar: 'لديك تحديث جديد' };
    }
    
    notifications.push({
      user: randomUser._id,
      title,
      message,
      type: notificationType,
      isRead: faker.datatype.boolean(0.3),
      ref,
      refModel,
      data: {
        priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
        category: 'general'
      }
    });
  }
  
  const createdNotifications = await notificationModel.insertMany(notifications);
  console.log(chalk.green(`✅ Created ${createdNotifications.length} notifications`));
  return createdNotifications;
};

// دالة لإنشاء الرموز المميزة
const seedTokens = async (users) => {
  console.log(chalk.blue('🔄 Creating tokens...'));
  
  if (!users || users.length === 0) {
    console.log(chalk.yellow('⚠️ No users found, skipping token seeding.'));
    return [];
  }
  
  const tokens = [];
  
  for (const user of users) {
    tokens.push({
      user: user._id, // Add the required user field
      token: faker.string.uuid(),
      refreshToken: faker.string.uuid(),
      userAgent: faker.internet.userAgent(),
      expiresAt: faker.date.future({ years: 1 })
    });
  }
  
  const createdTokens = await tokenModel.insertMany(tokens);
  console.log(chalk.green(`✅ Created ${createdTokens.length} tokens`));
  return createdTokens;
};

// استخدم بيانات ثابتة إذا كان هذا المتغير true
const USE_STATIC_MOCK_DATA = true;

// بيانات mock ثابتة (users, categories, artworks, ...)
const STATIC_USERS = [
  {
    _id: new mongoose.Types.ObjectId('664a1a1a1a1a1a1a1a1a1a11'),
    email: 'artist1@arthub.com',
    displayName: 'فنان رقم 1',
    role: 'artist',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341475/image_18_quawcy.png' },
    isActive: true,
    password: 'Artist123!'
  },
  {
    _id: new mongoose.Types.ObjectId('664a1a1a1a1a1a1a1a1a1a12'),
    email: 'artist2@arthub.com',
    displayName: 'فنان رقم 2',
    role: 'artist',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_17_fxhxxx.png' },
    isActive: true,
    password: 'Artist123!'
  },
  {
    _id: new mongoose.Types.ObjectId('664a1a1a1a1a1a1a1a1a1a13'),
    email: 'artist3@arthub.com',
    displayName: 'فنان رقم 3',
    role: 'artist',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_16_dpoqac.png' },
    isActive: true,
    password: 'Artist123!'
  },
  {
    _id: new mongoose.Types.ObjectId('664a1a1a1a1a1a1a1a1a1a14'),
    email: 'user1@arthub.com',
    displayName: 'مستخدم رقم 1',
    role: 'user',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341478/image_15_n1tr7z.png' },
    isActive: true,
    password: 'User123!'
  },
  {
    _id: new mongoose.Types.ObjectId('664a1a1a1a1a1a1a1a1a1a15'),
    email: 'user2@arthub.com',
    displayName: 'مستخدم رقم 2',
    role: 'user',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341480/image_14_ap4jkk.png' },
    isActive: true,
    password: 'User123!'
  }
];

const STATIC_CATEGORIES = [
  {
    _id: new mongoose.Types.ObjectId('664b1b1b1b1b1b1b1b1b1b11'),
    name: 'أدوات فنية',
    description: 'كل ما يخص الأدوات الفنية',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342439/image_19_nfmzd7.png'
  },
  {
    _id: new mongoose.Types.ObjectId('664b1b1b1b1b1b1b1b1b1b12'),
    name: 'تصوير',
    description: 'فن التصوير الفوتوغرافي',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342437/image_20_dhgba9.png'
  },
  {
    _id: new mongoose.Types.ObjectId('664b1b1b1b1b1b1b1b1b1b13'),
    name: 'خزف',
    description: 'فن الخزف وصناعة الفخار',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342435/image_21_yrnnuf.png'
  },
  {
    _id: new mongoose.Types.ObjectId('664b1b1b1b1b1b1b1b1b1b14'),
    name: 'نحت',
    description: 'فن النحت',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342433/image_22_hqxfdk.png'
  },
  {
    _id: new mongoose.Types.ObjectId('664b1b1b1b1b1b1b1b1b1b15'),
    name: 'رسم',
    description: 'فن الرسم بأنواعه',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342433/image_23_nl8fnr.png'
  }
];

const STATIC_ARTWORKS = [
  {
    _id: new mongoose.Types.ObjectId('665c1c1c1c1c1c1c1c1c1c11'),
    title: 'لوحة الطبيعة الساحرة',
    description: 'لوحة تعبر عن جمال الطبيعة',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341482/image_13_mhcq4w.png'
    ],
    price: 1200,
    category: STATIC_CATEGORIES[4]._id,
    artist: STATIC_USERS[0]._id,
    tags: ['طبيعة', 'رسم', 'ألوان زيتية'],
    status: 'available',
    isFramed: true,
    dimensions: { width: 80, height: 60, depth: 2 },
    materials: ['زيت على قماش'],
    viewCount: 10
  },
  {
    _id: new mongoose.Types.ObjectId('665c1c1c1c1c1c1c1c1c1c12'),
    title: 'صورة فوتوغرافية للمدينة',
    description: 'صورة ليلية لمدينة مزدحمة',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341484/image_12_qm6jdx.png'
    ],
    price: 800,
    category: STATIC_CATEGORIES[1]._id,
    artist: STATIC_USERS[1]._id,
    tags: ['تصوير', 'مدينة', 'ليل'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 60, height: 40, depth: 1 },
    materials: ['ورق تصوير'],
    viewCount: 7
  },
  {
    _id: new mongoose.Types.ObjectId('665c1c1c1c1c1c1c1c1c1c13'),
    title: 'منحوتة حديثة',
    description: 'عمل نحتي معاصر',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341485/image_11_unagay.png'
    ],
    price: 2000,
    category: STATIC_CATEGORIES[3]._id,
    artist: STATIC_USERS[2]._id,
    tags: ['نحت', 'فن حديث'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 30, height: 50, depth: 20 },
    materials: ['رخام'],
    viewCount: 5
  },
  {
    _id: new mongoose.Types.ObjectId('665c1c1c1c1c1c1c1c1c1c14'),
    title: 'خزف مزخرف',
    description: 'قطعة خزفية مزخرفة يدوياً',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341487/image_10_ov2cpb.png'
    ],
    price: 600,
    category: STATIC_CATEGORIES[2]._id,
    artist: STATIC_USERS[0]._id,
    tags: ['خزف', 'زخرفة'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 20, height: 20, depth: 20 },
    materials: ['خزف'],
    viewCount: 3
  },
  {
    _id: new mongoose.Types.ObjectId('665c1c1c1c1c1c1c1c1c1c15'),
    title: 'مجموعة أدوات فنية',
    description: 'مجموعة أدوات للرسم والتلوين',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341489/image_9_ls6uwm.png'
    ],
    price: 300,
    category: STATIC_CATEGORIES[0]._id,
    artist: STATIC_USERS[1]._id,
    tags: ['أدوات', 'رسم', 'تلوين'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 40, height: 30, depth: 5 },
    materials: ['خشب', 'بلاستيك'],
    viewCount: 2
  }
];

const STATIC_FOLLOWS = [
  {
    _id: new mongoose.Types.ObjectId('666d1d1d1d1d1d1d1d1d1d11'),
    follower: STATIC_USERS[3]._id, // user1
    following: STATIC_USERS[0]._id // artist1
  }
];

const STATIC_REVIEWS = [
  {
    _id: new mongoose.Types.ObjectId('669a2a2a2a2a2a2a2a2a2a11'),
    artwork: STATIC_ARTWORKS[0]._id,
    user: STATIC_USERS[3]._id, // user1
    artist: STATIC_USERS[0]._id, // artist1
    rating: 5,
    comment: 'عمل رائع جداً!'
  }
];

const STATIC_CHATS = [
  {
    _id: new mongoose.Types.ObjectId('667e1e1e1e1e1e1e1e1e1e11'),
    members: [STATIC_USERS[3]._id, STATIC_USERS[0]._id] // user1, artist1
  }
];

const STATIC_MESSAGES = [
  {
    _id: new mongoose.Types.ObjectId('668f1f1f1f1f1f1f1f1f1f11'),
    chat: STATIC_CHATS[0]._id,
    sender: STATIC_USERS[3]._id,
    receiver: STATIC_USERS[0]._id,
    text: 'مرحبا! أريد الاستفسار عن لوحة الطبيعة الساحرة.',
    read: false
  },
  {
    _id: new mongoose.Types.ObjectId('668f1f1f1f1f1f1f1f1f1f12'),
    chat: STATIC_CHATS[0]._id,
    sender: STATIC_USERS[0]._id,
    receiver: STATIC_USERS[3]._id,
    text: 'أهلاً بك! تفضل بأي سؤال.',
    read: true
  }
];

const STATIC_NOTIFICATIONS = [
  {
    _id: new mongoose.Types.ObjectId('66ab3b3b3b3b3b3b3b3b3b11'),
    user: STATIC_USERS[3]._id,
    title: { ar: 'تمت إضافة عمل فني جديد' },
    message: { ar: 'تمت إضافة لوحة الطبيعة الساحرة بواسطة فنان رقم 1' },
    type: 'system',
    isRead: false
  }
];

// إضافة مجموعة ثانية من المستخدمين والفنانين
const STATIC_USERS_EXTRA = [
  {
    _id: new mongoose.Types.ObjectId('774a1a1a1a1a1a1a1a1a1a11'),
    email: 'artist4@arthub.com',
    displayName: 'فنان رقم 4',
    role: 'artist',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341475/image_18_quawcy.png' },
    isActive: true,
    password: 'Artist123!'
  },
  {
    _id: new mongoose.Types.ObjectId('774a1a1a1a1a1a1a1a1a1a12'),
    email: 'artist5@arthub.com',
    displayName: 'فنان رقم 5',
    role: 'artist',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_17_fxhxxx.png' },
    isActive: true,
    password: 'Artist123!'
  },
  {
    _id: new mongoose.Types.ObjectId('774a1a1a1a1a1a1a1a1a1a13'),
    email: 'artist6@arthub.com',
    displayName: 'فنان رقم 6',
    role: 'artist',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_16_dpoqac.png' },
    isActive: true,
    password: 'Artist123!'
  },
  {
    _id: new mongoose.Types.ObjectId('774a1a1a1a1a1a1a1a1a1a14'),
    email: 'user3@arthub.com',
    displayName: 'مستخدم رقم 3',
    role: 'user',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341478/image_15_n1tr7z.png' },
    isActive: true,
    password: 'User123!'
  },
  {
    _id: new mongoose.Types.ObjectId('774a1a1a1a1a1a1a1a1a1a15'),
    email: 'user4@arthub.com',
    displayName: 'مستخدم رقم 4',
    role: 'user',
    profileImage: { url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341480/image_14_ap4jkk.png' },
    isActive: true,
    password: 'User123!'
  }
];

// إضافة تصنيفات جديدة
const STATIC_CATEGORIES_EXTRA = [
  {
    _id: new mongoose.Types.ObjectId('774b1b1b1b1b1b1b1b1b1b11'),
    name: 'فن الخط',
    description: 'كل ما يخص الخط العربي',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342439/image_19_nfmzd7.png'
  },
  {
    _id: new mongoose.Types.ObjectId('774b1b1b1b1b1b1b1b1b1b12'),
    name: 'فن البورتريه',
    description: 'رسم الوجوه والشخصيات',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342437/image_20_dhgba9.png'
  },
  {
    _id: new mongoose.Types.ObjectId('774b1b1b1b1b1b1b1b1b1b13'),
    name: 'فن الطبيعة',
    description: 'لوحات الطبيعة والمناظر الطبيعية',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342435/image_21_yrnnuf.png'
  },
  {
    _id: new mongoose.Types.ObjectId('774b1b1b1b1b1b1b1b1b1b14'),
    name: 'فن الأطفال',
    description: 'رسومات للأطفال',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342433/image_22_hqxfdk.png'
  },
  {
    _id: new mongoose.Types.ObjectId('774b1b1b1b1b1b1b1b1b1b15'),
    name: 'فن الكولاج',
    description: 'أعمال فنية مركبة',
    image: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342433/image_23_nl8fnr.png'
  }
];

// إضافة أعمال فنية جديدة
const STATIC_ARTWORKS_EXTRA = [
  {
    _id: new mongoose.Types.ObjectId('775c1c1c1c1c1c1c1c1c1c11'),
    title: 'لوحة الخط العربي',
    description: 'لوحة بخط الثلث العربي',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341482/image_13_mhcq4w.png'
    ],
    price: 1500,
    category: STATIC_CATEGORIES_EXTRA[0]._id,
    artist: STATIC_USERS_EXTRA[0]._id,
    tags: ['خط', 'عربي', 'فن'],
    status: 'available',
    isFramed: true,
    dimensions: { width: 90, height: 60, depth: 2 },
    materials: ['حبر على ورق'],
    viewCount: 8
  },
  {
    _id: new mongoose.Types.ObjectId('775c1c1c1c1c1c1c1c1c1c12'),
    title: 'بورتريه كلاسيكي',
    description: 'رسم وجه امرأة بأسلوب كلاسيكي',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341484/image_12_qm6jdx.png'
    ],
    price: 1100,
    category: STATIC_CATEGORIES_EXTRA[1]._id,
    artist: STATIC_USERS_EXTRA[1]._id,
    tags: ['بورتريه', 'رسم', 'شخصية'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 70, height: 50, depth: 1 },
    materials: ['ألوان زيتية'],
    viewCount: 6
  },
  {
    _id: new mongoose.Types.ObjectId('775c1c1c1c1c1c1c1c1c1c13'),
    title: 'منظر طبيعي جديد',
    description: 'لوحة جديدة للطبيعة الخضراء',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341485/image_11_unagay.png'
    ],
    price: 900,
    category: STATIC_CATEGORIES_EXTRA[2]._id,
    artist: STATIC_USERS_EXTRA[2]._id,
    tags: ['طبيعة', 'خضرة', 'رسم'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 60, height: 40, depth: 1 },
    materials: ['أكريليك'],
    viewCount: 4
  },
  {
    _id: new mongoose.Types.ObjectId('775c1c1c1c1c1c1c1c1c1c14'),
    title: 'رسمة أطفال ملونة',
    description: 'رسمة مرحة للأطفال',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341487/image_10_ov2cpb.png'
    ],
    price: 400,
    category: STATIC_CATEGORIES_EXTRA[3]._id,
    artist: STATIC_USERS_EXTRA[0]._id,
    tags: ['أطفال', 'ألوان', 'مرح'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 30, height: 20, depth: 1 },
    materials: ['ألوان خشبية'],
    viewCount: 2
  },
  {
    _id: new mongoose.Types.ObjectId('775c1c1c1c1c1c1c1c1c1c15'),
    title: 'كولاج معاصر',
    description: 'عمل كولاج بمواد مختلطة',
    images: [
      'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341489/image_9_ls6uwm.png'
    ],
    price: 700,
    category: STATIC_CATEGORIES_EXTRA[4]._id,
    artist: STATIC_USERS_EXTRA[1]._id,
    tags: ['كولاج', 'فن معاصر'],
    status: 'available',
    isFramed: false,
    dimensions: { width: 50, height: 40, depth: 2 },
    materials: ['ورق', 'قماش'],
    viewCount: 1
  }
];

// دمج البيانات الأصلية والجديدة في mock النهائي
const ALL_STATIC_USERS = [...STATIC_USERS, ...STATIC_USERS_EXTRA];
const ALL_STATIC_CATEGORIES = [...STATIC_CATEGORIES, ...STATIC_CATEGORIES_EXTRA];
const ALL_STATIC_ARTWORKS = [...STATIC_ARTWORKS, ...STATIC_ARTWORKS_EXTRA];

// الدالة الرئيسية
const seedDatabase = async () => {
  try {
    console.log(chalk.yellow('🚀 Starting comprehensive database seeding...'));
    
    // الاتصال بقاعدة البيانات
    await connectDB();
    
    // مسح البيانات الموجودة
    console.log(chalk.red('🗑️ Clearing existing data...'));
    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({}),
      artworkModel.deleteMany({}),
      // imageModel.deleteMany({}),
      reviewModel.deleteMany({}),
      followModel.deleteMany({}),
      transactionModel.deleteMany({}),
      specialRequestModel.deleteMany({}),
      reportModel.deleteMany({}),
      chatModel.deleteMany({}),
      messageModel.deleteMany({}),
      notificationModel.deleteMany({}),
      tokenModel.deleteMany({})
    ]);
    
    // إنشاء البيانات الجديدة بالترتيب الصحيح وتمريرها
    const users = await seedUsers();
    const categories = await seedCategories();
    const artworks = await seedArtworks(users, categories, []);
    const reviews = await seedReviews(users, artworks);
    const follows = await seedFollows(users);
    const transactions = await seedTransactions(users, artworks);
    const specialRequests = await seedSpecialRequests(users, categories);
    const reports = await seedReports(users, artworks);
    const { chats, messages } = await seedChatsAndMessages(users);
    const notifications = await seedNotifications(users, artworks, transactions, follows);
    const tokens = await seedTokens(users);
    
    // طباعة ملخص النتائج
    console.log(chalk.green('\n🎉 Database seeding completed successfully!'));
    console.log(chalk.cyan('\n📊 Summary:'));
    console.log(chalk.white(`👥 Users: ${users.length}`));
    console.log(chalk.white(`🎨 Categories: ${categories.length}`));
    console.log(chalk.white(`🖼️ Images: ${images.length}`));
    console.log(chalk.white(`🎭 Artworks: ${artworks.length}`));
    console.log(chalk.white(`⭐ Reviews: ${reviews.length}`));
    console.log(chalk.white(`👥 Follows: ${follows.length}`));
    console.log(chalk.white(`💰 Transactions: ${transactions.length}`));
    console.log(chalk.white(`📋 Special Requests: ${specialRequests.length}`));
    console.log(chalk.white(`🚨 Reports: ${reports.length}`));
    console.log(chalk.white(`💬 Chats: ${chats.length}`));
    console.log(chalk.white(`📝 Messages: ${messages.length}`));
    console.log(chalk.white(`🔔 Notifications: ${notifications.length}`));
    console.log(chalk.white(`🔑 Tokens: ${tokens.length}`));
    
    console.log(chalk.green('\n✨ Ready to test your ArtHub platform!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error seeding database:'), error);
  } finally {
    await mongoose.disconnect();
    console.log(chalk.blue('📡 Database connection closed'));
  }
};

// تشغيل السكريبت
seedDatabase();