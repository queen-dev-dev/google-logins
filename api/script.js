import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.CONVEX_URL);

export default async function () {
    try {
        console.log("CONVEX_URL:", process.env.CONVEX_URL);
        console.log("Calling query...");
        const result = await client.query(api.tasks.get);
        console.log("Result:", result);
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error("Full error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}
