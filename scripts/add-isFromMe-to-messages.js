/**
 * Migration Script: Add isFromMe field to existing messages
 * Run this script to update all existing messages with isFromMe field
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import messageModel from '../DB/models/message.model.js';
import chatModel from '../DB/models/chat.model.js';

async function addIsFromMeToMessages() {
  try {
    console.log('🚀 Starting migration: Adding isFromMe field to messages...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all messages
    const messages = await messageModel.find({}).populate('chat', 'members');
    console.log(`📝 Found ${messages.length} messages to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const message of messages) {
      try {
        // Check if message already has isFromMe field
        if (message.isFromMe !== undefined) {
          skippedCount++;
          continue;
        }
        
        // Get chat members to determine if message is from current user
        if (!message.chat || !message.chat.members) {
          console.log(`⚠️ Skipping message ${message._id}: No chat or members found`);
          skippedCount++;
          continue;
        }
        
        // For now, we'll set isFromMe based on sender (this is a simplified approach)
        // In a real scenario, you might want to set this based on the actual user context
        const isFromMe = false; // Default to false for existing messages
        
        // Update the message
        await messageModel.findByIdAndUpdate(message._id, {
          $set: { isFromMe: isFromMe }
        });
        
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`📊 Updated ${updatedCount} messages...`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating message ${message._id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Updated: ${updatedCount} messages`);
    console.log(`⏭️ Skipped: ${skippedCount} messages`);
    console.log(`📊 Total processed: ${messages.length} messages`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
addIsFromMeToMessages();
