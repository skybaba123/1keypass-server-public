import { Schema, model, Document, ObjectId } from "mongoose";

const dataSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },

    encryptedData: { type: String, required: true },

    salt: { type: String, required: true },

    userId: { type: String, required: true },

    plan: { type: String, enum: ["free", "premium"], default: "free" },

    dataRecycleExpiry: Number,

    category: {
      type: String,
      required: true,
      enum: ["password", "bank", "personal", "card", "note"],
    },

    status: {
      type: String,
      required: true,
      enum: ["recycle", "active"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Data = model("Data", dataSchema);

export default Data;

export const createData = async (data: Document) => {
  const newData = new Data(data);
  return await newData.save();
};

export const getDataById = (id: string) => Data.findById(id);

export const deleteDataById = (id: string) => Data.findByIdAndDelete(id);

export const changeDataStatus = (id: string, status: "recycle" | "active") =>
  Data.findByIdAndUpdate(id, { status });

export const getAllUserData = (userId: string) => Data.find({ userId });

export const getActiveUserData = (userId: string) =>
  Data.find({ userId, status: "active" });

export const getRecycledUserData = (userId: string) =>
  Data.find({ userId, status: "recycle" });
