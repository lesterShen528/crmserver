import { $groupServerOpt } from "../../config/mqtt"
import * as mqtt from 'mqtt'
import winston = require("winston")

let client: mqtt.MqttClient
let failed: any
export async function publishSerMes(topic: string, obj: any) {
    client.publish(topic, JSON.stringify(obj), { qos: 0 }, (err: Error) => {
        if (!err)
            return

        winston.error(`publish fail ${err.message}`)
        return failed(err)
    })
}

export async function start() {

    let opt = $groupServerOpt.toJS()

    await new Promise(async (resolve, reject) => {
        let url = `mqtt://${opt.host}:${opt.port}`

        client = mqtt.connect(url, opt.options)
        winston.info(`连接成功`)

        const stop = () => {    // 停止所有listener，断开连接，并结束promise
            client.removeAllListeners()
            client.end(true)
        }

        failed = (err: any) => {
            stop()
            reject(err)
        }

        client.on("reconnect", () => { winston.warn("reconnect") })     // 重连事件
        client.on("close", (err: any) => { winston.error(`close on error ${err}`) })  //断开事件
        client.on("error", (err: any) => {      // 异常事件
            stop()                              // 其他异常，重新连接
            winston.error(`1 error ${err}`)
            return reject(err)
        })
    })
}
