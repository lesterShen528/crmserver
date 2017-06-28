import { createHash } from "crypto"
import { ReqError } from "../lib/reqerror"
import { Clients } from "../model/crm/clients"
import { Servers } from "../model/crm/servers"

export function checkPassword(real: string, current: string): void {
    let [a, b] = [real.length === 32 ? real : md5sum(real), current.length === 32 ? current : md5sum(current)]
    if (a !== b)
        throw new ReqError("密码不正确！", 400)
}

export function randomInt(from: number, to: number) {
    return Math.floor(Math.random() * (to - from) + from)
}

export function md5sum(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function sleepAsync(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export async function getClientTotal(state: string, serach: string) {
    let res
    switch (state) {
        case "new":
            res = await Clients.getInstance().getAmount(serach)
            break;
        case "used":
            res = await Clients.getInstance().getCountHasGroup(serach)
            break;
        case "off":
            res = await Clients.getInstance().getOffCount(serach)
            break;
        default:
            res = await Clients.getInstance().getTotalClients(serach)
    }
    return parseInt(res)
}

export async function getServerTotal(state: string, serach: string) {
    let res
    if (state !== "")
        res = await Servers.getInstance().getAmount(state, serach)
    if (state === "")
        res = await Servers.getInstance().getTotalServers(serach)
    return parseInt(res)
}

export function getPageCount(page: string, count?: string) {
    let limit = parseInt(count)
    let cursor = 0
    if (page) {
        cursor = (parseInt(page) - 1) * parseInt(count)
    }
    return { cursor, limit }
}

export function checkCursorLimit(cursor: number, limit: number) {
    if (cursor > -1 && limit > 0)
        return false
    return true
}

export async function checkreq(param: Array<any>, sign: string, next: any) {
    param.sort()
    let s = param.join(",")
    if (sign === md5sum(s)) {
        return next()
    }
    return "参数错误!"
}



export function getSign(order: any, key: string) {
    delete order.sign
    let arr = new Array<any>()
    for (let k in order) {
        arr.push(`${k}=${order[k]}`)
    }
    arr.sort()
    arr.push(`key=${key}`)
    return md5sum(arr.join("&")).toUpperCase()
}