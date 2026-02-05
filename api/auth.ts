import { OAuth2Client } from "google-auth-library";
import crypto from "crypto"
import * as cookie from 'cookie';
import type { VercelRequest, VercelResponse} from '@vercel/node'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.VERCEL_URL
  ?  `https://${process.env.VERCEL_URL}/api/auth?action=callback`
  : "http://localhost:3000/api/auth?action=callback"
;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error ("Missing Google OAuth env vars")
}

const oauth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const {action} = req.query;

  //  Start Google login
  if (action === "login") {
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
    res.redirect(302, authUrl);
    return;
  }

  //  Google callback
  if (action === "callback") {
    const code = req.query.code as string;
    const returnedState = req.query.state as string;
    const cookies = cookie.parse(req.headers.cookie as string ?? "");
    const storedState = cookies.oauth_state;
    
    if (!code) {
      res.status(400).send("Missing auth code")
      return;
    }

    if (!returnedState || returnedState !== storedState) {
      res.status(403).send("Invalid OAuth state")
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

      res.status(200).json({
          googleUserId,
          email,
          name,
        });
    } catch (err) {
      console.error(err);
      res.status(500).send("Authentication failed");
    }
    return;
  }

  // 404
  res.status(404).send("Not found");
};