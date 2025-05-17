
import { Router } from 'express';
import { fileUpload, filterObject } from '../../utils/multer.js';
import * as imageController from './controller/image.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { createImageSchema, updateImageSchema } from './image.validation.js';

const router = Router();

// Upload images (supports both auth methods)
router.post('/upload', 
  isAuthenticated, 
  fileUpload(filterObject.image).array('images', 10),
  isValidation(createImageSchema),
  imageController.uploadImages
);

// Upload with Firebase auth
router.post('/upload/firebase', 
  verifyFirebaseToken, 
  fileUpload(filterObject.image).array('images', 10),
  isValidation(createImageSchema),
  imageController.uploadImages
);

// Get all user images with pagination and filtering
router.get('/my-images', 
  isAuthenticated, 
  imageController.getUserImages
);

// Get images by Firebase auth
router.get('/my-images/firebase', 
  verifyFirebaseToken, 
  imageController.getUserImages
);

// Get image details by ID
router.get('/:imageId', 
  imageController.getImageById
);

// Update image metadata
router.patch('/:imageId', 
  isAuthenticated,
  isValidation(updateImageSchema),
  imageController.updateImageMetadata
);

// Update image with Firebase auth
router.patch('/:imageId/firebase', 
  verifyFirebaseToken,
  isValidation(updateImageSchema),
  imageController.updateImageMetadata
);

// Delete image
router.delete('/:publicId', 
  isAuthenticated, 
  imageController.deleteImage
);

// Delete with Firebase auth
router.delete('/:publicId/firebase', 
  verifyFirebaseToken, 
  imageController.deleteImage
);

// Get popular categories
router.get('/categories/popular', 
  imageController.getImageCategories
);

export default router;
