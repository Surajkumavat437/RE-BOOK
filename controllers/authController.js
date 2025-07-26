const User = require("../models/User");
const bcrypt = require("bcryptjs");
const asyncWrap = require("../utils/async");

exports.getSignup = (req, res) => {
  res.render("listings/signup");
};

exports.postSignup = asyncWrap(async (req, res) => {
  const { username, email, college, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, college, password: hashedPassword });
  await user.save();
  req.session.userId = user._id;
  req.flash("success", "Account created successfully");
  res.redirect("/listing");
});

exports.getLogin = (req, res) => {
  res.render("listings/login");
};

exports.postLogin = asyncWrap(async (req, res) => {
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
  req.flash("success", "Login successfully");
  res.redirect("/listing");
});

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.redirect("/listing");
    }
    res.clearCookie("connect.sid");
    res.redirect("/home/login");
  });
};
