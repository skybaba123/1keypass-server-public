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
import User from "../models/user";
import axios from "axios";

interface AuthRequest extends Request {
  user: UserTypes;
}

const router = express.Router();

router.get(
  "/authenticate-user",
  userAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).send({ error: "No user found" });

      const { data: customerInfo } = await axios.get(
        `https://api.revenuecat.com/v1/subscribers/${user._id.toString()}`,
        {
          headers: { Authorization: `Bearer ${process.env.RC_ANDROID_PUBKEY}` },
        }
      );

      console.log(customerInfo);
      console.log(customerInfo.subscriber);
      console.log(customerInfo.subscriber.entitlements);

      const isSubscribed = customerInfo.subscriber.entitlements.active["pro"];

      console.log(isSubscribed);

      let updatedUser;
      if (isSubscribed) {
        updatedUser = await User.findByIdAndUpdate(
          user._id,
          { plan: "premium" },
          { new: true }
        );
      } else {
        updatedUser = await User.findByIdAndUpdate(
          user._id,
          { plan: "free" },
          { new: true }
        );
      }

      return res.status(200).send(updatedUser);
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
