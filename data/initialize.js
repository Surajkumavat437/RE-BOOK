const mongoose = require("mongoose");
const booksData = require("./booksData.js");
const Book = require("../models/Book.js");

async function dataInitialization() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/E-BOOKS");
    console.log("MongoDB Conneted");

    await Book.deleteMany({});
    console.log("Old books cleared");

    await Book.insertMany(booksData);
    console.log("Books data inserted ");

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.log("Error seeding DB", err);
  }
}

dataInitialization();
