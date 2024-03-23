"use strict";
import nodemailer from "nodemailer";

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
) => {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_AUTH_USER,
        pass: process.env.EMAIL_AUTH_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.EMAIL_AUTH_USER, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    return { msg: `"Message sent: %s", ${info.messageId}` };
  } catch ({ message }) {
    return { error: message };
  }
};

export default sendEmail;
