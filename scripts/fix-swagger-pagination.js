// Fix Swagger PaginationMeta schema issue
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const swaggerJsonPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger.json');
const swaggerBackupPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger-backup.json');

console.log('🔧 Fixing Swagger PaginationMeta schema issue...');

try {
  // Create backup
  if (fs.existsSync(swaggerJsonPath)) {
    const currentSwagger = fs.readFileSync(swaggerJsonPath, 'utf8');
    fs.writeFileSync(swaggerBackupPath, currentSwagger);
    console.log('✅ Backup created successfully');
  }

  // Read current swagger
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));

  // Check if PaginationMeta already exists
  if (!swaggerDocument.components.schemas.PaginationMeta) {
    console.log('❌ PaginationMeta schema not found, adding it...');
    
    // Add PaginationMeta schema
    swaggerDocument.components.schemas.PaginationMeta = {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "minimum": 1,
          "description": "Current page number",
          "example": 1
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "description": "Number of items per page",
          "example": 10
        },
        "total": {
          "type": "integer",
          "minimum": 0,
          "description": "Total number of items",
          "example": 50
        },
        "pages": {
          "type": "integer",
          "minimum": 0,
          "description": "Total number of pages",
          "example": 5
        },
        "hasNext": {
          "type": "boolean",
          "description": "Whether there is a next page",
          "example": true
        },
        "hasPrev": {
          "type": "boolean",
          "description": "Whether there is a previous page",
          "example": false
        }
      }
    };
    
    console.log('✅ PaginationMeta schema added successfully');
  } else {
    console.log('ℹ️ PaginationMeta schema already exists');
  }

  // Check for other missing schemas
  const missingSchemas = [];
  
  // Check for PaginationResponse
  if (!swaggerDocument.components.schemas.PaginationResponse) {
    missingSchemas.push('PaginationResponse');
  }
  
  // Check for PaginationInfo
  if (!swaggerDocument.components.schemas.PaginationInfo) {
    missingSchemas.push('PaginationInfo');
  }

  if (missingSchemas.length > 0) {
    console.log('⚠️ Missing schemas found:', missingSchemas.join(', '));
    
    // Add PaginationResponse if missing
    if (!swaggerDocument.components.schemas.PaginationResponse) {
      swaggerDocument.components.schemas.PaginationResponse = {
        "type": "object",
        "properties": {
          "page": {
            "type": "integer",
            "minimum": 1,
            "example": 1
          },
          "limit": {
            "type": "integer",
            "minimum": 1,
            "example": 10
          },
          "total": {
            "type": "integer",
            "minimum": 0,
            "example": 50
          },
          "pages": {
            "type": "integer",
            "minimum": 0,
            "example": 5
          },
          "hasNext": {
            "type": "boolean",
            "example": true
          },
          "hasPrev": {
            "type": "boolean",
            "example": false
          }
        }
      };
      console.log('✅ PaginationResponse schema added');
    }
    
    // Add PaginationInfo if missing
    if (!swaggerDocument.components.schemas.PaginationInfo) {
      swaggerDocument.components.schemas.PaginationInfo = {
        "type": "object",
        "properties": {
          "page": {
            "type": "integer",
            "minimum": 1,
            "example": 1
          },
          "limit": {
            "type": "integer",
            "minimum": 1,
            "example": 10
          },
          "total": {
            "type": "integer",
            "minimum": 0,
            "example": 50
          },
          "pages": {
            "type": "integer",
            "minimum": 0,
            "example": 5
          },
          "hasNext": {
            "type": "boolean",
            "example": true
          },
          "hasPrev": {
            "type": "boolean",
            "example": false
          }
        }
      };
      console.log('✅ PaginationInfo schema added');
    }
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

  // Check for any remaining $ref issues
  const swaggerContent = fs.readFileSync(swaggerJsonPath, 'utf8');
  const refMatches = swaggerContent.match(/\$ref": "#\/components\/schemas\/([^"]+)"/g);
  
  if (refMatches) {
    const refs = refMatches.map(match => {
      const schemaName = match.match(/#\/components\/schemas\/([^"]+)/)[1];
      return schemaName;
    });
    
    const uniqueRefs = [...new Set(refs)];
    console.log('📋 Found schema references:', uniqueRefs);
    
    // Check if all referenced schemas exist
    const missingRefs = uniqueRefs.filter(ref => !swaggerDocument.components.schemas[ref]);
    
    if (missingRefs.length > 0) {
      console.log('⚠️ Missing schema references:', missingRefs);
    } else {
      console.log('✅ All schema references are valid');
    }
  }

  console.log('🎉 Swagger fix completed successfully!');
  console.log('📚 Swagger Documentation: http://localhost:3000/api-docs');
  console.log('🔍 Check for "Artist Management" section');

} catch (error) {
  console.error('❌ Error fixing Swagger:', error.message);
  
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