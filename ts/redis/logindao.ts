import assert = require("assert")
import { ReqError } from "../lib/reqerror"
export class LoginInfo {
    private id: string
    private key: string
    private token: string
    private login: string
    private perm: string
    private permMap?: any

    constructor(id: string, key: string, token: string, login: string, perm?: string) {
        [this.id, this.key, this.token, this.login] = [id, key, token, login]
        if (perm) {
            assert(typeof perm === "string")
            this.perm = perm
            this.permMap = { perm: perm }
        }
    }

    public static valueOf(s: string): LoginInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid LoginInfo format")

        let {id, key, token, login, perm} = obj

        if (perm)
            assert(typeof perm === "string")

        return new LoginInfo(id, key, token, login, perm)
    }

    public getId() { return this.id }
    public getKey() { return this.key }
    public getToken() { return this.token }
    public getLogin() { return this.login }

    /*
   root | admin
   */
    /**
     * {
     *      perm:root
     *      perm:admin
     *  }
     */

    private isCommon(field: string) {
        if (!this.permMap)
            return false
        return !!(this.permMap['perm'] === field)
    }

    public isRoot() {
        return this.isCommon("root")
    }

    public isAdmin() {
        return this.isCommon("admin")
    }

}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"

const [sessionDbOpt, Sessiontimeout] = [{ db: 0 }, 86400]

export async function setLoginAsync(id: string, loginInfo: LoginInfo) {
    const content = JSON.stringify(loginInfo)
    await getRedisClientAsync(async rds => await rds.setAsync(id, content, "ex", Sessiontimeout), sessionDbOpt)
}

export async function getLoginAsync(id: string, token: string): Promise<[LoginInfo, string]> {
    if (!id || !token)
        throw new ReqError("没有登录！")

    let s = await getRedisClientAsync(async rds => await rds.getAsync(id), sessionDbOpt)
    if (!s)
        throw new ReqError("没有登录！")

    let info = LoginInfo.valueOf(s)
    if (token !== info.getToken())
        throw new ReqError("没有登录！")

    return [info, undefined]
}

export async function delLogin(id: string) {
    try {
        await getRedisClientAsync(async rds => rds.delAsync(id), sessionDbOpt)
    } catch (e) {
        logger.error("delLogin error", e.message)
    }
}

import { sendError } from "../lib/response"

export async function checkLogin(req: any, res: any, next: any) {
    let {token, id} = (req as any).cookies
    if (!token && !id) {
        token = (req as any).headers.token
        id = (req as any).headers.uuid
    }
    try {
        let [info, errMsg] = await getLoginAsync(id, token)
        if (info) {
            req.loginInfo = info
            return next()
        }

        return sendError(res, new ReqError(errMsg, 401))
    } catch (e) {
        e.info(sendError, res, e)
    }
}
