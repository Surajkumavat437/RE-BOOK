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

const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const PORT = process.env.PORT || 8080;

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
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.session = req.session;
  next();
});

app.use("/", homeRoutes);
app.use("/home", authRoutes);
app.use("/listing", bookRoutes);

app.use((req, res, next) => {
  res
    .status(404)
    .render("listings/error", { message: "Page Not Found", statusCode: 404 });
});

app.use((err, req, res, next) => {
  console.error(err);
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("listings/error", { message, statusCode });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

startServer();
