import { Schema, model } from "mongoose";

const feedbackSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },

    ownerId: { type: String, required: true },
  },
  { timestamps: true }
);

const Feedback = model("Feedback", feedbackSchema);

export default Feedback;

export const createFeedback = async (data: Document) => {
  const newFeedback = new Feedback(data);
  return await newFeedback.save();
};

export const deleteFeedbackById = async (id: string) => {
  const deletedFeedback = await Feedback.findByIdAndDelete(id);
  if (!deletedFeedback) throw new Error("No Feed back found");
};
