const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    enum: ["New", "Good", "Old"],
    default: "Good",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  imageId: {
    type: String,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Book", bookSchema);
