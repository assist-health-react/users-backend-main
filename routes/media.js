const express = require('express');
const router = express.Router();

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path')

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      
      if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Invalid file type');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }
      cb(null, true);
    }
});

// Helper function to generate secure random filename
const generateSecureFilename = (originalname) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalname);
    return `${timestamp}-${randomString}${extension}`;
};

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided'
          }
        });
      }
  
      const file = req.file;
      const secureFilename = generateSecureFilename(file.originalname);
  
      // Prepare S3 upload parameters
      const uploadParams = {
        Bucket: `assisthealth-media`,
        Key: `uploads/${secureFilename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make sure your bucket policy allows this
        ServerSideEncryption: 'AES256' // Enable server-side encryption
      };
  
      // Upload to S3 using AWS SDK v3
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      
      // Generate the S3 URL
      const imageUrl = `https://assisthealth-media.s3.ap-south-1.amazonaws.com/uploads/${secureFilename}`;
  
      // Return success response
      res.status(200).json({
        success: true,
        imageUrl: imageUrl,
        metadata: {
          fileName: secureFilename,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString()
        }
      });
  
    } catch (error) {
      console.error('Upload error:', error);
  
      // Handle specific error types
      if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: 'File type not supported',
            details: {
              allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
            }
          }
        });
      }
  
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: 'File size exceeds limit',
            details: {
              maxSize: 5 * 1024 * 1024 // 5MB in bytes
            }
          }
        });
      }
  
      // Generic error response
      res.status(503).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload to storage service',
          details: {
            retryAfter: 30
          }
        }
      });
    }
});

module.exports = router;