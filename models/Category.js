const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      url: { type: String, default: null },       // Cloudinary URL
      public_id: { type: String, default: null }, // For deletion
    },
  },
  { timestamps: true }
);

// Pre-save middleware to generate slug from title if not provided
categorySchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // trim dashes at start/end
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
