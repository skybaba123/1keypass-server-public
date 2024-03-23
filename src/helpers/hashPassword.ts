import bcrypt from "bcrypt";

export default async (plainText: string) => {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedText = bcrypt.hashSync(plainText, salt);
  return hashedText;
};
