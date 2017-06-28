import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { crmusersValidator } from "./validator"
import { Servers } from "../../model/crm/servers"
import { getPageCount, getServerTotal, checkCursorLimit } from "../../lib/utils"
import { sendErrMsg } from "../../lib/response"

export const router = new RouterWrap({ prefix: "/showServer" })

// 返回分页的服务器信息,参数是从哪条数据开始的start和每页显示的数量length
router.loginHandle("get", "/showServerInfo", async (ctx, next) => {
    let {page, count, search} = (ctx.request as any).query

    validateCgi({ page, count, search }, crmusersValidator.pageAndCount)

    let {cursor, limit} = getPageCount(page, count)

    let check = checkCursorLimit(cursor, limit)
    if (check)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Servers.getInstance().showServersByPages(cursor, limit, search)

    let total = await getServerTotal("", search)

    ctx.body = { "recordsTotal": total, "recordsFiltered": total, "data": res }
})

// 根据状态分页显示服务器,参数是从哪条数据开始的start和每页显示的数量length以及状态state
router.loginHandle("get", "/serversInfo", async (ctx, next) => {
    let {page, count, state, search} = (ctx.request as any).query

    validateCgi({ page, count, state, search }, crmusersValidator.pageCountState)

    let {cursor, limit} = getPageCount(page, count)

    let check = checkCursorLimit(cursor, limit)
    if (check)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Servers.getInstance().showServersByState(cursor, limit, state, search)

    let total = await getServerTotal(state, search)

    ctx.body = { "recordsTotal": total, "recordsFiltered": total, "data": res }
})