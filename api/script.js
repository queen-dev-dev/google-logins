import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";


const client = new ConvexHttpClient(process.env.CONVEX_DEPLOY_KEY);

client.query(api.tasks.get).then(console.log);
