import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import HttpError from "../models/HttpError";

const checkAuth: RequestHandler = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    let token;
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    } else throw new Error("Authentication failed!");
    if (!token) {
      throw new Error("Authentication failed!");
    }
    const decodedToken = jwt.verify(token, "A_REALLY_SUPER_SECRET_KEY");
    if (typeof decodedToken === "object")
      (req.body as { userId: string }).userId = decodedToken.id;
    next();
  } catch (err) {
    const error = new HttpError(
      "User authentication failed. Invalid token",
      403
    );
    return next(error);
  }
};

export default checkAuth;
