///<reference path="../../typings/index.d.ts"/>

import * as sinon from "sinon"
import { testOK, testParams, getRedisClientAsyncStub, badPageCount, errorPageCount, loginInfo } from "./crmuser.test"
import { findClientByIdStub, loginWithAdmin } from "./group.test"
import { Clients } from "../model/crm/clients"
import * as utils from "../lib/utils"

let showClientsByPagesStub = sinon.stub(Clients.prototype, "showClientsByPages")
let showClientsByStateStub = sinon.stub(Clients.prototype, "showClientsByState")
let removeOneBindStub = sinon.stub(Clients.prototype, "removeOneBind")
let removeManyBindsStub = sinon.stub(Clients.prototype, "removeManyBinds")
let getClientTotalStub = sinon.stub(utils, "getClientTotal")

export let loginWithNoPerm = JSON.stringify(loginInfo)

/**
 *  分页显示客户端信息接口
 */
// 正常显示
testOK("get", "Test showClientInfo OK", [getRedisClientAsyncStub, showClientsByPagesStub, getClientTotalStub],
    [loginWithNoPerm, [{ id: "1" }], 1], "/showClient/showClientInfo", { page: "1", count: "1", search: "" }, 200,
    { "recordsTotal": 1, "recordsFiltered": 1, "data": [{ id: "1" }] })
// 参数page和count
errorPageCount.forEach(v => {
    testParams("get", "Test showClientInfo error page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/showClientInfo", { page: v, count: "1", search: "" }, 400, "page有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test showClientInfo bad page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/showClientInfo", { page: v, count: "1", search: "" }, 400, "参数不合要求")
})
errorPageCount.forEach(v => {
    testParams("get", "Test showClientInfo error count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/showClientInfo", { page: "1", count: v, search: "" }, 400, "count有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test showClientInfo bad count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/showClientInfo", { page: "1", count: v, search: "" }, 400, "参数不合要求")
})

/**
 * 根据状态分页显示客户端接口
 */
// 正常显示
testOK("get", "Test clientsInfo by state", [getRedisClientAsyncStub, showClientsByStateStub, getClientTotalStub], [loginWithNoPerm,
    [], 1], "/showClient/clientsInfo", { page: "1", count: "1", state: "used", search: "" }, 200,
    { "recordsTotal": 1, "recordsFiltered": 1, "data": [] })
// 参数page、count和state
errorPageCount.forEach(v => {
    testParams("get", "Test clientsInfo error page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/clientsInfo", { page: v, count: "1", state: "new", search: "" }, 400, "page有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test clientsInfo bad page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/clientsInfo", { page: v, count: "1", state: "new", search: "" }, 400, "参数不合要求")
})
errorPageCount.forEach(v => {
    testParams("get", "Test clientsInfo error count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/clientsInfo", { page: "1", count: v, state: "new", search: "" }, 400, "count有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test clientsInfo bad count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showClient/clientsInfo", { page: "1", count: v, state: "new", search: "" }, 400, "参数不合要求")
})
testParams("get", "Test clientsInfo bad state", [getRedisClientAsyncStub], [loginWithNoPerm],
    "/showClient/clientsInfo", { page: "1", count: "1", state: "aaa", search: "" }, 400, "state有误")

/**
 *  单个客户端解绑接口
 */
// 正常解绑
testOK("patch", "Test rmClientBind OK", [getRedisClientAsyncStub, findClientByIdStub, removeOneBindStub], [loginWithAdmin,
    { state: "used", groupid: "1" }, []], "/showClient/rmClientBind", { id: "1" }, 200, [])
// 没有权限
testParams("patch", "Test rmClientBind no perm", [getRedisClientAsyncStub], [loginWithNoPerm], "/showClient/rmClientBind",
    { id: "1" }, 401, "没有权限")
// 参数id
errorPageCount.forEach(v => {
    testParams("patch", "Test rmClientBind error page", [getRedisClientAsyncStub], [loginWithAdmin],
        "/showClient/rmClientBind", { id: v }, 400, "id有误")
})
badPageCount.forEach(v => {
    testParams("patch", "Test rmClientBind bad page", [getRedisClientAsyncStub], [loginWithAdmin],
        "/showClient/rmClientBind", { id: v }, 400, "参数不合要求")
})
// 不存在的客户端
testParams("patch", "Test rmClientBind error page", [getRedisClientAsyncStub, findClientByIdStub], [loginWithAdmin, undefined],
    "/showClient/rmClientBind", { id: "1" }, 404, "不存在的客户端")
testParams("patch", "Test rmClientBind error page", [getRedisClientAsyncStub, findClientByIdStub], [loginWithAdmin, { state: "off" }],
    "/showClient/rmClientBind", { id: "1" }, 404, "不存在的客户端")
// 客户端无须解绑
testParams("patch", "Test rmClientBind error page", [getRedisClientAsyncStub, findClientByIdStub], [loginWithAdmin,
    { state: "new", groupid: null }], "/showClient/rmClientBind", { id: "1" }, 400, "客户端无须解绑")

/**
 *  个客户端解绑接口
 */
// 正常解绑
testOK("patch", "Test rmManyClisBinds OK", [getRedisClientAsyncStub, findClientByIdStub, removeManyBindsStub], [loginWithAdmin,
    { state: "used", groupid: "1" }, []], "/showClient/rmManyClisBinds", { arr: ["1"] }, 200, [])
// 没有权限
testParams("patch", "Test rmManyClisBinds no perm", [getRedisClientAsyncStub], [loginWithNoPerm], "/showClient/rmManyClisBinds",
    { arr: ["1"] }, 401, "没有权限")
// 参数id
testParams("patch", "Test rmManyClisBinds error page", [getRedisClientAsyncStub], [loginWithAdmin],
    "/showClient/rmManyClisBinds", { arr: errorPageCount }, 400, "arr数组错误")
testParams("patch", "Test rmClientBind bad page", [getRedisClientAsyncStub], [loginWithAdmin],
    "/showClient/rmManyClisBinds", { arr: badPageCount }, 400, "参数不合要求")
// 不存在的客户端
testParams("patch", "Test rmManyClisBinds error page", [getRedisClientAsyncStub, findClientByIdStub], [loginWithAdmin, undefined],
    "/showClient/rmManyClisBinds", { arr: ["1"] }, 404, "id为1的客户端不存在")
testParams("patch", "Test rmManyClisBinds error page", [getRedisClientAsyncStub, findClientByIdStub], [loginWithAdmin, { state: "off" }],
    "/showClient/rmManyClisBinds", { arr: ["1"] }, 404, "id为1的客户端不存在")
// 客户端无须解绑
testParams("patch", "Test rmManyClisBinds error page", [getRedisClientAsyncStub, findClientByIdStub], [loginWithAdmin,
    { state: "new", groupid: null }], "/showClient/rmManyClisBinds", { arr: ["1"] }, 400, "id为1的客户端无须解绑")
