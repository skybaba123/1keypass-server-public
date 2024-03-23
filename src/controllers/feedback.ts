import { Response, Request } from "express";
import { UserTypes } from "../types/UserTypes";
import { createFeedback } from "../models/feedback";

interface AuthRequest extends Request {
  user: UserTypes;
}

export const sample = async (req: AuthRequest, res: Response) => {
  try {
    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const sendFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const body = req.body;

    if (userId !== body.ownerId)
      return res
        .status(400)
        .send({ error: "UnAuthorized access: User Not Matched" });
    await createFeedback(body);

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};
