import jwt from "jsonwebtoken";
import { getUserById } from "../models/user";

const userAuth = async (req: any, res: any, next: any) => {
  try {
    if (req.header("Authorization") === undefined)
      return res.status(400).send({ error: "UnAuthorized Access" });

    const token = req.header("Authorization").replace("Bearer ", "");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRETE) as {
      _id: string;
      expiresIn: number;
    };

    if (Date.now() > decodedToken.expiresIn)
      return res.status(400).send({ error: "session expired" });

    const user = await getUserById(decodedToken._id);
    if (!user) return res.status(404).send({ error: "No User Found" });

    if (user.sessionToken !== token)
      return res
        .status(400)
        .send({ error: "A differrent device is logged in." });

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

export default userAuth;
