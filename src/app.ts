import express, { Request, Response, NextFunction } from "express";
import { json, urlencoded } from "body-parser";
import mongoose from "mongoose";
import fileupload from "express-fileupload";

import HttpError from "./models/HttpError";
import authRouter from "./routes/auth";
import expenseRouter from "./routes/expense";
import path from "path";

const app = express();

const port = process.env.PORT || 5000;

app.use(fileupload());
app.use(urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "/controllers/public/")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use(json());

app.use("/app/v1/auth", authRouter);
app.use("/app/v1/expense", expenseRouter);

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  res.status(err.code || 500).json({
    error: {
      message: err.message || "Server is busy at the moment !",
      statusCode: err.code || 500,
      requestStatus: "Fail",
    },
  });
});

mongoose
  .connect(`your mongodb url`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server started at port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
