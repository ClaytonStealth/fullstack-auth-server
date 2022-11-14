var express = require("express");
var router = express.Router();
const { uuid } = require("uuidv4");
const { db } = require("../mongo");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let users = {};
/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/registration", async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const saltRounds = 5; // For prod apps, saltRounds are going to be between 5 and 10
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    user = {
      email,
      password: hash,
      id: uuid(),
    };

    const result = await db().collection("users").insertOne(user);
    res.json({
      success: true,
      message: "User registered successfully",
      result,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      error: err.toString(),
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const user = await db().collection("users").findOne({ email });
    if (!user) {
      res
        .json({
          success: false,
          message: "Could not find user",
        })
        .status(204);
      return;
    }

    const storedPassword = user.password;
    console.log(password, storedPassword);

    const isPasswordCorrect = await bcrypt.compare(password, storedPassword);
    console.log(isPasswordCorrect);

    if (!isPasswordCorrect) {
      res
        .json({
          success: false,
          message: "Password was Incorrect",
        })
        .status(204);
      return;
    }
    const userPerms = email.includes("codeimmersives.com") ? "admin" : "user";
    const userData = {
      date: new Date(),
      userId: user.id,
      scope: userPerms,
    };
    const secretKey = process.env.JWT_SECRET_KEY;
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    const payload = {
      userData,
      exp,
    };
    const token = jwt.sign(payload, secretKey);
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      error: err.toString(),
    });
  }
});

module.exports = router;
