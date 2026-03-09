import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values'

export default defineSchema ({
    BG_TESTING:defineTable({
        googleID: v.string(),
        email:v.string(),
        name: v.string(),
        ssToken: v.string(),
        tokenExpiryDate: v.number()
    })
    .index("by_ssToken", ["ssToken"])
})
