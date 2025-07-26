const Book = require("../models/Book");
const AppError = require("../utils/AppError");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    req.flash("error", "Please login first");
    return res.redirect("/home/login");
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const book = await Book.findById(id);
  if (!book) {
    req.flash("error", "Book not found");
    return res.redirect("/listing");
  }
  if (!book.uploader.equals(req.session.userId)) {
    req.flash("error", "You are not authorized to do this");
    return res.redirect(`/listing/${id}`);
  }
  next();
};
