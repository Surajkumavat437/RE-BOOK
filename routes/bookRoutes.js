const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const { isLoggedIn, isOwner } = require("../middleware/authMiddleware");
const upload = require("../utils/multerConfig");

router.get("/", bookController.listAllBooks);
router.get("/search", bookController.searchBooks);
router.get("/info", bookController.aboutContact);
router.get("/new", isLoggedIn, bookController.renderNewBookForm);
router.post(
  "/new",
  isLoggedIn,
  upload.single("image"),
  bookController.createNewBook
);
router.get("/:id", bookController.showBook);
router.get("/:id/edit", isLoggedIn, isOwner, bookController.renderEditForm);
router.put(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  upload.single("image"),
  bookController.updateBook
);
router.delete("/:id", isLoggedIn, isOwner, bookController.deleteBook);

module.exports = router;
