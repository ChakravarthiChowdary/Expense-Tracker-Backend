import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import bcryptjs from "bcryptjs";
import JWT from "jsonwebtoken";

import HttpError from "../models/HttpError";
import User from "../schema/User";

export const signUpUser: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, confirmPassword, photoUrl, netIncome } =
      req.body;

    if (password.length < 8) {
      return next(new HttpError("Password should have min of 8 characters."));
    }

    if (password !== confirmPassword) {
      return next(new HttpError("Passwords does not match. Try again."));
    }

    const userExists = await User.find({ email: req.body.email }).exec();

    if (userExists.length > 0) {
      return next(new HttpError("User already exists. Try logging in again"));
    }

    const hashedPassword = await bcryptjs.hash(req.body.password, 12);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      photoUrl: photoUrl || "",
      netIncome,
    });

    const result = await newUser.save();
    const resultObj = result.toObject({ getters: true });

    res.status(200).json({
      userInfo: {
        name: resultObj.username,
        id: resultObj.id,
        email: resultObj.email,
      },
      status: "Success",
    });
  } catch (error) {
    next(error);
  }
};

export const signInUser: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const userExists = await User.findOne({
      email: email,
    }).exec();

    if (!userExists) {
      return next(new HttpError("Username or password is incorrect.", 401));
    }

    const isValidPassword = await bcryptjs.compare(
      password,
      userExists.password
    );

    if (!isValidPassword) {
      return next(new HttpError("Username or password is incorrect", 401));
    }

    const token = JWT.sign(
      {
        email,
        id: userExists.id,
        username: userExists.username,
        photoUrl: userExists.photoUrl,
      },
      "A_REALLY_SUPER_SECRET_KEY"
    );

    const expiresIn = new Date();

    expiresIn.setTime(expiresIn.getTime() + 60 * 60 * 1000);

    res.status(200).json({
      userInfo: {
        username: userExists.toObject().username,
        id: userExists.toObject({ getters: true }).id,
        email: userExists.toObject().email,
        photoUrl: userExists.toObject().photoUrl,
        token,
        expiresIn,
      },
      status: "Success",
    });
  } catch (error) {
    next(error);
  }
};
