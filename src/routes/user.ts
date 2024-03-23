import express from "express";
import userAuth from "../middlewares/userAuth";
import {
  phraseSet,
  changeDetail,
  subscribeUserController,
  deleteUserController,
} from "../controllers/user";

const router = express.Router();

router.post("/phrase-set", userAuth, phraseSet);

router.post("/change-detail", userAuth, changeDetail);

router.post("/user/subscribe", userAuth, subscribeUserController);

router.post("/user/delete", userAuth, deleteUserController);

export default router;
