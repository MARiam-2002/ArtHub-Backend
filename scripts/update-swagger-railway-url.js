import fs from 'fs';
import path from 'path';

const OLD_URL = 'https://arthub-api.vercel.app';
const NEW_URL = 'https://arthub-backend.up.railway.app';

const OLD_URL_API = 'https://arthub-api.vercel.app/api';
const NEW_URL_API = 'https://arthub-backend.up.railway.app/api';

const OLD_POSTMAN_URL = 'https://your-api-url.vercel.app/api';
const NEW_POSTMAN_URL = 'https://arthub-backend.up.railway.app/api';

/**
 * Update URLs in a file
 */
function updateUrlsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update main URL
    if (content.includes(OLD_URL)) {
      content = content.replace(new RegExp(OLD_URL, 'g'), NEW_URL);
      updated = true;
    }

    // Update API URL
    if (content.includes(OLD_URL_API)) {
      content = content.replace(new RegExp(OLD_URL_API, 'g'), NEW_URL_API);
      updated = true;
    }

    // Update Postman URL
    if (content.includes(OLD_POSTMAN_URL)) {
      content = content.replace(new RegExp(OLD_POSTMAN_URL, 'g'), NEW_POSTMAN_URL);
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️ No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function to update all Swagger files
 */
async function updateAllSwaggerFiles() {
  console.log('🚀 Updating Swagger files with Railway URL...\n');

  const filesToUpdate = [
    'src/swagger/arthub-swagger.json',
    'src/swagger/swagger.json',
    'src/swagger/arthub-swagger-backup.json',
    'swagger.json',
    'docs/api/Admin_Dashboard_Complete_Postman_Collection.json',
    'Admin_Dashboard_Fixed_Collection.json'
  ];

  let updatedCount = 0;
  let totalCount = 0;

  for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
      totalCount++;
      if (updateUrlsInFile(filePath)) {
        updatedCount++;
      }
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`📁 Total processed: ${totalCount} files`);
  console.log(`\n🎯 New Railway URL: ${NEW_URL}`);
  console.log(`🔗 API Base URL: ${NEW_URL_API}`);
}

// Run the update
updateAllSwaggerFiles().catch(console.error); 