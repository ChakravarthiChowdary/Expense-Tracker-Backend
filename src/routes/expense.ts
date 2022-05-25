import { Router } from "express";
import { check } from "express-validator";
import {
  addExpense,
  getAllExpenses,
  uploadExpenseBillImage,
} from "../controllers/expense";

const router = Router();

router.post(
  "/addexpense",
  [
    check("expenseType")
      .not()
      .isEmpty()
      .withMessage("Expense type should not be blank."),
    check("expenseAmount")
      .not()
      .isEmpty()
      .withMessage("Expense amount should not be blank."),
    check("expenseDate")
      .not()
      .isEmpty()
      .withMessage("Expense Date should not be blank."),
    check("userId").not().isEmpty().withMessage("User id should be provided."),
  ],
  addExpense
);

router.post("/uploadExpenseBill", uploadExpenseBillImage);

router.get("/getExpenses/:userId/", getAllExpenses);

export default router;
