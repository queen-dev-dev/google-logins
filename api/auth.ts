import http from "http";
import { OAuth2Client } from "google-auth-library";
import { URL } from "url";
import crypto from "crypto"
import * as cookie from 'cookie';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/auth/google/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error ("Missing Google OAuth env vars")
}
namespace NodeJS { // for compiler (less errors)
  interface ProcessEnv {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  }
}

const oauth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  //  Start Google login
  if (url.pathname === "/auth/google") {
    const state = crypto.randomUUID();
    const authUrl = oauth2Client.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      state,
    });

    res.setHeader(
      "Set-Cookie",
      `oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax`
    )
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }

  //  Google callback
  if (url.pathname === "/auth/google/callback") {
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const cookies = cookie.parse(req.headers.cookie ?? "");
    const storedState = cookies.oauth_state;
    
    if (!code) {
      res.writeHead(400);
      res.end("Missing auth code");
      return;
    }

    if (!returnedState || returnedState !== storedState) {
      res.writeHead(403);
      res.end("Invalid OAuth state")
      return;
    }
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      if (!tokens.id_token) throw new Error("NO ID token returned from Google")
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) throw new Error ("No token payload")
      const googleUserId = payload.sub;

      const email = payload.email;
      const name = payload.name;

      // TODO: store googleUserId in DB

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          googleUserId,
          email,
          name,
        })
      );
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end("Authentication failed");
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end("Not found");
};