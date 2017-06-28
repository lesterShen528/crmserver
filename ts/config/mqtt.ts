import * as IM from "immutable"

export const $groupServerOpt = IM.fromJS({
    port: 1883,
    host: "119.23.19.46",
    options: {
        username: "test3",
        password: "test3",
        rejectUnauthorized: true,
    }
})

