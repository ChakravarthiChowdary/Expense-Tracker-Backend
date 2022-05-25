import { Schema, Model, Document, model } from "mongoose";
import uniqueValidatorPkg from "mongoose-unique-validator";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  photoUrl: string;
  netIncome: string;
}

const uniqueValidator: any = uniqueValidatorPkg;

const UserSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minLength: 6 },
  photoUrl: { type: String, required: false },
  netIncome: { type: String, required: true },
});

UserSchema.plugin(uniqueValidator);

const UserModal: Model<IUser> = model("User", UserSchema);

export default UserModal;
