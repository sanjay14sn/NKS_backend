// config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Debug logs to confirm env vars are loaded
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Cloudinary env variables are missing!");
} else {
  console.log("✅ Cloudinary env loaded:",
    { cloud: process.env.CLOUDINARY_CLOUD_NAME }
  );
}

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "categories", // all uploads go to categories folder
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
