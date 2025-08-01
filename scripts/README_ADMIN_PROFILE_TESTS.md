# Admin Profile Update Testing Guide

This guide explains how to test the `PUT /api/admin/profile` endpoint functionality.

## Overview

The `PUT /api/admin/profile` endpoint now supports:
- ✅ Partial updates (only send the fields you want to update)
- ✅ `displayName` updates
- ✅ `email` updates  
- ✅ `profileImage` uploads
- ✅ Password changes (`currentPassword`, `newPassword`, `confirmNewPassword`)

## Test Scripts

### 1. Get Admin Token (`get-admin-token.js`)

First, you need a valid admin token to run the tests:

```bash
node scripts/get-admin-token.js
```

**Before running:**
1. Update the `ADMIN_CREDENTIALS` in the script with actual admin credentials
2. Make sure your server is running

**Output:**
- Valid admin token
- Token validation test
- Instructions for using the token

### 2. Run Profile Update Tests (`test-admin-profile-update.js`)

Test all functionality of the profile update endpoint:

```bash
node scripts/test-admin-profile-update.js
```

**Before running:**
1. Get a valid admin token using the script above
2. Update the `TEST_TOKEN` in the script with your valid token
3. Or set environment variable: `ADMIN_TEST_TOKEN=your_token_here`

## Test Cases Covered

### ✅ Success Cases (Partial Updates)
1. **Update displayName only**
2. **Update email only** 
3. **Update profileImage only**
4. **Update password only**
5. **Combined update (displayName + email)**
6. **Combined update with image**
7. **Combined update with password change**
8. **Full update (all fields)**

### ❌ Validation Error Cases
9. **Invalid email format**
10. **Password mismatch**
11. **Missing currentPassword when changing password**
12. **Missing confirmNewPassword**
13. **Weak password (doesn't meet requirements)**
14. **Empty request body**
15. **Unauthorized access (no token)**

## How Partial Updates Work

The endpoint supports partial updates - you only need to send the fields you want to update:

```javascript
// Update only displayName
PUT /api/admin/profile
{
  "displayName": "أحمد محمد الجديد"
}

// Update only email
PUT /api/admin/profile  
{
  "email": "new.email@example.com"
}

// Update displayName and email together
PUT /api/admin/profile
{
  "displayName": "أحمد محمد الجديد",
  "email": "new.email@example.com"
}

// Update with image upload
PUT /api/admin/profile (multipart/form-data)
{
  "displayName": "أحمد محمد مع الصورة",
  "profileImage": [file]
}

// Update password
PUT /api/admin/profile
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!", 
  "confirmNewPassword": "NewPassword123!"
}
```

## Password Requirements

When updating password, the new password must:
- Be at least 8 characters long
- Be maximum 50 characters
- Contain at least one uppercase letter
- Contain at least one lowercase letter  
- Contain at least one number
- Contain at least one special character (@$!%*?&)

## Image Upload Requirements

When uploading a profile image:
- Supported formats: JPEG, PNG, JPG, GIF, WebP
- Maximum size: 5MB
- Field name must be: `profileImage`

## Environment Variables

You can set these environment variables:

```bash
BASE_URL=http://localhost:3000  # Your API base URL
ADMIN_TEST_TOKEN=your_token_here  # Valid admin token for testing
```

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: 
   - Token is invalid or expired
   - Get a new token using `get-admin-token.js`

2. **400 Bad Request**:
   - Validation errors (check error message)
   - Missing required fields for password change

3. **500 Server Error**:
   - Check server logs
   - Verify database connection
   - Check Cloudinary configuration

### Getting Valid Admin Credentials:

If you don't have admin credentials, you can:

1. **Check existing admin accounts** in your database
2. **Create a new admin account** using the registration endpoint
3. **Use the superadmin account** if it exists

## Example Usage

```bash
# 1. Get admin token
node scripts/get-admin-token.js

# 2. Copy the token and update the test script
# 3. Run the tests
node scripts/test-admin-profile-update.js
```

## Expected Results

When tests pass successfully, you should see:
- ✅ All success cases pass
- ✅ All validation error cases pass  
- ✅ Partial updates work correctly
- ✅ Image uploads work correctly
- ✅ Password changes work correctly 