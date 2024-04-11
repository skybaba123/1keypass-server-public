import userAuth from "../middlewares/userAuth";
import {
  resgister,
  login,
  verifyPin,
  verifyEmail,
  sendEmailCode,
  resetPin,
  verifyPhrase,
  verifyScurityAnswer,
} from "../controllers/authentication";
import express, { Request, Response } from "express";
import { UserTypes } from "../types/UserTypes";

interface AuthRequest extends Request {
  user: UserTypes;
}

const router = express.Router();



router.get(
  "/authenticate-user",
  userAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      return res.status(200).send(req.user);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }
);

router.post("/register", resgister);

router.post("/login", login);

router.post("/verify-pin", userAuth, verifyPin);

router.post("/verify-email", verifyEmail);

router.post("/send-email-code", sendEmailCode);

router.post("/reset-pin", resetPin);

router.post("/verify-phrase", userAuth, verifyPhrase);

router.post("/verify-answer", userAuth, verifyScurityAnswer);

export default router;
