import { start } from "../connect/index"
export function init(map: { deamonNotifyMap: Map<string, Function>, deamonGetMap: Map<string, Function> }) {
    map.deamonNotifyMap.set("demoSet", demoSet)
    map.deamonGetMap.set("demoGet", demoGet)
    process.nextTick(connect)
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function connect() {
    //连接mqtt云端
    await start()
}

function demoSet(event: string, args: any) {

}

async function demoGet(event: string, args: any) {
    await sleep(1000)
    return new Date()
}