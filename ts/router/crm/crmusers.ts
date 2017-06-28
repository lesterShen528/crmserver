import { validateCgi } from "../../lib/validator"
import { crmusersValidator } from "./validator"
import { Crmusers } from "../../model/crm/crmusers"
import { RouterWrap } from "../../lib/routerwrap"
import { checkCursorLimit, getPageCount, checkPassword, md5sum } from "../../lib/utils"
import { delLogin, setLoginAsync, LoginInfo } from "../../redis/logindao"
import { sendOK, sendNoPerm, sendNotFound, sendErrMsg } from "../../lib/response"

export const router = new RouterWrap({ prefix: "/crmusers" })

router.handle('get', '/test', async (ctx, next) => {
    const {ip, mac, uid, magic, rid, _t} = (ctx.request as any).query
    console.log(ip, mac, uid, magic, rid, _t)
    ctx.body = "666"
})


// 登陆
router.handle("post", "/login", async (ctx, next) => {
    const { username, password } = (ctx.request as any).body

    validateCgi({ username, password }, crmusersValidator.login)

    let user = await Crmusers.getInstance().findByUsername(username)
    if (!user) {
        return sendNotFound(ctx, "用户不存在！")
    } else if (user.state == "off") {
        return sendNoPerm(ctx, "用户已禁用！")
    }

    checkPassword(password, user.password)

    let [now, id] = [new Date(), user.id]
    let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]

    /* 缓存用户登陆信息到redis：key=id, value = {key:key, token:token, login:time, perm:perm}，
            key是双方协商的密钥，token是临时访问令牌, perm是权限列表 */
    let cache = new LoginInfo(id, key, token, now.toLocaleString(), user.perm)
    await setLoginAsync(id, cache)

    ctx.cookies.set("perm", user.perm, { maxAge: 90000000, httpOnly: false })
    ctx.cookies.set("username", user.username, { maxAge: 90000000, httpOnly: false })
    ctx.cookies.set("token", token, { maxAge: 90000000, httpOnly: false })
    ctx.cookies.set("id", id, { maxAge: 90000000, httpOnly: false })

    ctx.body = { key: key, perm: user.perm, token: token, id: id, username: user.username }
})

// 登出
router.loginHandle('post', "/logout", async (ctx, next) => {
    let loginInfo: LoginInfo = (ctx.request as any).loginInfo
    delLogin(loginInfo.getId())  // 不等待
    ctx.body = { "msg": "ok" }
})

// 添加用户
router.loginHandle("post", "/crm", async (ctx, next) => {
    let { username, password, description, state } = (ctx.request as any).body
    let { perm, phone, email, realname, address} = (ctx.request as any).body

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isRoot())
        return sendNoPerm(ctx, "没有权限")

    let obj = { username, password, description, state, perm, phone, email, realname, address }

    validateCgi(obj, crmusersValidator.create)

    let user = await Crmusers.getInstance().findByUsernameNotDel(obj.username);
    if (!!user) {
        return sendErrMsg(ctx, "该用户名已经存在！")
    }

    let crmuser = await Crmusers.getInstance().insertUsers(obj)
    delete crmuser.password
    delete crmuser.deleted
    delete crmuser.ext

    ctx.body = crmuser
})

// 查询指定条数的user信息,参数是从哪条数据开始的start和每页显示的数量length
router.loginHandle("get", "/users", async (ctx, next) => {
    const {page, count, search} = (ctx.request as any).query

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isRoot())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ page, count, search }, crmusersValidator.pageAndCount)

    let {cursor, limit } = getPageCount(page, count)

    let check = checkCursorLimit(cursor, limit)
    if (check)
        return sendErrMsg(ctx, "参数不合要求")

    let crmusers = await Crmusers.getInstance().findUserInfo(cursor, limit, search)

    let total = await Crmusers.getInstance().getUserTotal(search)

    ctx.body = { "recordsTotal": total, "recordsFiltered": total, "data": crmusers }
})

// 查询某一条crm用户记录
router.loginHandle("get", "/:id", async (ctx, next) => {
    const { id } = ctx.params

    validateCgi({ id }, crmusersValidator.id)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let user = await Crmusers.getInstance().findByPrimary(id)
    if (!user)
        return sendNotFound(ctx, "用户不存在！")

    delete user.deleted
    delete user.ext

    ctx.body = user
})

// 修改
router.loginHandle("put", "/:id", async (ctx, next) => {
    const { id } = ctx.params

    let { username, description, phone } = (ctx.request as any).body
    let { email, realname, address } = (ctx.request as any).body

    validateCgi({ id }, crmusersValidator.id)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    validateCgi({ username, description, phone, email, realname, address }, crmusersValidator.updateCrmUser)

    let obj = { username, description, phone, email, realname, address }

    let duser = await Crmusers.getInstance().findByPrimary(id)
    if (!duser)
        return sendNotFound(ctx, "用户不存在！")

    if (duser.username !== obj.username) {
        let user = await Crmusers.getInstance().findByUsernameNotDel(obj.username);
        if (!!user) {
            return sendErrMsg(ctx, "该用户名已经存在")
        }
    }

    let result = await Crmusers.getInstance().updateCrmuser(obj, id)

    delete result.password
    delete result.deleted
    delete result.ext

    ctx.body = result
})

// 禁用/启用
router.loginHandle("put", "/state/:id", async (ctx, next) => {
    const { id } = ctx.params
    let { state } = (ctx.request as any).body

    validateCgi({ id, state }, crmusersValidator.setState)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Crmusers.getInstance().findByPrimary(id)
    if (!res)
        return sendNotFound(ctx, "用户不存在！")

    if (res.state === state)
        return sendErrMsg(ctx, "用户状态没有改变")

    let user = await Crmusers.getInstance().resetState(id, state)

    delete user.deleted
    delete user.ext

    ctx.body = user
})

// 修改密码
router.loginHandle("patch", "/password", async (ctx, next) => {
    const { id, password } = (ctx.request as any).body

    validateCgi({ id, password }, crmusersValidator.setPassword)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let user = await Crmusers.getInstance().findByPrimary(id)
    if (!user)
        return sendNotFound(ctx, "用户不存在！")

    if (user.password === password)
        return sendOK(ctx, user)

    let res = await Crmusers.getInstance().resetPassword(id, password)

    delete res.deleted
    delete res.ext

    return sendOK(ctx, res)
})

// 删除
router.loginHandle("delete", "/users/delete/:id", async (ctx, next) => {
    const { id } = ctx.params

    const info: LoginInfo = (ctx.request as any).loginInfo
    if (!info.isRoot())
        return sendNoPerm(ctx, "没有权限")

    validateCgi({ id }, crmusersValidator.id)

    if (id < 1)
        return sendErrMsg(ctx, "参数不合要求")

    let res = await Crmusers.getInstance().findByPrimary(id)
    if (!res)
        return sendNotFound(ctx, "用户不存在！")

    await Crmusers.getInstance().deleteUser(id)

    ctx.body = { "msg": "ok" }
})