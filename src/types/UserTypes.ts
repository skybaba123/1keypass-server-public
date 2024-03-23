export interface UserTypes {
  fullName: string;
  email: string;
  pin: string;
  salt: string;
  plan: "free" | "premium";
  lastOtpSentTime: number;
  subscriptionDuration?: "oneMonth" | "sixMonth" | "oneYear";
  subscriptionExpiry?: number;
  hashedPhrase?: string;
  hashedAnswer?: string;
  securityQuestion?: string;
  encryptedPhrase?: string;
  verificationCode?: string;
  verificationCodeExpiry?: number;
  sessionToken: string;
  isPhraseSet: "yes" | "no";
  createdAt: Date;
  _id: string;
}
