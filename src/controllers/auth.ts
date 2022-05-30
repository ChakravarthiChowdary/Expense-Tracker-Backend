import { Request, RequestHandler } from "express";
import { validationResult } from "express-validator";
import bcryptjs from "bcryptjs";
import JWT from "jsonwebtoken";
import { FileArray } from "express-fileupload";

import HttpError from "../models/HttpError";
import User from "../schema/User";
import UserPhotos from "../schema/UserPhotos";
import Expense from "../schema/Expense";

interface FileUploadReq extends Request {
  files: FileArray;
}

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
        netIncome: resultObj.netIncome,
        savingsPercentage: resultObj.savingsPercentage,
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
        netIncome: userExists.netIncome,
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
        netIncome: userExists.toObject().netIncome,
        savingsPercentage: userExists.toObject().savingsPercentage,
      },
      status: "Success",
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.body.id;
    const username = req.body.username;
    const passwordUpdated = req.body.passwordUpdated;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!userId) {
      return next(new HttpError("User Id should be sent as part of body", 400));
    }

    if (!username && !passwordUpdated) {
      return next(new HttpError("Should change something", 400));
    }

    const user = await User.findOne({ _id: userId }).exec();

    if (!user) {
      return next(new HttpError("Something wrong with authentication", 403));
    }

    let hashedPassword;

    if (passwordUpdated) {
      if (!password || !confirmPassword) {
        return next(
          new HttpError(
            "Please provide password and confirm password to update.",
            400
          )
        );
      }

      if (password !== confirmPassword) {
        return next(
          new HttpError("Confirm password and password should be same.", 400)
        );
      }

      if (password.length < 8) {
        return next(
          new HttpError("Password should have min length of 8 characters.", 400)
        );
      }

      hashedPassword = await bcryptjs.hash(password, 12);
    }

    await User.findByIdAndUpdate(userId, {
      email: user.email,
      username,
      password: hashedPassword ? hashedPassword : user.password,
      photoUrl: user.photoUrl,
      netIncome: user.netIncome,
      savingsPercentage: user.savingsPercentage,
    });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfilePhoto: RequestHandler = async (req, res, next) => {
  try {
    let image;
    let uploadPath;
    const userId = req.body.userId;
    const basicPath = "http://localhost:5000/uploads";

    const files = (req as FileUploadReq).files;

    const user = await User.findOne({ _id: userId }).exec();

    if (!user) {
      return next(new HttpError("Something wrong with authentication", 403));
    }

    if (!files || Object.keys(files).length === 0) {
      return next(new HttpError("No file uploaded", 400));
    }

    image = files.image;

    if (!image) {
      return next(new HttpError("No image attached with body.", 400));
    }

    const extension = image.name.split(".")[1];

    const foundUserPhoto = await UserPhotos.findOne({ userId: userId }).exec();

    if (!foundUserPhoto) {
      const userPhotosDoc = new UserPhotos({
        title: image.name,
        photoUrl: `${basicPath}/${image.name}`,
        uploadedDate: new Date(),
        userId: userId,
      });

      const result = await userPhotosDoc.save();

      await UserPhotos.findByIdAndUpdate(result.id, {
        title: image.name,
        photoUrl: `${basicPath}/${result.id}.${extension}`,
        uploadedDate: new Date(),
        userId: userId,
      });

      const updatedImage = await UserPhotos.findById(result.id);

      await User.findByIdAndUpdate(userId, {
        photoUrl: `${basicPath}/${result.id}.${extension}`,
      });

      if (!updatedImage) {
        return next(new HttpError("Something wrong with the server", 500));
      }

      uploadPath = __dirname + "/public/uploads/" + result.id + "." + extension;
      image.mv(uploadPath, function (err: any) {
        if (err) return res.status(500).send(err);
      });
      res.status(200).json(updatedImage);
      return;
    }

    uploadPath =
      __dirname + "/public/uploads/" + foundUserPhoto._id + "." + extension;
    image.mv(uploadPath, function (err: any) {
      if (err) return res.status(500).send(err);
    });

    res.status(200).json(foundUserPhoto);
  } catch (error) {
    next(error);
  }
};

export const updateIncomeInfo: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const netIncome = req.body.netIncome;
    const savingsPercentage = req.body.savingsPercentage;

    const user = await User.findOne({ _id: userId }).exec();

    if (!user) {
      return next(new HttpError("Something wrong with authentication.", 403));
    }

    if (
      user.netIncome === netIncome &&
      user.savingsPercentage === savingsPercentage
    ) {
      return next(new HttpError("Nothing changed to update.", 400));
    }

    const expenses = await Expense.find({ userId: userId });

    expenses.forEach(async (expense) => {
      await Expense.findByIdAndUpdate(expense._id, {
        percentageOfIncome: ((+expense.expenseAmount * 100) / +user.netIncome)
          .toFixed(2)
          .toString(),
      });
    });

    const result = await User.findByIdAndUpdate(user._id, {
      netIncome,
      savingsPercentage,
    });
    const resultObj = result?.toJSON();

    res.status(200).json({ ...resultObj, netIncome, savingsPercentage });
  } catch (error) {
    next(error);
  }
};
