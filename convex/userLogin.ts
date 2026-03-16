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
        const fullList = ctx.db.query("BG_TESTING").collect();
        const googleIDs = (await fullList).map((user) => user.googleID); // checks google IDs earlier, to avoid double adds.
        for (let i = 0; i < googleIDs.length; i++) {
            if (googleIDs[i] === args.googleID) return;
        }
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

// _getGoogleIDs and _getSSToken shouldn't be necessary, but kept just in case

export const _getGoogleIDs = query({ // gives an array of numbers containing all google ids (from every user)
    args: {},
    handler: async (ctx) => {
        const fullList = ctx.db.query("BG_TESTING").collect();
        const googleIDs = (await fullList).map((user) => user.googleID);
        return googleIDs;
    }
})

export const _getSSToken = query({ // gives an array of strings containing all session / cookie tokens
    args: {},
    handler: async (ctx) => {
        const fullList = ctx.db.query("BG_TESTING").collect();
        const allTokens = (await fullList).map((user) => user.ssToken);
        return allTokens;
    }
})

export const getDetails = query({ // returns array of user and their properties - search based off ssToken (in cookie)
    args: {
        ssToken: v.string()
    },
    handler: async (ctx, args) => {
        const valuse = await ctx.db
            .query("BG_TESTING")
            .withIndex("by_ssToken", q =>
                q.eq("ssToken", args.ssToken))
            .unique()
        return valuse;
    }
})

export const DeleteSSToken = query({ // give an ID, deletes their token, expiry date and creation time
    args: {
        id: v.id(),
        email: v.string(),
        googleID: v.string(),
        name: v.string()
    },
    handler: async (ctx, args) => {
        await ctx.db.replace("BG_TESTING", args.id, {
            name: args.name,
            email: args.email,
            googleID: args.googleID
        });
    }
})