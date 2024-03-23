import express from "express";
import userAuth from "../middlewares/userAuth";
import {
  createDataController,
  getAllUserDataController,
  changeDataStatusController,
  changeMultipleDataStatusController,
  deleteDataController,
  deleteMultipleDataController,
  editDataController,
} from "../controllers/data";

const router = express.Router();

router.post("/data/create", userAuth, createDataController);

router.get("/datas/user", userAuth, getAllUserDataController);

router.post("/data/change-status", userAuth, changeDataStatusController);

router.post(
  "/data/change-multiple-status",
  userAuth,
  changeMultipleDataStatusController
);

router.post("/data/delete", userAuth, deleteDataController);

router.post("/data/delete-multiple", userAuth, deleteMultipleDataController);

router.post("/data/edit", userAuth, editDataController);

export default router;
