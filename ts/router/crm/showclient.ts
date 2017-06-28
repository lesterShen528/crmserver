import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { crmusersValidator, groupsValidator } from "./validator"
import { Clients } from "../../model/crm/clients"
import { LoginInfo } from "../../redis/logindao"
import { sendNoPerm, sendErrMsg, sendNotFound } from "../../lib/response"
import { getPageCount, getClientTotal, checkCursorLimit } from "../../lib/utils"

export const router = new RouterWrap({ prefix: "/showClient" })

// 分页显示客户端信息以及分配了服务器的分组,参数是从哪条数据开始的start和每页显示的数量length
router.loginHandle("get", "/showClientInfo", async (ctx, next) => {
    let { page, count, search } = (ctx.request as any).query

    validateCgi({ page, count, search }, crmusersValidator.pageAndCount)

    let {cursor, limit} = getPageCount(page, count)

    let check = checkCursorLimit(cursor, limit)
    if (check)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Clients.getInstance().showClientsByPages(cursor, limit, search)

    let total = await getClientTotal("", search)

    ctx.body = { "recordsTotal": total, "recordsFiltered": total, "data": res }
})

// 根据状态分页显示客户端,参数是从哪条数据开始的start和每页显示的数量length以及状态state
router.loginHandle("get", "/clientsInfo", async (ctx, next) => {
    let {page, count, state, search} = (ctx.request as any).query

    validateCgi({ page, count, state, search }, crmusersValidator.pageCountState)

    let {cursor, limit} = getPageCount(page, count)

    let check = checkCursorLimit(cursor, limit)
    if (check)
        return sendErrMsg(ctx, "参数不合要求")

    let client = await Clients.getInstance().showClientsByState(cursor, limit, state, search)

    let total = await getClientTotal(state, search)

    ctx.body = { "recordsTotal": total, "recordsFiltered": total, "data": client }
})

// 单个客户端解绑,参数是客户端的id
router.loginHandle("patch", "/rmClientBind", async (ctx, next) => {
    let {id} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ id }, crmusersValidator.id)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let client = await Clients.getInstance().findClientById(id)
    if (!client || client.state === "off")
        return sendNotFound(ctx, "不存在的客户端")

    if (client.state === "new" && !client.groupid)
        return sendErrMsg(ctx, "客户端无须解绑")

    let res = await Clients.getInstance().removeOneBind(id)

    ctx.body = res
})

// 多个客户端解绑，参数是客户端id组成的数组arr
router.loginHandle("patch", "/rmManyClisBinds", async (ctx, next) => {
    let {arr} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isAdmin())
        return sendNoPerm(ctx, "没有权限")

    for (let tid of arr) {
        validateCgi({ tid }, groupsValidator.tid)

        if (tid < 1)
            return sendErrMsg(ctx, "参数不合要求")

        let client = await Clients.getInstance().findClientById(tid)

        if (!client || client.state === "off")
            return sendNotFound(ctx, "id为" + tid + "的客户端不存在")

        if (client.state === "new" && !client.groupid)
            return sendErrMsg(ctx, "id为" + tid + "的客户端无须解绑")
    }

    let res = await Clients.getInstance().removeManyBinds(arr)

    ctx.body = res
})