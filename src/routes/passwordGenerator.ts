import { Router } from "express";
import generator from "generate-password";
import userAuth from "../middlewares/userAuth";
import { Request, Response } from "express";

const router = Router();

router.post(
  "/generate-password",
  userAuth,
  async (req: Request, res: Response) => {
    try {
      const {
        length,
        numbers,
        symbols,
        lowercase,
        uppercase,
        excludeSimilarCharacters,
        strict,
      } = req.body;

      const password = generator.generate({
        length,
        numbers,
        symbols,
        lowercase,
        uppercase,
        excludeSimilarCharacters,
        strict,
      });

      return res.status(200).send({ password });
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }
);

export default router;
