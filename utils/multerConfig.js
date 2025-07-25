const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "booklisting",
    allowed_formats: ["jpeg", "png", "jpg", "webp"],
    transformation: [
      {
        width: 800,
        height: 600,
        crop: "limit",
        quality: "auto:best",
      },
    ],
  },
});

const upload = multer({ storage });

module.exports = upload;
