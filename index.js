require("dotenv").config();
const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const asyncWrap = require("./utils/async.js");
const AppError = require("./utils/AppError.js");
const User = require("./models/User.js");
const Book = require("./models/Book.js");
const booksData = require("./data/booksData.js");
const upload = require("./utils/multerConfig.js");
const cloudinary = require("cloudinary").v2;

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(flash());

main()
  .then(() => {
    console.log("server connected successfully");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/E-BOOKS");
}

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.session = req.session;
  next();
});

function isLoggedIn(req, res, next) {
  if (!req.session.userId) {
    req.flash("error", "Please login first");
    return res.redirect("/home/login");
  }
  next();
}

const isOwner = async (req, res, next) => {
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

app.get(
  "/home",
  asyncWrap(async (req, res) => {
    res.render("listings/home.ejs");
  })
);

app.get(
  "/home/signup",
  asyncWrap(async (req, res) => {
    res.render("listings/signup.ejs");
  })
);

app.post(
  "/home/signup",
  asyncWrap(async (req, res) => {
    const { username, email, college, password } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({
      username,
      email,
      college,
      password: hashedPassword,
    });
    await user.save();
    req.session.userId = user._id;
    req.flash("success", "Account created successfully");
    return res.redirect("/listing");
  })
);

app.get(
  "/home/login",
  asyncWrap(async (req, res) => {
    res.render("listings/login.ejs");
  })
);

app.post(
  "/home/login",
  asyncWrap(async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/home/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid password");
      return res.redirect("/home/login");
    }
    req.session.userId = user._id;
    req.flash("success", " Login successfully");
    return res.redirect("/listing");
  })
);

app.get("/home/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.redirect("/listing");
    }
    res.clearCookie("connect.sid");
    res.redirect("/home/login");
  });
});

app.get(
  "/listing",
  asyncWrap(async (req, res) => {
    const listingBooks = await Book.find({});
    res.render("listings/index.ejs", { listingBooks });
  })
);

app.get(
  "/listing/search",
  asyncWrap(async (req, res) => {
    const query = req.query.q || "";

    const listings = await Book.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
    res.render("listings/searchResults.ejs", {
      listings,
      query,
    });
  })
);

app.get(
  "/listing/info",
  asyncWrap(async (req, res) => {
    res.render("listings/aboutContact.ejs");
  })
);

app.get(
  "/listing/new",
  isLoggedIn,
  asyncWrap(async (req, res) => {
    res.render("listings/new.ejs");
  })
);

app.post(
  "/listing/new",
  isLoggedIn,
  upload.single("image"),
  asyncWrap(async (req, res) => {
    const { title, author, condition, price, description, image } = req.body;

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
  })
);

app.delete(
  "/listing/:id",
  isLoggedIn,
  isOwner,
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Book ID", 400);
    }

    const book = await Book.findById(id);
    if (!book) {
      throw new AppError("Book not found", 404);
    }

    if (book.imageId) {
      await cloudinary.uploader.destroy(book.imageId);
    }

    await Book.findByIdAndDelete(id);

    req.flash("success", "Book deleted successfully");
    res.redirect("/listing");
  })
);

app.get(
  "/listing/:id",
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    const currentUser = await User.findById(userId);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Book ID", 400);
    }
    const showListing = await Book.findById(id).populate("uploader");
    if (!showListing) {
      throw new AppError("Book not food", 401);
    }
    console.log(showListing);
    res.render("listings/show.ejs", { showListing, currentUser, userId });
  })
);

app.get(
  "/listing/:id/edit",
  isLoggedIn,
  isOwner,
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Book ID", 400);
    }
    const showListing = await Book.findById(id);
    res.render("listings/update.ejs", { showListing });
  })
);

app.put(
  "/listing/:id/edit",
  isLoggedIn,
  isOwner,
  upload.single("image"),
  asyncWrap(async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedBook = await Book.findByIdAndUpdate(id, updatedData, {
      runValidators: true,
      new: true,
    });

    if (!updatedBook) {
      throw new AppError("Book not found", 404);
    }
    req.flash("success", "Book Edited successfully");
    res.redirect(`/listing/${id}`);
  })
);

app.use((req, res, next) => {
  next(new AppError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  console.log(err);
  const { statusCode = 500, message = "something went wrong" } = err;
  res.status(statusCode).render("listings/error.ejs", { message, statusCode });
});

app.listen(8080, () => {
  console.log("server is listing on port 8080");
});
