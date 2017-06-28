let deamonGetMap: Map<string, any>
let deamonNotifyMap: Map<string, any>

function checkFunction(map: Map<string, any>, event: string): Function {
    let f = map.get(event)
    if (!f)
        throw new Error("invalid event " + event)
    return f
}
export function deamonNotify(event: string, args?: any) {
    checkFunction(deamonNotifyMap, event)(event, args)
}

export async function deamonGet(event: string, args?: any) {
    return checkFunction(deamonGetMap, event)(event, args)
}

import { stat } from "fs"
import { join } from "path"
import winston = require("winston")
import { promisify } from "bluebird"
import * as assert from "assert"
export async function init() {
    [deamonGetMap, deamonNotifyMap] = [new Map(), new Map()]

    let paths: string[] = [
        "./demo/index",
    ]

    const statAsync = promisify(stat)
    await Promise.all(paths.map(path => statAsync(join(__dirname, path) + ".js")))
    paths.forEach(path => {
        let m = require(path)
        assert(m.init, `miss init in file ${path}`)
        m.init({ deamonNotifyMap, deamonGetMap })
    })

    winston.info("init deamon ok")
}

