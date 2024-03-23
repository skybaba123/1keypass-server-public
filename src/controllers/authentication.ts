import express, { Request, Response } from "express";
import User, { getUserByEmail, getUserById } from "../models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import hashPassword from "../helpers/hashPassword";
import validator from "validator";
import sendEmail from "../helpers/sendEmail";
import generateOtp from "../helpers/generateOtp";
import { UserTypes } from "../types/UserTypes";

interface AuthRequest extends Request {
  user: UserTypes;
}

const oneMinute = 60000; //for testing
const sevenDays = 60000 * 60 * 24 * 7;
const fiveMinutes = oneMinute * 5;

export const resgister = async (req: Request, res: Response) => {
  try {
    const { fullName, email, pin, salt } = req.body;

    if (validator.isEmpty(fullName.trim()))
      return res.status(400).send({ error: "Name cannot be empty" });
    if (!validator.isEmail(email))
      return res.status(400).send({ error: "This is not a valid email" });
    if (pin.length < 6)
      return res.status(400).send({ error: "Pin should have 6 characters" });

    const hashedPin = await hashPassword(pin);
    const newUser = new User({
      fullName,
      email,
      pin: hashedPin,
      salt,
    });

    const savedUser = await newUser.save();

    const otp = generateOtp();
    savedUser.verificationCode = otp;
    savedUser.verificationCodeExpiry = Date.now() + fiveMinutes;
    await savedUser.save();

    const emailResponse = await sendEmail(
      savedUser.email,
      "Verification Code",
      "Verify your email",
      `<h1>${otp}</h1>`
    );

    console.log(emailResponse);

    if (!emailResponse.msg)
      return res
        .status(400)
        .send({ error: emailResponse.error || "Something went wrong" });

    return res.status(200).send(savedUser).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;
    const user = await getUserByEmail(email);

    if (!user) return res.status(404).send({ error: "No User found" });

    const isPinMatched = bcrypt.compareSync(pin, user.pin);

    if (!isPinMatched)
      return res.status(400).send({ error: "You're not authorized" });

    const otp = generateOtp();

    const userGuest =
      (email as string).toLowerCase() === "ugwumiracle123@gmail.com";

    user.verificationCode = userGuest ? "295761" : otp;
    user.verificationCodeExpiry =
      Date.now() + (userGuest ? sevenDays : fiveMinutes);
    await user.save();

    if (!userGuest) {
      const emailResponse = await sendEmail(
        user.email,
        "Verification Code",
        "Verify your email",
        `<h1>${otp}</h1>`
      );

      if (emailResponse.error)
        return res.status(400).send({ error: emailResponse.error });
    }

    return res.status(200).send(user).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const verifyPin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { pin } = req.body;

    const isPinMatched = bcrypt.compareSync(pin, user.pin);

    if (!isPinMatched)
      return res.status(400).send({ error: "Pin Do Not Match" });

    return res.sendStatus(200).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).send({ error: "No User Found" });

    if (!user.verificationCode || !user.verificationCodeExpiry)
      return res
        .status(400)
        .send({ error: "Invalid request: No otp No expiry" });

    if (otp !== user.verificationCode)
      return res.status(400).send({ error: "Invalid Otp Code" });

    if (Date.now() > user.verificationCodeExpiry)
      return res.status(400).send({ error: "Otp Code expired" });

    const token = jwt.sign(
      { _id: user._id, expiresIn: Date.now() + sevenDays },
      process.env.JWT_SECRETE
    );

    user.sessionToken = token;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    return res.status(200).send(user).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const sendEmailCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).send({ error: "No User Found" });

    if (user.lastOtpSentTime > Date.now()) {
      return res
        .status(400)
        .send({ error: "Wait a few mins before sending new code" });
    }

    const otp = generateOtp();

    const userGuest =
      (email as string).toLowerCase() === "ugwumiracle123@gmail.com";

    user.verificationCode = userGuest ? "295761" : otp;
    user.verificationCodeExpiry =
      Date.now() + (userGuest ? sevenDays : fiveMinutes);
    await user.save();

    if (!userGuest) {
      const emailResponse = await sendEmail(
        user.email,
        "Verification Code",
        "Verify your email",
        `<h1>${otp}</h1>`
      );

      user.lastOtpSentTime = Date.now() + 120000;
      await user.save();

      if (emailResponse.error)
        return res.status(400).send({ error: emailResponse.error });
      console.log(emailResponse);
    }

    return res.status(200).send({ msg: "Otp Sent" }).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const resetPin = async (req: Request, res: Response) => {
  try {
    const { newPin, email, otp } = req.body;

    if (newPin.length < 6)
      return res.status(400).send({ error: "Pin should have 6 characters" });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).send({ error: "No User Found" });

    if (!user.verificationCode || !user.verificationCodeExpiry)
      return res
        .status(400)
        .send({ error: "Invalid request: No otp No expiry" });

    if (otp !== user.verificationCode)
      return res.status(400).send({ error: "Invalid Otp Code" });

    if (Date.now() > user.verificationCodeExpiry)
      return res.status(400).send({ error: "Otp Code expired" });

    const hashedPin = await hashPassword(newPin);
    user.pin = hashedPin;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    return res.status(200).send({ msg: "Pin Changed" }).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const verifyPhrase = async (req: AuthRequest, res: Response) => {
  try {
    const { phraseDigest } = req.body;
    const userId = req.user._id;

    const user = await getUserById(userId);
    if (!user) return res.status(404).send({ error: "No User Found" });

    const isPhraseMatched = bcrypt.compareSync(phraseDigest, user.hashedPhrase);
    if (!isPhraseMatched)
      return res
        .status(400)
        .send({ error: "Verification Failed: Phrase not matched" });

    return res.sendStatus(200).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const verifyScurityAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { answerDigest } = req.body;
    const userId = req.user._id;

    const user = await getUserById(userId);
    if (!user) return res.status(404).send({ error: "No User Found" });

    const isAnswerMatched = bcrypt.compareSync(answerDigest, user.hashedAnswer);
    if (!isAnswerMatched)
      return res
        .status(400)
        .send({ error: "Verification Failed: Answer not matched" });

    return res.sendStatus(200).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};
