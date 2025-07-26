require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");

// Import routes
const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");

// Connect to DB
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

// Session and flash
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  })
);
app.use(flash());

// Flash & session middleware for templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.session = req.session;
  next();
});

// Mount routes
app.use("/", homeRoutes);
app.use("/home", authRoutes);
app.use("/listing", bookRoutes);

// 404 handler
app.use((req, res, next) => {
  res
    .status(404)
    .render("listings/error", { message: "Page Not Found", statusCode: 404 });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("listings/error", { message, statusCode });
});

app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
