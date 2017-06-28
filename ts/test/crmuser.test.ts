///<reference path="../../typings/index.d.ts"/>
import test from "ava"
import * as supertest from "supertest"
import * as sinon from "sinon"
import { getApp } from "../init"
import { Crmusers } from "../model/crm/crmusers"
import * as redispool from "../lib/redispool"
import * as utils from "../lib/utils"

let request: supertest.SuperTest<supertest.Test>
test.before(async t => {
    let app = await getApp()
    request = supertest(app.callback())
})

export let getRedisClientAsyncStub = sinon.stub(redispool, "getRedisClientAsync")
let crmusersFindUserInfoStub = sinon.stub(Crmusers.prototype, "findUserInfo")
let crmuserGetUserTotalStub = sinon.stub(Crmusers.prototype, "getUserTotal")
let crmuserFindByUsernameStub = sinon.stub(Crmusers.prototype, "findByUsername")
let crmuserFindByUsernameNotDelStub = sinon.stub(Crmusers.prototype, "findByUsernameNotDel")
let insertUsersStub = sinon.stub(Crmusers.prototype, "insertUsers")
let findByPrimaryStub = sinon.stub(Crmusers.prototype, "findByPrimary")
let updateCrmuserStub = sinon.stub(Crmusers.prototype, "updateCrmuser")
let resetStateStub = sinon.stub(Crmusers.prototype, "resetState")
let resetPasswordStub = sinon.stub(Crmusers.prototype, "resetPassword")
let deleteUserStub = sinon.stub(Crmusers.prototype, "deleteUser")
let md5sumStub = sinon.stub(utils, "md5sum")

const s = "d096a80cc36c1bb624426842bd0c8d13"
const [key, token, id, login] = [s, s, s, new Date()]
export const loginInfo = { key, token, id, login }
export let errorPageCount = ["ss", "0.3"]
export let badPageCount = ["0", "-1"]

let addUserInfo = {
    username: "public",
    password: "123456",
    description: "xxx",
    perm: "admin",
    realname: "liny",
    phone: "15323408921",
    state: "on",
    email: "963584@qq.com",
    address: "东北"
}

let updateParams = {
    username: "interesting",
    description: "interesting",
    phone: "15323408053",
    email: "666@qq.com",
    realname: "liny",
    address: "东北老村"
}

let loginWithRoot = JSON.stringify({ ...loginInfo, perm: "root" })
let returnUser = { username: "public", password: "123456" }
let updateReturn = { username: "lansoo", state: "on" }
let addUserReturn = { id: "10", username: "public", perm: "admin" }
let getUsersReturn = { "recordsTotal": 1, "recordsFiltered": 1, "data": [{}] }
let loginReturn = { username: "root", password: "admin", state: "on", id: "1", perm: "root" }
let redisReturn = { key: "s", perm: "root", token: "s", id: "1", username: "root" }

/**
 *  登录接口
 */
// 正常登录
testOK("post", "Test login OK", [crmuserFindByUsernameStub, md5sumStub], [loginReturn, "s"], "/crmusers/login",
    { username: "root", password: "admin" }, 200, redisReturn)
// 参数username
testParams("post", "Test login username", [], [], "/crmusers/login", { username: "aaa", password: "admin" },
    400, "用户名长度错误！必须4位或4位以上")
// 参数password
testParams("post", "Test login password", [], [], "/crmusers/login", { username: "root", password: "aaa" },
    400, "密码长度错误！必须4位或4位以上")
// 用户不存在
testParams("post", "Test login user not exit", [crmuserFindByUsernameStub], [undefined], "/crmusers/login",
    { username: "public", password: "public" }, 404, "用户不存在！")
// 用户已禁用
testParams("post", "Test login user off", [crmuserFindByUsernameStub], [{ id: "1", state: "off" }], "/crmusers/login",
    { username: "root", password: "admin" }, 401, "用户已禁用！")
// 密码不正确
testParams("post", "Test login password not right", [crmuserFindByUsernameStub], [{ password: "123456" }], "/crmusers/login",
    { username: "root", password: "admin" }, 400, "密码不正确！")

/**
 *  登出接口
 */
