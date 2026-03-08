import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma.js";
import { generateToken } from "../utils/generateToken.js";
import { Request, Response } from "express";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.id_token) {
      return res.status(401).json({ message: "Google auth failed" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokenData.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, sub: googleId, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const username =
        (name || "user").replace(/\s/g, "").toLowerCase() +
        Math.floor(Math.random() * 10000);

      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar: picture,
          googleId,
          username,
        },
      });
    }

    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    const jwt = generateToken(user.id);

    res.cookie("token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? ".openchat.qzz.io"
          : undefined,
    });

    res.json(user);
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Google login failed" });
  }
};
