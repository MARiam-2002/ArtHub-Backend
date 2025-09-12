import mongoose from 'mongoose';
import artworkModel from '../DB/models/artwork.model.js';
import reviewModel from '../DB/models/review.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

/**
 * Script to update artwork stats (rating, reviewsCount) for existing artworks
 * This will calculate and save the correct values for all artworks
 */

async function updateArtworkStats() {
  try {
    console.log('🔄 Starting artwork stats update...');
    
    // Connect to database
    await ensureDatabaseConnection();
    console.log('✅ Connected to database');

    // Get all artworks
    const artworks = await artworkModel.find({}).lean();
    console.log(`📊 Found ${artworks.length} artworks to update`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const artwork of artworks) {
      try {
        console.log(`\n🎨 Processing artwork: ${artwork.title} (${artwork._id})`);

        // Get reviews for this artwork
        const reviews = await reviewModel.find({ 
          artwork: artwork._id, 
          status: 'active' 
        }).lean();

        const reviewsCount = reviews.length;
        const averageRating = reviewsCount 
          ? parseFloat((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsCount).toFixed(2))
          : 0;

        console.log(`   📈 Reviews: ${reviewsCount}, Rating: ${averageRating}`);

        // Update artwork with calculated stats
        await artworkModel.findByIdAndUpdate(artwork._id, {
          reviewsCount,
          averageRating,
          // Keep existing likeCount and viewCount if they exist
          likeCount: artwork.likeCount || 0,
          viewCount: artwork.viewCount || 0
        });

        console.log(`   ✅ Updated successfully`);
        updatedCount++;

      } catch (error) {
        console.error(`   ❌ Error updating artwork ${artwork._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Update completed!`);
    console.log(`✅ Successfully updated: ${updatedCount} artworks`);
    console.log(`❌ Errors: ${errorCount} artworks`);

    // Show some examples
    console.log(`\n📊 Sample updated artworks:`);
    const sampleArtworks = await artworkModel.find({})
      .select('title reviewsCount averageRating likeCount viewCount')
      .limit(5)
      .lean();

    sampleArtworks.forEach(artwork => {
      console.log(`   🎨 ${artwork.title}:`);
      console.log(`      Reviews: ${artwork.reviewsCount}, Rating: ${artwork.averageRating}`);
      console.log(`      Likes: ${artwork.likeCount}, Views: ${artwork.viewCount}`);
    });

  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
updateArtworkStats();
