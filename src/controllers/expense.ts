import { Request, RequestHandler } from "express";
import { validationResult } from "express-validator";

import HttpError from "../models/HttpError";
import Expense from "../schema/Expense";
import User from "../schema/User";
import ExpenseBills from "../schema/ExpenseBill";
import { FileArray } from "express-fileupload";

interface FileUploadReq extends Request {
  files: FileArray;
}

export const addExpense: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { expenseType, expenseAmount, expenseDate, userId, expenseBillName } =
      req.body;

    if (
      !(
        expenseType === "Entertainment" ||
        expenseType === "Food" ||
        expenseType === "Essentials"
      )
    ) {
      return next(new HttpError("Expense type is not valid", 400));
    }

    const user = await User.findOne({ _id: userId }).select("-password").exec();

    if (!user) {
      return next(new HttpError("Something wrong with authentication.", 403));
    }

    if (+expenseAmount > +user.netIncome) {
      return next(
        new HttpError("Expense amount cannot be more than income.", 400)
      );
    }

    const expense = new Expense({
      expenseType,
      expenseAmount,
      expenseDate: new Date(expenseDate),
      expenseBillName: expenseBillName ? expenseBillName : "",
      userId,
      percentageOfIncome: ((expenseAmount * 100) / +user.netIncome)
        .toFixed(2)
        .toString(),
      expenseBillPath: "",
    });

    const result = await expense.save();

    const resultObj = result.toJSON();

    res.status(200).json(resultObj);
  } catch (error) {
    next(error);
  }
};

export const uploadExpenseBillImage: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    let image;
    let uploadPath;
    const basicPath = "http://localhost:5000/uploads";

    const files = (req as FileUploadReq).files;

    if (!files || Object.keys(files).length === 0) {
      return next(new HttpError("No file uploaded", 400));
    }

    image = files.image;

    if (!image) {
      return next(new HttpError("No image attached with body.", 400));
    }

    const extension = image.name.split(".")[1];

    const expenseBillsDoc = new ExpenseBills({
      title: image.name,
      photoUrl: `${basicPath}/${image.name}`,
      uploadedDate: new Date(),
    });

    const result = await expenseBillsDoc.save();

    await ExpenseBills.findByIdAndUpdate(result.id, {
      title: image.name,
      photoUrl: `${basicPath}/${result.id}.${extension}`,
      uploadedDate: new Date(),
    });

    const updatedImage = await ExpenseBills.findById(result.id);

    const expense = await Expense.findOne({ _id: req.body.expenseId }).exec();

    if (!expense) {
      return next(new HttpError("Something wrong with the data", 500));
    }

    await Expense.findByIdAndUpdate(expense._id, {
      expenseBillPath: `${basicPath}/${result.id}.${extension}`,
    });

    if (!updatedImage) {
      return next(new HttpError("Something wrong with the server", 500));
    }

    uploadPath = __dirname + "/public/uploads/" + result.id + "." + extension;
    image.mv(uploadPath, function (err: any) {
      if (err) return res.status(500).send(err);
    });

    res.status(200).json(updatedImage);
  } catch (error) {
    next(error);
  }
};

export const getAllExpenses: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const user = await User.findOne({ _id: userId }).exec();

    if (!user) {
      return next(new HttpError("Something wrong with authentication", 403));
    }

    const expenses = await Expense.find({
      userId: userId,
    }).exec();

    res.status(200).json({ expenses, length: expenses.length });
  } catch (error) {
    next(error);
  }
};
