// Update Swagger with Artist Management endpoints
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const swaggerJsonPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger.json');
const swaggerBackupPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger-backup.json');

console.log('🔄 Updating Swagger with Artist Management endpoints...');

try {
  // Create backup
  if (fs.existsSync(swaggerJsonPath)) {
    const currentSwagger = fs.readFileSync(swaggerJsonPath, 'utf8');
    fs.writeFileSync(swaggerBackupPath, currentSwagger);
    console.log('✅ Backup created successfully');
  }

  // Read current swagger
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));

  // Add Artist Management tag if not exists
  if (!swaggerDocument.tags) {
    swaggerDocument.tags = [];
  }

  const artistManagementTag = {
    name: 'Artist Management',
    description: 'واجهات API لإدارة الفنانين في الداشبورد الإداري',
    'x-displayName': 'إدارة الفنانين'
  };

  // Check if tag already exists
  const existingTagIndex = swaggerDocument.tags.findIndex(tag => tag.name === 'Artist Management');
  if (existingTagIndex === -1) {
    swaggerDocument.tags.push(artistManagementTag);
    console.log('✅ Added Artist Management tag');
  } else {
    console.log('ℹ️ Artist Management tag already exists');
  }

  // Add tag groups if not exists
  if (!swaggerDocument['x-tagGroups']) {
    swaggerDocument['x-tagGroups'] = [];
  }

  // Find or create Administration group
  let adminGroup = swaggerDocument['x-tagGroups'].find(group => group.name === 'الإدارة');
  if (!adminGroup) {
    adminGroup = {
      name: 'الإدارة',
      tags: []
    };
    swaggerDocument['x-tagGroups'].push(adminGroup);
  }

  // Add Artist Management to admin group if not exists
  if (!adminGroup.tags.includes('Artist Management')) {
    adminGroup.tags.push('Artist Management');
    console.log('✅ Added Artist Management to admin group');
  }

  // Write updated swagger
  fs.writeFileSync(swaggerJsonPath, JSON.stringify(swaggerDocument, null, 2));
  console.log('✅ Swagger updated successfully');

  // Validate JSON
  try {
    JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));
    console.log('✅ JSON validation passed');
  } catch (error) {
    console.error('❌ JSON validation failed:', error.message);
    // Restore backup
    if (fs.existsSync(swaggerBackupPath)) {
      fs.copyFileSync(swaggerBackupPath, swaggerJsonPath);
      console.log('✅ Restored from backup');
    }
    process.exit(1);
  }

  console.log('🎉 Swagger update completed successfully!');
  console.log('📚 New endpoints available:');
  console.log('   - GET /api/admin/artists');
  console.log('   - GET /api/admin/artists/{artistId}');
  console.log('   - PATCH /api/admin/artists/{artistId}/status');

} catch (error) {
  console.error('❌ Error updating Swagger:', error.message);
  
  // Restore backup if available
  if (fs.existsSync(swaggerBackupPath)) {
    try {
      fs.copyFileSync(swaggerBackupPath, swaggerJsonPath);
      console.log('✅ Restored from backup');
    } catch (restoreError) {
      console.error('❌ Failed to restore from backup:', restoreError.message);
    }
  }
  
  process.exit(1);
} 