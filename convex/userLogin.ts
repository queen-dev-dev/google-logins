import { query, mutation } from './_generated/server';
import { v } from 'convex/values'

// needs cleanup to consolidate lookup funcs

export const addUser = mutation({ // should make sure that the user doesn't exist before adding it
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

export const _readFull = query({ // all of it. testing only
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("BG_TESTING").collect();
    }

})

export const getGoogleIDs = query({ // gives an array of numbers containing all google ids (from every user)
    args: {},
    handler: async (ctx) => {
        const fullList = ctx.db.query("BG_TESTING").collect();
        const googleIDs = (await fullList).map((user) => user.googleID);
        return googleIDs;
    }
})

export const getSSToken = query({ // gives an array of strings containing all session / cookie tokens
    args: {},
    handler: async (ctx) => {
        const fullList = ctx.db.query("BG_TESTING").collect();
        const allTokens = (await fullList).map((user) => user.ssToken);
        return allTokens;
    }
})

export const getDetails = query({ // WIP, should return all data related to a user. Requires ID of that user (automated by convex)
    args: {
        userID: v.id("BG_TESTING")
    },
    handler: async (ctx, args) => {
        return await ctx.db.get("BG_TESTING", args.userID);
    }
})
export const getTable = query({
    args: {
        ssToken: v.string()
    },
    handler: async(ctx, args) => {
        const valuse = await ctx.db
        .query("BG_TESTING")
        .withIndex("by_ssToken", q => 
            q.eq("ssToken", args.ssToken))
        .collect()
        return valuse;
    }
})

