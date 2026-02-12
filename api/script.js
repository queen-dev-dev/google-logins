import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv"
dotenv.config({path: ".env.local"})

const client = new ConvexHttpClient(process.env["CONVEX_SITE_URL"]);



export default async function () {
    const result = await client.query(api.tasks.get);
    console.log(result);
    return result;
}
