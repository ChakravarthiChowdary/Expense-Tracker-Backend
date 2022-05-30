import { Schema, Model, Document, model, Types } from "mongoose";

interface IUserPhotos extends Document {
  title: string;
  uploadedDate: Date;
  photoUrl: string;
  userId: string;
}

const UserPhotos: Schema<IUserPhotos> = new Schema({
  title: { type: String, required: true },
  uploadedDate: { type: Date, required: true },
  photoUrl: { type: String, required: true },
  userId: { type: String, required: true },
});

UserPhotos.set("toObject", {
  getters: true,
});

const ImageModel: Model<IUserPhotos> = model("UserPhotos", UserPhotos);

export default ImageModel;
