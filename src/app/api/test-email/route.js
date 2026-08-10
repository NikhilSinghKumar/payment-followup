import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"PAFEX" <${process.env.SMTP_USER}>`,
      to: "nikhilsk369@gmail.com",
      subject: "Pafex Email Test",
      text: "Congratulations! SMTP is working.",
      html: `
        <h2>Pafex SMTP Test</h2>
        <p>Your email configuration is working successfully.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