// 正常登出
testOK("post", "Test logout", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/logout", {}, 200, { "msg": "ok" })

/**
 *  添加用户接口
 */
// 正常添加
testOK("post", "Test add user OK", [getRedisClientAsyncStub, crmuserFindByUsernameNotDelStub, insertUsersStub], [loginWithRoot, undefined,
    addUserReturn], "/crmusers/crm", addUserInfo, 200, addUserReturn)
// 没有权限
testParams("post", "Test add user no perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/crmusers/crm", addUserInfo,
    401, "没有权限")
// 非法username
testParams("post", "Test bad username", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/crm", { ...addUserInfo, username: "aaa" },
    400, "用户名长度错误！必须4位或4位以上")
// 非法password
testParams("post", "Test bad password", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/crm", { ...addUserInfo, password: "aaa" },
    400, "密码长度错误！必须4位或4位以上")
// 非法perm
testParams("post", "Test bad perm", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/crm", { ...addUserInfo, perm: "aaa" },
    400, "perm值有误")
// 非法phone
testParams("post", "Test bad phone", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/crm", { ...addUserInfo, phone: "15352" },
    400, "手机号格式错误！")
// 非法email
testParams("post", "Test bad email", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/crm", { ...addUserInfo, email: "15352" },
    400, "email有误")
// 用户已存在
testParams("post", "Test add user is exist", [getRedisClientAsyncStub, crmuserFindByUsernameNotDelStub], [loginWithRoot,
    { id: "10", username: "public", perm: "admin" }], "/crmusers/crm", addUserInfo, 400, "该用户名已经存在！")

/**
 *  获取指定条数用户信息接口
 */
// 正常获取
testOK("get", "Test get users OK", [getRedisClientAsyncStub, crmusersFindUserInfoStub, crmuserGetUserTotalStub],
    [loginWithRoot, [{}], 1], "/crmusers/users", { page: "1", count: "2", search: "" }, 200, getUsersReturn)
// 非法page
errorPageCount.forEach(v => {
    testParams("get", "Test get users error page", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/users",
        { page: v, count: "1", search: "" }, 400, "page有误")
})
// 不合要求的page
badPageCount.forEach(v => {
    testParams("get", "Test get users bad page", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/users",
        { page: v, count: "1", search: "" }, 400, "参数不合要求")
})
// 非法count
errorPageCount.forEach(v => {
    testParams("get", "Test get users error count", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/users",
        { page: "1", count: v, search: "" }, 400, "count有误")
})
// 不合要求的count
badPageCount.forEach(v => {
    testParams("get", "Test get users bad count", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/users",
        { page: "1", count: v, search: "" }, 400, "参数不合要求")
})
// 没有权限
testParams("get", "Test get users no permission", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)],
    "/crmusers/users", {}, 401, "没有权限")
// 没有登录
testParams("get", "Test not login", [], [], "/crmusers/users", {}, 401, "没有登录！")

/**
 *  获取指定用户信息接口
 */
// 正常获取
testOK("get", "Test get one user OK", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot, addUserReturn],
    "/crmusers/1", {}, 200, addUserReturn)
// 非法参数id
errorPageCount.forEach(v => {
    testParams("get", "Test get one user error id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/" + v, {}, 400, "id有误")
})
// 不合要求id
badPageCount.forEach(v => {
    testParams("get", "Test get one user error id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/" + v, {}, 400, "参数不合要求")
})
// 用户不存在
testParams("get", "Test get one user not exist", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot, undefined],
    "/crmusers/1", {}, 404, "用户不存在！")

/**
 *  修改信息接口
 */
// 正常修改
testOK("put", "Test update user OK", [getRedisClientAsyncStub, findByPrimaryStub, crmuserFindByUsernameNotDelStub, updateCrmuserStub],
    [loginWithRoot, { id: "10", username: "public", perm: "admin" }, undefined, updateReturn], "/crmusers/1", updateParams, 200, updateReturn)
// 非法参数id
errorPageCount.forEach(v => {
    testParams("put", "Test update user error id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/" + v,
        updateParams, 400, "id有误")
})
// 不合要求id
badPageCount.forEach(v => {
    testParams("put", "Test update user bad id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/" + v,
        updateParams, 400, "参数不合要求")
})
// 错误的username
testParams("put", "Test update user error username", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/1",
    { ...updateParams, username: "aaa" }, 400, "用户名长度错误！必须4位或4位以上")
// 错误的phone
testParams("put", "Test update user error phone", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/1",
    { ...updateParams, phone: "12345" }, 400, "手机号格式错误！")
// 错误的email
testParams("put", "Test update user error email", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/1",
    { ...updateParams, email: "12345" }, 400, "email有误")
// 用户不存在
testParams("put", "Test update user not exist", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot, undefined],
    "/crmusers/1", updateParams, 404, "用户不存在！")
// 用户名已存在
testParams("put", "Test update user username exist", [getRedisClientAsyncStub, findByPrimaryStub, crmuserFindByUsernameNotDelStub],
    [loginWithRoot, { id: "10", username: "public", perm: "admin" }, { id: "11", username: "interesting", perm: "admin" }],
    "/crmusers/1", updateParams, 400, "该用户名已经存在")

/**
 *  禁用/启用接口
 */
// 正常禁/启用
testOK("put", "Test change user state", [getRedisClientAsyncStub, findByPrimaryStub, resetStateStub], [loginWithRoot,
    { id: "10", username: "public", state: "on" }, { username: "public", state: "off" }], "/crmusers/state/1", { state: "off" },
    200, { username: "public", state: "off" })
