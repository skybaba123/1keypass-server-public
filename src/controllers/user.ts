import { Response, Request } from "express";
import User, { getUserById, deleteUserById } from "../models/user";
import Data from "../models/data";
import hasher from "../helpers/hashPassword";
import { UserTypes } from "../types/UserTypes";
import bcrypt from "bcrypt";
import hashPassword from "../helpers/hashPassword";
import axios from "axios";
import sendEmail from "../helpers/sendEmail";

interface AuthRequest extends Request {
  user: UserTypes;
}

export const phraseSet = async (req: AuthRequest, res: Response) => {
  try {
    const { phraseDigest, answerDigest, encryptedPhrase, securityQuestion } =
      req.body;
    const hashedPhrase = await hasher(phraseDigest);
    const hashedAnswer = await hasher(answerDigest);
    const userId = req.user._id;
    const user = await getUserById(userId);

    if (!user) return res.status(404).send({ error: "No user found" });
    user.isPhraseSet = "yes";
    user.hashedPhrase = hashedPhrase;
    user.hashedAnswer = hashedAnswer;
    user.encryptedPhrase = encryptedPhrase;
    user.securityQuestion = securityQuestion;

    await user.save();
    return res.sendStatus(200).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const changeDetail = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { fullName, oldPin, newPin, detailType } = req.body;
    if (detailType === "name") {
      //change name
      await User.findByIdAndUpdate(user._id, { fullName });
      return res.status(200).send("Name Changed").end();
    }

    if (detailType === "pin") {
      //change pin
      const isPinMatched = bcrypt.compareSync(oldPin, user.pin);
      if (!isPinMatched)
        return res.status(400).send({ error: "You're not authorized" });

      if (newPin.length < 6)
        return res.status(400).send({ error: "New Pin should be 6 numbers" });
      const hashedPin = await hashPassword(newPin);

      await User.findByIdAndUpdate(user._id, { pin: hashedPin });
      return res.status(200).send("Pin Changed").end();
    }
    return res.sendStatus(400).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const deleteUserController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { pin, reason } = req.body;

    const isPinMatched = bcrypt.compareSync(pin, user.pin);
    if (!isPinMatched)
      return res.status(400).send({ error: "You're not authorized" });

    const deletedData = await Data.deleteMany({ userId: user._id.toString() });
    if (!deletedData.acknowledged)
      return res.status(400).send({ error: "Could not delete data" });

    await deleteUserById(user._id);

    const emailRes = await sendEmail(
      "1keypass@zohomail.com",
      "User Account Deleted",
      `${user.fullName} Just Deleted their account.`,
      `<h2>${user.fullName} just deleted their account because <br/> ${reason}. <br/> ${deletedData.deletedCount} Data Associated to this user was also deleted</h2>`
    );
    console.log(emailRes.msg);
    return res.sendStatus(200).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const subscribeUserController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const oneMonth = 2592000000;
    const userSession = req.user;
    const body = req.body as {
      duration: "oneMonth" | "sixMonth" | "oneYear";
      paymentReference: string;
    };

    const durationInMilisec =
      (body.duration === "oneMonth" && oneMonth) ||
      (body.duration === "sixMonth" && oneMonth * 6) ||
      (body.duration === "oneYear" && oneMonth * 12);

    const user = await getUserById(userSession._id.toString());
    if (!user) return res.status(404).send({ error: "No User Found" });

    const paymentRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${body.paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRETE}`,
        },
      }
    );
    if (paymentRes.data.data.status !== "success")
      return res.status(400).send({ error: "Payment Verification Failed" });

    user.subscriptionDuration = body.duration;
    user.subscriptionExpiry = Date.now() + durationInMilisec;
    user.plan = "premium";
    await user.save();

    const emailRes = await sendEmail(
      "1keypass@zohomail.com",
      "New Subsciber",
      "A New user has subscriber",
      `<h1>${user.fullName} just subscibed to a ${body.duration} plan</h1>`
    );
    console.log(emailRes.msg);
    return res.sendStatus(200).end();
  } catch (error) {
    const err = error.response ? error.response.data.message : error.message;
    return res.status(500).send({ error: err });
  }
};

export const validateSubscribeUsers = async () => {
  try {
    // return console.log("Wait");
    const premiumUsersExp = await User.find({
      plan: "premium",
      subscriptionExpiry: { $lte: Date.now() },
    });
    if (premiumUsersExp.length <= 0) return console.log("No Subcribed User");

    const premiumUsersExpId = premiumUsersExp.map((user) => user._id);

    const updateResult = await User.updateMany(
      { _id: { $in: premiumUsersExpId } },
      { $set: { plan: "free", subscriptionExpiry: 0 } }
    );

    const emailRes = await sendEmail(
      "1keypass@zohomail.com",
      "Subscription Alert",
      `Updated ${updateResult.modifiedCount} users whose subscriptions have expired`,
      `<h1>Updated ${updateResult.modifiedCount} users whose subscriptions have expired</h1>`
    );

    console.log(emailRes.msg);
  } catch (error) {
    console.log(error);
  }
};
