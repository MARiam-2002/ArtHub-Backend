const mongoose = require('mongoose');

// Mock Data for ArtHub Backend
// This file contains comprehensive mock data for all models

const mockData = {
  // Categories Data
  categories: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
      name: 'رسم',
      description: 'أعمال الرسم بجميع أنواعه وأساليبه',
      image: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342433/image_23_nl8fnr.png',
        publicId: 'image_23_nl8fnr'
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cb'),
      name: 'نحت',
      description: 'أعمال النحت والمنحوتات الفنية',
      image: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342433/image_22_hqxfdk.png',
        publicId: 'image_22_hqxfdk'
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cc'),
      name: 'خزف',
      description: 'أعمال الخزف والفخار الفني',
      image: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342435/image_21_yrnnuf.png',
        publicId: 'image_21_yrnnuf'
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cd'),
      name: 'تصوير',
      description: 'التصوير الفوتوغرافي الفني',
      image: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342437/image_20_dhgba9.png',
        publicId: 'image_20_dhgba9'
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ce'),
      name: 'أدوات فنية',
      description: 'الأدوات الفنية والمستلزمات',
      image: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752342439/image_19_nfmzd7.png',
        publicId: 'image_19_nfmzd7'
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    }
  ],

  // Users Data (Artists and Regular Users)
  users: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      email: 'ahmed.artist@example.com',
      password: '$2b$10$hashedPassword123', // Will be hashed in actual implementation
      displayName: 'أحمد الفنان',
      role: 'artist',
      job: 'فنان تشكيلي',
      bio: 'فنان تشكيلي متخصص في الرسم الزيتي والمناظر الطبيعية',
      profileImage: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341475/image_18_quawcy.png',
        publicId: 'image_18_quawcy'
      },
      coverImages: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_17_fxhxxx.png',
          publicId: 'image_17_fxhxxx'
        }
      ],
      socialLinks: {
        instagram: 'ahmed_artist',
        twitter: 'ahmed_artist',
        website: 'https://ahmed-artist.com'
      },
      isActive: true,
      isVerified: true,
      followers: [],
      following: [],
      wishlist: [],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d0'),
      email: 'sara.artist@example.com',
      password: '$2b$10$hashedPassword456',
      displayName: 'سارة النحاتة',
      role: 'artist',
      job: 'نحاتة فنية',
      bio: 'نحاتة متخصصة في نحت التماثيل والمنحوتات الحديثة',
      profileImage: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_16_dpoqac.png',
        publicId: 'image_16_dpoqac'
      },
      coverImages: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341478/image_15_n1tr7z.png',
          publicId: 'image_15_n1tr7z'
        }
      ],
      socialLinks: {
        instagram: 'sara_sculptor',
        facebook: 'sara.sculptor'
      },
      isActive: true,
      isVerified: true,
      followers: [],
      following: [],
      wishlist: [],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d1'),
      email: 'omar.artist@example.com',
      password: '$2b$10$hashedPassword789',
      displayName: 'عمر المصور',
      role: 'artist',
      job: 'مصور فوتوغرافي',
      bio: 'مصور متخصص في التصوير الفوتوغرافي الفني والطبيعة',
      profileImage: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341480/image_14_ap4jkk.png',
        publicId: 'image_14_ap4jkk'
      },
      coverImages: [],
      socialLinks: {
        instagram: 'omar_photographer',
        website: 'https://omar-photos.com'
      },
      isActive: true,
      isVerified: true,
      followers: [],
      following: [],
      wishlist: [],
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      email: 'fatima.user@example.com',
      password: '$2b$10$hashedPassword101',
      displayName: 'فاطمة المستخدمة',
      role: 'user',
      job: 'مهندسة معمارية',
      bio: 'مهندسة معمارية تهتم بالفنون التشكيلية',
      profileImage: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341475/image_18_quawcy.png',
        publicId: 'image_18_quawcy'
      },
      coverImages: [],
      socialLinks: {},
      isActive: true,
      isVerified: true,
      followers: [],
      following: [],
      wishlist: [],
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d3'),
      email: 'ali.user@example.com',
      password: '$2b$10$hashedPassword202',
      displayName: 'علي المستخدم',
      role: 'user',
      job: 'طبيب',
      bio: 'طبيب يحب جمع الأعمال الفنية',
      profileImage: {
        url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341476/image_16_dpoqac.png',
        publicId: 'image_16_dpoqac'
      },
      coverImages: [],
      socialLinks: {},
      isActive: true,
      isVerified: true,
      followers: [],
      following: [],
      wishlist: [],
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18')
    }
  ],

  // Artworks Data
  artworks: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d4'),
      title: 'لوحة المناظر الطبيعية',
      description: 'لوحة زيتية جميلة تصور المناظر الطبيعية الخلابة مع ألوان دافئة ومتناغمة',
      images: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341482/image_13_mhcq4w.png',
          publicId: 'image_13_mhcq4w'
        },
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341484/image_12_qm6jdx.png',
          publicId: 'image_12_qm6jdx'
        }
      ],
      price: 2500,
      currency: 'SAR',
      status: 'available',
      category: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'), // رسم
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'), // أحمد الفنان
      tags: ['طبيعة', 'رسم زيتي', 'مناظر طبيعية'],
      isFramed: true,
      dimensions: {
        width: 80,
        height: 60,
        depth: 2
      },
      materials: ['زيت على قماش', 'إطار خشبي'],
      viewCount: 156,
      likeCount: 23,
      averageRating: 4.5,
      reviewsCount: 8,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d5'),
      title: 'منحوتة المرأة العارية',
      description: 'منحوتة رخامية كلاسيكية تصور جمال المرأة بأسلوب فني راقي',
      images: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341485/image_11_unagay.png',
          publicId: 'image_11_unagay'
        }
      ],
      price: 8500,
      currency: 'SAR',
      status: 'available',
      category: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cb'), // نحت
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d0'), // سارة النحاتة
      tags: ['نحت', 'رخام', 'كلاسيكي'],
      isFramed: false,
      dimensions: {
        width: 40,
        height: 120,
        depth: 30
      },
      materials: ['رخام أبيض'],
      viewCount: 89,
      likeCount: 15,
      averageRating: 4.8,
      reviewsCount: 5,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d6'),
      title: 'صورة غروب الشمس',
      description: 'صورة فوتوغرافية مذهلة لغروب الشمس على البحر بألوان ذهبية',
      images: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341487/image_10_ov2cpb.png',
          publicId: 'image_10_ov2cpb'
        }
      ],
      price: 1200,
      currency: 'SAR',
      status: 'available',
      category: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cd'), // تصوير
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d1'), // عمر المصور
      tags: ['تصوير', 'غروب الشمس', 'طبيعة'],
      isFramed: true,
      dimensions: {
        width: 60,
        height: 40,
        depth: 1
      },
      materials: ['طباعة فوتوغرافية', 'إطار زجاجي'],
      viewCount: 234,
      likeCount: 45,
      averageRating: 4.7,
      reviewsCount: 12,
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d7'),
      title: 'وعاء خزفي تقليدي',
      description: 'وعاء خزفي تقليدي مصنوع يدوياً بألوان ترابية جميلة',
      images: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341489/image_9_ls6uwm.png',
          publicId: 'image_9_ls6uwm'
        }
      ],
      price: 800,
      currency: 'SAR',
      status: 'sold',
      category: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cc'), // خزف
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'), // أحمد الفنان
      tags: ['خزف', 'تقليدي', 'يدوي'],
      isFramed: false,
      dimensions: {
        width: 25,
        height: 30,
        depth: 25
      },
      materials: ['طين خزفي', 'طلاء ترابي'],
      viewCount: 67,
      likeCount: 12,
      averageRating: 4.3,
      reviewsCount: 4,
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-01-28')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d8'),
      title: 'لوحة تجريدية حديثة',
      description: 'لوحة تجريدية حديثة بألوان حيوية وخطوط ديناميكية',
      images: [
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341482/image_13_mhcq4w.png',
          publicId: 'image_13_mhcq4w'
        },
        {
          url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341484/image_12_qm6jdx.png',
          publicId: 'image_12_qm6jdx'
        }
      ],
      price: 3500,
      currency: 'SAR',
      status: 'available',
      category: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'), // رسم
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d0'), // سارة النحاتة
      tags: ['تجريدي', 'حديث', 'ألوان حيوية'],
      isFramed: true,
      dimensions: {
        width: 100,
        height: 80,
        depth: 3
      },
      materials: ['أكريليك على قماش'],
      viewCount: 123,
      likeCount: 28,
      averageRating: 4.6,
      reviewsCount: 7,
      createdAt: new Date('2024-01-30'),
      updatedAt: new Date('2024-01-30')
    }
  ],

  // Reviews Data
  reviews: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d9'),
      artwork: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d4'),
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      user: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      rating: 5,
      title: 'لوحة رائعة',
      comment: 'اللوحة جميلة جداً والألوان متناغمة بشكل مذهل',
      pros: ['الألوان', 'التقنية', 'التناسق'],
      cons: [],
      subRatings: {
        creativity: 5,
        technique: 5,
        composition: 4
      },
      isRecommended: true,
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109da'),
      artwork: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d4'),
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      user: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d3'),
      rating: 4,
      title: 'عمل ممتاز',
      comment: 'العمل جميل ولكن يمكن تحسين الإطار',
      pros: ['الألوان', 'الفكرة'],
      cons: ['الإطار'],
      subRatings: {
        creativity: 4,
        technique: 4,
        composition: 4
      },
      isRecommended: true,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109db'),
      artwork: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d5'),
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d0'),
      user: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      rating: 5,
      title: 'منحوتة مذهلة',
      comment: 'التفاصيل في المنحوتة رائعة والرخام عالي الجودة',
      pros: ['التفاصيل', 'المواد', 'التقنية'],
      cons: [],
      subRatings: {
        creativity: 5,
        technique: 5,
        composition: 5
      },
      isRecommended: true,
      createdAt: new Date('2024-01-23'),
      updatedAt: new Date('2024-01-23')
    }
  ],

  // Follow Data
  follows: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109dc'),
      follower: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      following: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      createdAt: new Date('2024-01-20')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109dd'),
      follower: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d3'),
      following: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      createdAt: new Date('2024-01-21')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109de'),
      follower: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      following: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d0'),
      createdAt: new Date('2024-01-22')
    }
  ],

  // Chat Data
  chats: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109df'),
      participants: [
        new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
        new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf')
      ],
      lastMessage: {
        content: 'هل العمل متاح للشراء؟',
        sender: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
        messageType: 'text',
        createdAt: new Date('2024-01-25T10:30:00Z')
      },
      unreadCount: {
        [new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2').toString()]: 0,
        [new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf').toString()]: 1
      },
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    }
  ],

  // Messages Data
  messages: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e0'),
      chat: new mongoose.Types.ObjectId('60d0fe4f5311236168a109df'),
      sender: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      content: 'مرحباً، أنا مهتمة بلوحة المناظر الطبيعية',
      messageType: 'text',
      isRead: true,
      createdAt: new Date('2024-01-25T10:00:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e1'),
      chat: new mongoose.Types.ObjectId('60d0fe4f5311236168a109df'),
      sender: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      content: 'مرحباً، نعم العمل متاح للشراء',
      messageType: 'text',
      isRead: true,
      createdAt: new Date('2024-01-25T10:15:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e2'),
      chat: new mongoose.Types.ObjectId('60d0fe4f5311236168a109df'),
      sender: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      content: 'هل العمل متاح للشراء؟',
      messageType: 'text',
      isRead: false,
      createdAt: new Date('2024-01-25T10:30:00Z')
    }
  ],

  // Notifications Data
  notifications: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e3'),
      recipient: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      type: 'new_follower',
      title: 'متابع جديد',
      message: 'فاطمة المستخدمة بدأت في متابعتك',
      data: {
        followerId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
        followerName: 'فاطمة المستخدمة'
      },
      isRead: false,
      createdAt: new Date('2024-01-20T14:30:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e4'),
      recipient: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      type: 'new_review',
      title: 'تقييم جديد',
      message: 'حصلت على تقييم 5 نجوم على لوحة المناظر الطبيعية',
      data: {
        artworkId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d4'),
        artworkTitle: 'لوحة المناظر الطبيعية',
        rating: 5
      },
      isRead: true,
      createdAt: new Date('2024-01-21T09:15:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e5'),
      recipient: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      type: 'new_message',
      title: 'رسالة جديدة',
      message: 'أحمد الفنان أرسل لك رسالة جديدة',
      data: {
        chatId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109df'),
        senderId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
        senderName: 'أحمد الفنان'
      },
      isRead: false,
      createdAt: new Date('2024-01-25T10:15:00Z')
    }
  ],

  // Reports Data
  reports: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e6'),
      reporter: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      contentType: 'artwork',
      contentId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d4'),
      reason: 'inappropriate',
      description: 'العمل يحتوي على محتوى غير مناسب',
      status: 'pending',
      priority: 'medium',
      evidence: [],
      createdAt: new Date('2024-01-26'),
      updatedAt: new Date('2024-01-26')
    }
  ],

  // Special Requests Data
  specialRequests: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e7'),
      client: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d2'),
      artist: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      category: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
      title: 'لوحة بورتريه عائلية',
      description: 'أريد لوحة بورتريه لعائلتي بأسلوب كلاسيكي',
      budget: 5000,
      deadline: new Date('2024-03-15'),
      requirements: [
        'أسلوب كلاسيكي',
        'ألوان دافئة',
        'حجم كبير'
      ],
      status: 'pending',
      attachments: [],
      createdAt: new Date('2024-01-27'),
      updatedAt: new Date('2024-01-27')
    }
  ],

  // Transactions Data
  transactions: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e8'),
      buyer: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d3'),
      seller: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      items: [
        {
          artworkId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109d7'),
          quantity: 1,
          price: 800
        }
      ],
      totalAmount: 800,
      currency: 'SAR',
      status: 'completed',
      payment: {
        method: 'credit_card',
        provider: 'stripe',
        transactionId: 'txn_123456789'
      },
      shipping: {
        address: {
          fullName: 'علي المستخدم',
          addressLine1: 'شارع الملك فهد',
          city: 'الرياض',
          country: 'السعودية',
          phoneNumber: '+966501234567'
        },
        method: 'standard'
      },
      createdAt: new Date('2024-01-29'),
      updatedAt: new Date('2024-01-29')
    }
  ],

  // Tokens Data (for authentication)
  tokens: [
    {
      _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109e9'),
      userId: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
      token: 'refresh_token_123456',
      type: 'refresh',
      expiresAt: new Date('2024-12-31'),
      isRevoked: false,
      createdAt: new Date('2024-01-20')
    }
  ]
};

