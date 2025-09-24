const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Debug logs
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Cloudinary env variables are missing!");
} else {
  console.log("✅ Cloudinary env loaded:", { cloud: process.env.CLOUDINARY_CLOUD_NAME });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Categories storage
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "categories",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});
const uploadCategory = multer({ storage: categoryStorage });

// Products storage
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});
const uploadProduct = multer({ storage: productStorage });

// Profile pictures storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});
const uploadProfilePicture = multer({ storage: profileStorage });

module.exports = { cloudinary, uploadCategory, uploadProduct, uploadProfilePicture };
