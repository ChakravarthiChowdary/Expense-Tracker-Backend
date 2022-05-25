import { Router } from "express";
import { check } from "express-validator";
import { signInUser, signUpUser } from "../controllers/auth";

const router = Router();

router.post(
  "/signup",
  [
    check("username").notEmpty().withMessage("User name cannot be empty."),
    check("password")
      .isAlphanumeric()
      .withMessage("Password should be combination of characters."),
    check("confirmPassword")
      .not()
      .isEmpty()
      .withMessage("Confirm password is missing in body."),
    check("password")
      .isLength({ min: 8 })
      .withMessage("Password should have min length of 8 characters."),
    check("email").isEmail().withMessage("Email is not valid."),
    check("netIncome").notEmpty().withMessage("Net income should not be blank"),
  ],
  signUpUser
);

router.post(
  "/signin",
  [
    check("email").isEmail().withMessage("Email is not valid."),
    check("password")
      .not()
      .isEmpty()
      .withMessage("Password must not be left blank."),
  ],
  signInUser
);

export default router;