// 非法参数id
errorPageCount.forEach(v => {
    testParams("put", "Test change state error id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/state/" + v,
        { state: "on" }, 400, "id有误")
})
// 不合要求id
badPageCount.forEach(v => {
    testParams("put", "Test change state bad id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/state/" + v,
        { state: "on" }, 400, "参数不合要求")
})
// 非法state
testParams("put", "Test change state error state", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/state/1",
    { state: "aaa" }, 400, "state有误")
// 用户不存在
testParams("put", "Test change state user not exist", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot, undefined],
    "/crmusers/state/1", { state: "on" }, 404, "用户不存在！")
// 用户状态没有改变
testParams("put", "Test change user state", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot,
    { id: "10", username: "public", state: "off" }], "/crmusers/state/1", { state: "off" }, 400, "用户状态没有改变")

/**
 *  修改密码接口
 */
// 正常改密
testOK("patch", "Test update password", [getRedisClientAsyncStub, findByPrimaryStub, resetPasswordStub], [loginWithRoot,
    { username: "public", password: "567891" }, returnUser], "/crmusers/password", { id: "1", password: "123456" }, 200, returnUser)
// 密码一样
testOK("patch", "Test reset same password", [getRedisClientAsyncStub, findByPrimaryStub], [JSON.stringify(loginInfo), { password: "123456" }],
    "/crmusers/password", { id: "1", password: "123456" }, 200, { password: "123456" })
// 非法id
errorPageCount.forEach(v => {
    testParams("patch", "Test reset password error id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/password",
        { id: v, password: "admin" }, 400, "id有误")
})
// 不合要求id
badPageCount.forEach(v => {
    testParams("patch", "Test reset password bad id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/password",
        { id: v, password: "admin" }, 400, "参数不合要求")
})
// 非法password
testParams("patch", "Test reset password error password", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/password",
    { id: "1", password: "aaa" }, 400, "密码长度错误！必须4位或4位以上")
// 用户不存在
testParams("patch", "Test update password user not exist", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot, undefined],
    "/crmusers/password", { id: "1", password: "admin" }, 404, "用户不存在！")

/**
 *  删除用户接口
 */
// 正常删除
testOK("delete", "Test delete user", [getRedisClientAsyncStub, findByPrimaryStub, deleteUserStub], [loginWithRoot,
    { username: "public", password: "567891" }, []], "/crmusers/users/delete/1", {}, 200, { "msg": "ok" })
// 非法id
errorPageCount.forEach(v => {
    testParams("delete", "Test delete password error id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/users/delete/" + v,
        {}, 400, "id有误")
})
// 不合要求id
badPageCount.forEach(v => {
    testParams("delete", "Test delete password bad id", [getRedisClientAsyncStub], [loginWithRoot], "/crmusers/users/delete/" + v,
        {}, 400, "参数不合要求")
})
// 没有权限
testParams("delete", "Tets delete user no perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/crmusers/users/delete/1", {}, 401, "没有权限")
// 用户不存在
testParams("delete", "Test delete user not exist", [getRedisClientAsyncStub, findByPrimaryStub], [loginWithRoot, undefined],
    "/crmusers/users/delete/1", {}, 404, "用户不存在！")
//-----------------------------------------------------------------------------------------------------------------//

export function testParams(method: string, description: string, methods: sinon.SinonStub[], returnParams: any[],
    url: string, data: any, expect: number, errMsg: any) {
    let f = (t: any, m: supertest.Test) => {
        m.set("id", id).set("token", token)
            .expect(expect)
            .end((err, res) => {
                methodsReset(methods)
                t.true(!err)
                let r = JSON.parse(res.text)
                t.true(r.error === errMsg)
                t.end()
            })
    }
    test.cb(description, t => {
        methodsForEach(methods, returnParams)
        if (method === "get") f(t, (request as any)[method](url)["query"](data))
        else f(t, (request as any)[method](url)["send"](data))

    })
}

export function testOK(method: string, description: string, methods: sinon.SinonStub[], returnParams: any[],
    url: string, data: any, expect: number, okMsg: any) {
    let f = (t: any, m: supertest.Test) => {
        m.set("id", id).set("token", token)
            .expect(expect)
            .end((err, res) => {
                methodsReset(methods)
                t.true(!err)
                let r = JSON.parse(res.text)
                t.deepEqual(r, okMsg)
                t.end()
            })
    }
    test.cb(description, t => {
        methodsForEach(methods, returnParams)
        if (method === "get") f(t, (request as any)[method](url)["query"](data))
        else f(t, (request as any)[method](url)["send"](data))
    })
}

function methodsForEach(methods: sinon.SinonStub[], returnParams: any[]) {
    for (var i = 0; i < methods.length; i++) {
        methods[i].returns(returnParams[i])
    }
}

function methodsReset(methods: sinon.SinonStub[]) {
    for (var i = 0; i < methods.length; i++) {
        methods[i].reset()
    }
}