// Helper function to seed database
const seedDatabase = async (db) => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await db.collection('categories').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('artworks').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('follows').deleteMany({});
    await db.collection('chats').deleteMany({});
    await db.collection('messages').deleteMany({});
    await db.collection('notifications').deleteMany({});
    await db.collection('reports').deleteMany({});
    await db.collection('specialrequests').deleteMany({});
    await db.collection('transactions').deleteMany({});
    await db.collection('tokens').deleteMany({});

    // Insert mock data
    if (mockData.categories.length > 0) {
      await db.collection('categories').insertMany(mockData.categories);
      console.log(`✅ Inserted ${mockData.categories.length} categories`);
    }

    if (mockData.users.length > 0) {
      await db.collection('users').insertMany(mockData.users);
      console.log(`✅ Inserted ${mockData.users.length} users`);
    }

    if (mockData.artworks.length > 0) {
      await db.collection('artworks').insertMany(mockData.artworks);
      console.log(`✅ Inserted ${mockData.artworks.length} artworks`);
    }

    if (mockData.reviews.length > 0) {
      await db.collection('reviews').insertMany(mockData.reviews);
      console.log(`✅ Inserted ${mockData.reviews.length} reviews`);
    }

    if (mockData.follows.length > 0) {
      await db.collection('follows').insertMany(mockData.follows);
      console.log(`✅ Inserted ${mockData.follows.length} follows`);
    }

    if (mockData.chats.length > 0) {
      await db.collection('chats').insertMany(mockData.chats);
      console.log(`✅ Inserted ${mockData.chats.length} chats`);
    }

    if (mockData.messages.length > 0) {
      await db.collection('messages').insertMany(mockData.messages);
      console.log(`✅ Inserted ${mockData.messages.length} messages`);
    }

    if (mockData.notifications.length > 0) {
      await db.collection('notifications').insertMany(mockData.notifications);
      console.log(`✅ Inserted ${mockData.notifications.length} notifications`);
    }

    if (mockData.reports.length > 0) {
      await db.collection('reports').insertMany(mockData.reports);
      console.log(`✅ Inserted ${mockData.reports.length} reports`);
    }

    if (mockData.specialRequests.length > 0) {
      await db.collection('specialrequests').insertMany(mockData.specialRequests);
      console.log(`✅ Inserted ${mockData.specialRequests.length} special requests`);
    }

    if (mockData.transactions.length > 0) {
      await db.collection('transactions').insertMany(mockData.transactions);
      console.log(`✅ Inserted ${mockData.transactions.length} transactions`);
    }

    if (mockData.tokens.length > 0) {
      await db.collection('tokens').insertMany(mockData.tokens);
      console.log(`✅ Inserted ${mockData.tokens.length} tokens`);
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = {
  mockData,
  seedDatabase
}; 