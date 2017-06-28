import { validateCgi } from "../../lib/validator"
import { crmusersValidator, groupsValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { Groups } from "../../model/crm/groups"
import { Clients } from "../../model/crm/clients"
import { Servers } from "../../model/crm/servers"
import { sendNoPerm, sendErrMsg, sendNotFound } from "../../lib/response"
import { LoginInfo } from "../../redis/logindao"
import { publishSerMes } from "../../deamon/connect/index"
import { getPageCount, checkCursorLimit } from "../../lib/utils"

export const router = new RouterWrap({ prefix: "/groups" })

// 获取一个分组下的客户端,参数是groupid
router.loginHandle("get", "/oneGroupOfDevice", async (ctx, next) => {
    let {groupid} = (ctx.request as any).query

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ groupid }, crmusersValidator.group)

    if (groupid < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let group = await Groups.getInstance().findGroupById(groupid)
    if (!group)
        return sendNotFound(ctx, "不存在的分组")

    let client = await Clients.getInstance().getDevicesByGroupid(groupid)

    ctx.body = client
})

// 获取客户端或者服务器总数
router.handle("get", "/totalDevices", async (ctx, next) => {
    let {type} = (ctx.request as any).query

    validateCgi({ type }, groupsValidator.type)

    let res
    switch (type) {
        case "Client":
            res = await Clients.getInstance().getTotalClients("")
            break
        case "Server":
            res = await Servers.getInstance().getTotalServers("")
            break
        case "Group":
            res = await Groups.getInstance().getTotalGroups("")
            break
    }

    ctx.body = res
})

// 返回空数组
router.handle("get", "/emptyArr", async (ctx, next) => {
    ctx.body = []
})

// 新增一个分组并绑定服务器,参数是对分组的描述description和服务器id
router.loginHandle("post", "/addGroup", async (ctx, next) => {
    let {description, id} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ description, id }, crmusersValidator.des)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let server = await Servers.getInstance().findServerById(id)
    if (!server.id)
        return sendNotFound(ctx, "不存在的服务器")

    let group = await Groups.getInstance().findGroupByServerid(id)
    if (!!group || server.state === "used")
        return sendErrMsg(ctx, "该服务器已有分组")

    let res = await Groups.getInstance().insertGroup(description, id)

    ctx.body = res
})

// 分页显示分组信息和每个分组下的客户端数量,参数是从哪条数据开始的start和每页显示的数量length
router.loginHandle("get", "/showGroupsByPage", async (ctx, next) => {
    let {page, count, search} = (ctx.request as any).query

    validateCgi({ page, count, search }, crmusersValidator.pageAndCount)

    let { cursor, limit } = getPageCount(page, count)

    let check = checkCursorLimit(cursor, limit)
    if (check)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Groups.getInstance().findGroupInfo(cursor, limit, search)

    let total = await Groups.getInstance().getTotalGroups(search)

    ctx.body = { "recordsTotal": total, "recordsFiltered": total, "data": res }
})

// 给客户端分组,参数是groupid和客户端的id
router.loginHandle("patch", "/giveDeviceGroup", async (ctx, next) => {
    let {groupid, id} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ groupid, id }, groupsValidator.check)

    if (groupid < 1 || id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let group = await Groups.getInstance().findGroupById(groupid)
    if (!group)
        return sendNotFound(ctx, "不存在的分组")

    let client = await Clients.getInstance().findClientById(id)
    if (!client)
        return sendNotFound(ctx, "不存在的客户端")

    if (client.state !== "new" && !!client.groupid)
        return sendErrMsg(ctx, "该客户端已有分组", 400)

    let serverid = group.serverid
    let server = await Servers.getInstance().findServerById(serverid)
    const {host, ip, ports} = server

    let res = await Clients.getInstance().updateGroupid(id, groupid)
    const {type, subtype, devid} = res

    await publishSerMes(`/${type}/${subtype}/${devid}`, { host, ip, ports })

    ctx.body = res
})

// 给客户端批量分组,参数groupid和客户端id组成的数组arr
router.loginHandle("patch", "/batchGroups", async (ctx, next) => {
    let {groupid, arr} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ groupid }, groupsValidator.groupid)

    if (groupid < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let group = await Groups.getInstance().findGroupById(groupid)
    if (!group)
        return sendNotFound(ctx, "不存在的分组")

    for (let tid of arr) {
        validateCgi({ tid }, groupsValidator.tid)

        if (tid < 1)
            return sendErrMsg(ctx, "参数不合要求")

        let client = await Clients.getInstance().findClientById(tid)

        if (!client)
            return sendNotFound(ctx, "id为" + tid + "的客户端不存在")

        if (client.state !== "new" && !!client.groupid)
            return sendErrMsg(ctx, "id为" + tid + "的客户端已有分组", 400)
    }

    let serverid = group.serverid
    let server = await Servers.getInstance().findServerById(serverid)
    const {host, ip, ports} = server

    let res = await Clients.getInstance().batchGrouping(arr, groupid)

    for (let result of res) {
        const {type, subtype, devid} = result
        await publishSerMes(`/${type}/${subtype}/${devid}`, { host, ip, ports })
    }

    ctx.body = res
})

// 删除一个分组,参数是groups的id
router.loginHandle("delete", "/deleteGroup/:id", async (ctx, next) => {
    const { id } = ctx.params

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ id }, groupsValidator.id)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Groups.getInstance().findGroupById(id)
    if (!res)
        return sendNotFound(ctx, "不存在的分组")

    let client = await Clients.getInstance().getDevicesByGroupid(id)

    await Groups.getInstance().deleteGroup(id, res.serverid, client)

    ctx.body = { "msg": "ok" }
})

// 修改分组信息,参数是groups的id
router.loginHandle("patch", "/updateGroup", async (ctx, next) => {
    let {id, description} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ id, description }, groupsValidator.updateGroup)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let group = await Groups.getInstance().findGroupById(id)
    if (!group)
        return sendNotFound(ctx, "不存在的分组")

    if (group.description === description)
        return sendErrMsg(ctx, "没有任何修改")

    let result = await Groups.getInstance().updateGroup(id, description)

    ctx.body = result
})

// 获取所有设备的数量
router.handle("get", "/showAllClient", async (ctx, next) => {
    let client = await Clients.getInstance().getCount()
    let server = await Servers.getInstance().getCount()
    ctx.body = client.concat(server)
})