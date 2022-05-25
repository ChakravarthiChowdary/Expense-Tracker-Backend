import { Schema, Model, Document, model } from "mongoose";

interface IExpense extends Document {
  expenseType: string;
  expenseDate: Date;
  expenseAmount: string;
  expenseBillName: string;
  percentageOfIncome: string;
  userId: string;
  expenseBillPath: string;
}

const ExpenseSchema: Schema<IExpense> = new Schema({
  expenseType: { type: String, required: true },
  expenseDate: { type: Date, required: true },
  expenseAmount: { type: String, required: true },
  expenseBillName: { type: String, required: false },
  percentageOfIncome: { type: String, required: true },
  userId: { type: String, required: true },
  expenseBillPath: { type: String, required: false },
});

const ExpenseModal: Model<IExpense> = model("Expense", ExpenseSchema);

export default ExpenseModal;
