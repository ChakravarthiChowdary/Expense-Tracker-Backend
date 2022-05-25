import { Schema, Model, Document, model, Types } from "mongoose";

interface IExpenseBills extends Document {
  title: string;
  uploadedDate: Date;
  photoUrl: string;
}

const ExpenseBills: Schema<IExpenseBills> = new Schema({
  title: { type: String, required: true },
  uploadedDate: { type: Date, required: true },
  photoUrl: { type: String, required: true },
});

ExpenseBills.set("toObject", {
  getters: true,
});

const ImageModel: Model<IExpenseBills> = model("ExpenseBills", ExpenseBills);

export default ImageModel;
