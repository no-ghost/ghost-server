const express = require("express");
const router = express.Router();
const sendGridService = require("../services/sendGrid.service");

// sanity check
router.get("/", (req, res) => {
  res.status(200).json({ message: "Hello world" });
});

// sanity check
router.get("/testSendGrid", (req, res) => {
  sendGridService.sendEmail(
    "",
    "https://ghost-texts.s3.amazonaws.com/texts/9743500.jpg",
    ["you were alright", "could be better"]
  );
  res.status(200).json({ message: "Hello world" });
});

// sanity check
router.get("/testSession", (req, res) => {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  console.log(req.session);
  console.log(req.session.id);
  console.log(req.session.cookie);
  res.status(200).json({ message: req.session.views });
});

module.exports = router;
