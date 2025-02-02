import express from 'express';
import multer from 'multer';
import cloudinary from '../cloudinary/cloudinaryConfig.js';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Upload image to Cloudinary
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chat-images', // Optional: Organize images in a folder
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    // Return the Cloudinary URL to the frontend
    res.status(200).json({ fileUrl: result.secure_url });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

export default router;