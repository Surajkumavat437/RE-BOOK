const Book = require("../models/Book");
const User = require("../models/User");
const asyncWrap = require("../utils/async");
const cloudinary = require("cloudinary").v2;

exports.listAllBooks = asyncWrap(async (req, res) => {
  const listingBooks = await Book.find({});
  res.render("listings/index", { listingBooks });
});

exports.searchBooks = asyncWrap(async (req, res) => {
  const query = req.query.q || "";
  const listings = await Book.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  });
  res.render("listings/searchResults", { listings, query });
});

exports.aboutContact = asyncWrap(async (req, res) => {
  res.render("listings/aboutContact");
});

exports.renderNewBookForm = (req, res) => {
  res.render("listings/new");
};

exports.createNewBook = asyncWrap(async (req, res) => {
  const { title, author, condition, price, description } = req.body;
  const newBook = new Book({
    title,
    author,
    price,
    condition,
    description,
    image: req.file ? req.file.path : "",
    imageId: req.file ? req.file.filename : "",
    uploader: req.session.userId,
  });
  await newBook.save();
  req.flash("success", "Book added successfully");
  res.redirect("/listing");
});

exports.showBook = asyncWrap(async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const currentUser = await User.findById(userId);
  const showListing = await Book.findById(id).populate("uploader");
  res.render("listings/show", { showListing, currentUser, userId });
});

exports.renderEditForm = asyncWrap(async (req, res) => {
  const { id } = req.params;
  const showListing = await Book.findById(id);
  res.render("listings/update", { showListing });
});

exports.updateBook = asyncWrap(async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const updatedBook = await Book.findByIdAndUpdate(id, updatedData, {
    runValidators: true,
    new: true,
  });
  req.flash("success", "Book Edited successfully");
  res.redirect(`/listing/${id}`);
});

exports.deleteBook = asyncWrap(async (req, res) => {
  const { id } = req.params;
  const book = await Book.findById(id);
  if (book.imageId) {
    await cloudinary.uploader.destroy(book.imageId);
  }
  await Book.findByIdAndDelete(id);
  req.flash("success", "Book deleted successfully");
  res.redirect("/listing");
});
