import { query, mutation } from './_generated/server';
import { v } from 'convex/values'

export const addUser = mutation({
    args: {
        googleID: v.string(),
        email: v.string(),
        name: v.string(),
        ssToken: v.string(),
        tokenExpiryDate: v.number()
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("BG_TESTING", {
            googleID: args.googleID,
            email: args.email,
            name: args.name,
            ssToken: args.ssToken,
            tokenExpiryDate: args.tokenExpiryDate
        })
    }
})

export const readFull = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("BG_TESTING").collect();
    }

})

export const getGoogleIDs = query({
    args: {},
    handler: async (ctx) => {
        const fullList = ctx.db.query("BG_TESTING").collect();
        const googleIDs = (await fullList).map((user) => user.googleID);
        return googleIDs;
    }
})
