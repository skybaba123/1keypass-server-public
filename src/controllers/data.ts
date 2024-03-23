import { Response, Request } from "express";
import Data, {
  createData,
  getAllUserData,
  changeDataStatus,
  getDataById,
  deleteDataById,
  getActiveUserData,
} from "../models/data";
import { UserTypes } from "../types/UserTypes";
import { Document } from "mongoose";

interface AuthRequest extends Request {
  user: UserTypes;
}

const thirtyDays = 2592000000;

export const sample = async (req: AuthRequest, res: Response) => {
  try {
    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

const reArrangeActiveData = async (
  activeData: Document<unknown, {}, typeof Data>[]
) => {
  if (activeData.length > 5) {
    const [
      firstData,
      secondData,
      thirdData,
      fourthData,
      fifthData,
      ...theRestData
    ] = activeData;

    const firstFiveDataId = [
      firstData._id.toString(),
      secondData._id.toString(),
      thirdData._id.toString(),
      fourthData._id.toString(),
      fifthData._id.toString(),
    ];
    const theRestDataId = theRestData.map((data) => data._id.toString());

    await Data.updateMany({ _id: { $in: firstFiveDataId } }, { plan: "free" });
    await Data.updateMany({ _id: { $in: theRestDataId } }, { plan: "premium" });
  } else {
    const activeDataId = activeData.map((data) => data._id.toString());
    await Data.updateMany({ _id: { $in: activeDataId } }, { plan: "free" });
  }
};

export const createDataController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const userActiveDatas = await getActiveUserData(user._id.toString());
    const data = req.body;

    if (userActiveDatas.length >= 5 && user.plan !== "premium")
      return res.status(400).send({ error: "UPGRADE" });

    const newData = await createData(data);
    userActiveDatas.push(newData); //by default newly added data are active

    await reArrangeActiveData(userActiveDatas);
    return res.status(200).send(newData).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const editDataController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { title, encryptedData, salt, id } = req.body;

    const data = await getDataById(id);
    if (data.userId.toString() !== user._id.toString())
      return res.status(500).send({ error: "Not Authorized" });

    data.title = title;
    data.encryptedData = encryptedData;
    data.salt = salt;

    await data.save();
    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const getAllUserDataController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;
    const datas = await getAllUserData(user._id.toString());
    return res.status(200).send(datas.reverse()).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const changeDataStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;
    const { id, status } = req.body;

    const dataId = (await getDataById(id)).userId.toString();
    if (user._id.toString() !== dataId)
      return res.status(400).send({ error: "Data Unauthorized Access" });

    if (user.plan !== "premium" && status === "recycle")
      return res
        .status(400)
        .send({ error: "Only premium user can move data to recycle bin" });

    await Data.findByIdAndUpdate(id, {
      status,
      dataRecycleExpiry: status === "recycle" && Date.now() + thirtyDays,
    });

    const userActiveDatas = await getActiveUserData(user._id.toString());
    await reArrangeActiveData(userActiveDatas);

    const datas = await getAllUserData(user._id.toString());
    return res.status(200).send(datas.reverse()).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const changeMultipleDataStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;
    const { dataListId, status } = req.body;

    if (user.plan !== "premium" && status === "recycle")
      return res
        .status(400)
        .send({ error: "Only premium user can move data to recycle bin" });

    const updateResult = await Data.updateMany(
      { _id: { $in: dataListId } },
      {
        status,
        dataRecycleExpiry: status === "recycle" && Date.now() + thirtyDays,
      }
    );

    if (!updateResult.modifiedCount)
      return res.status(400).send({ error: "No data was changed" });

    const userActiveDatas = await getActiveUserData(user._id.toString());
    await reArrangeActiveData(userActiveDatas);

    const datas = await getAllUserData(user._id.toString());
    return res.status(200).send(datas.reverse()).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const deleteDataController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.body;

    const dataId = (await getDataById(id)).userId.toString();
    if (!dataId) return res.status(404).send({ error: "No Data Found" });

    if (user._id.toString() !== dataId)
      return res.status(400).send({ error: "Data Unauthorized Access" });

    await deleteDataById(id);
    const userActiveDatas = await getActiveUserData(user._id.toString());
    await reArrangeActiveData(userActiveDatas);

    const datas = await getAllUserData(user._id.toString());
    return res.status(200).send(datas.reverse()).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const deleteMultipleDataController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;
    const { dataListId } = req.body;

    const deletedResult = await Data.deleteMany({ _id: { $in: dataListId } });
    if (deletedResult.deletedCount <= 0)
      return res.status(400).send({ error: "No data was deleted" });

    const userActiveDatas = await getActiveUserData(user._id.toString());
    await reArrangeActiveData(userActiveDatas);

    const datas = await getAllUserData(user._id.toString());
    return res.status(200).send(datas.reverse()).end();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export const deleteExpiredData = async () => {
  try {
    const expiredDatas = await Data.find({
      status: "recycle",
      dataRecycleExpiry: { $lte: Date.now() },
    });
    if (expiredDatas.length <= 0) return console.log("No expired Data");

    const deletedRsult = await Data.deleteMany({
      status: "recycle",
      dataRecycleExpiry: { $lte: Date.now() },
    });
    console.log(`Deleted ${deletedRsult.deletedCount} Data in Recycle bin`);
  } catch (error) {
    console.log(error);
  }
};
