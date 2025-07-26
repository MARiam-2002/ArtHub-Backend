// Add missing schemas to Swagger
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const swaggerJsonPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger.json');
const swaggerBackupPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger-backup.json');

console.log('🔧 Adding missing schemas to Swagger...');

try {
  // Create backup
  if (fs.existsSync(swaggerJsonPath)) {
    const currentSwagger = fs.readFileSync(swaggerJsonPath, 'utf8');
    fs.writeFileSync(swaggerBackupPath, currentSwagger);
    console.log('✅ Backup created successfully');
  }

  // Read current swagger
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));

  // Missing schemas to add
  const missingSchemas = {
    "User": {
      "type": "object",
      "properties": {
        "_id": {
          "type": "string",
          "example": "507f1f77bcf86cd799439011"
        },
        "email": {
          "type": "string",
          "format": "email",
          "example": "user@example.com"
        },
        "displayName": {
          "type": "string",
          "example": "أحمد محمد"
        },
        "role": {
          "type": "string",
          "enum": ["user", "artist"],
          "example": "artist"
        },
        "profileImage": {
          "type": "object",
          "properties": {
            "url": {
              "type": "string"
            },
            "publicId": {
              "type": "string"
            }
          }
        },
        "isActive": {
          "type": "boolean",
          "example": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "UpdateArtworkRequest": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "minLength": 3,
          "maxLength": 100
        },
        "description": {
          "type": "string",
          "maxLength": 1000
        },
        "price": {
          "type": "number",
          "minimum": 1,
          "maximum": 1000000
        },
        "category": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "status": {
          "type": "string",
          "enum": ["available", "sold", "reserved"]
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "CreateNotificationSchema": {
      "type": "object",
      "required": ["title", "body"],
      "properties": {
        "title": {
          "type": "object",
          "properties": {
            "ar": {
              "type": "string"
            },
            "en": {
              "type": "string"
            }
          }
        },
        "body": {
          "type": "object",
          "properties": {
            "ar": {
              "type": "string"
            },
            "en": {
              "type": "string"
            }
          }
        },
        "data": {
          "type": "object"
        }
      }
    },
    "FCMTokenSchema": {
      "type": "object",
      "required": ["fcmToken"],
      "properties": {
        "fcmToken": {
          "type": "string"
        }
      }
    },
    "CreateArtworkReviewRequest": {
      "type": "object",
      "required": ["rating"],
      "properties": {
        "rating": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5
        },
        "comment": {
          "type": "string",
          "maxLength": 500
        }
      }
    },
    "Review": {
      "type": "object",
      "properties": {
        "_id": {
          "type": "string"
        },
        "rating": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5
        },
        "comment": {
          "type": "string"
        },
        "reviewer": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string"
            },
            "displayName": {
              "type": "string"
            }
          }
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "CreateTransactionRequest": {
      "type": "object",
      "required": ["artworkId", "amount"],
      "properties": {
        "artworkId": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "amount": {
          "type": "number",
          "minimum": 1
        },
        "shippingDetails": {
          "type": "object"
        }
      }
    },
    "Transaction": {
      "type": "object",
      "properties": {
        "_id": {
          "type": "string"
        },
        "amount": {
          "type": "number"
        },
        "status": {
          "type": "string",
          "enum": ["pending", "completed", "cancelled", "failed"]
        },
        "artwork": {
          "type": "object"
        },
        "buyer": {
          "type": "object"
        },
        "artist": {
          "type": "object"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "ShippingDetails": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "postalCode": {
          "type": "string"
        },
        "phone": {
          "type": "string"
        }
      }
    }
  };

  // Add missing schemas
  let addedCount = 0;
  for (const [schemaName, schema] of Object.entries(missingSchemas)) {
    if (!swaggerDocument.components.schemas[schemaName]) {
      swaggerDocument.components.schemas[schemaName] = schema;
      console.log(`✅ Added schema: ${schemaName}`);
      addedCount++;
    } else {
      console.log(`ℹ️ Schema already exists: ${schemaName}`);
    }
  }

  if (addedCount > 0) {
    console.log(`📊 Added ${addedCount} new schemas`);
  } else {
    console.log('ℹ️ No new schemas to add');
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

  // Final check for any remaining missing references
  const swaggerContent = fs.readFileSync(swaggerJsonPath, 'utf8');
  const refMatches = swaggerContent.match(/\$ref": "#\/components\/schemas\/([^"]+)"/g);
  
  if (refMatches) {
    const refs = refMatches.map(match => {
      const schemaName = match.match(/#\/components\/schemas\/([^"]+)/)[1];
      return schemaName;
    });
    
    const uniqueRefs = [...new Set(refs)];
    console.log('📋 Total schema references:', uniqueRefs.length);
    
    // Check if all referenced schemas exist
    const missingRefs = uniqueRefs.filter(ref => !swaggerDocument.components.schemas[ref]);
    
    if (missingRefs.length > 0) {
      console.log('⚠️ Still missing schema references:', missingRefs);
    } else {
      console.log('✅ All schema references are now valid');
    }
  }

  console.log('🎉 Missing schemas fix completed successfully!');
  console.log('📚 Swagger Documentation: http://localhost:3000/api-docs');
  console.log('🔍 Check for "Artist Management" section');

} catch (error) {
  console.error('❌ Error adding missing schemas:', error.message);
  
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