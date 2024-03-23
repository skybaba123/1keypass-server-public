import { Router } from "express";
import userAuth from "../middlewares/userAuth";
import { sendFeedback } from "../controllers/feedback";

const router = Router();

router.post("/send-feedback", userAuth, sendFeedback);

export default router;
