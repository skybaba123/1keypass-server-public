import { Schema, model } from "mongoose";
import validator from "validator";

const userSchema = new Schema(
  {
    fullName: { type: String, trim: true, required: true },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },

    pin: {
      type: String,
      required: true,
      trim: true,
    },

    salt: String,

    plan: { type: String, enum: ["free", "premium"], default: "free" },

    lastOtpSentTime: { type: Number, default: 0 },

    subscriptionDuration: {
      type: String,
      enum: ["oneMonth", "sixMonth", "oneYear"],
    },
    subscriptionExpiry: Number,

    hashedPhrase: String,
    hashedAnswer: String,

    securityQuestion: String,

    encryptedPhrase: String,

    verificationCode: { type: String },
    verificationCodeExpiry: { type: Number },

    sessionToken: String,

    isPhraseSet: { type: String, enum: ["yes", "no"], default: "no" },
  },
  { timestamps: true }
);

const User = model("User", userSchema);

export default User;

export const getUsers = async () => await User.find();

export const getUserByEmail = (email: string) => User.findOne({ email });

export const getUserById = async (id: string) => await User.findById(id);

export const deleteUserById = async (id: string) => User.findByIdAndDelete(id);
