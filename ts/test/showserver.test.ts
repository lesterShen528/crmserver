///<reference path="../../typings/index.d.ts"/>

import * as sinon from "sinon"
import { Servers } from "../model/crm/servers"
import { testOK, testParams, getRedisClientAsyncStub, badPageCount, errorPageCount } from "./crmuser.test"
import { loginWithNoPerm } from "./showclient.test"
import * as utils from "../lib/utils"

let showServersByPagesStub = sinon.stub(Servers.prototype, "showServersByPages")
let showServersByStateStub = sinon.stub(Servers.prototype, "showServersByState")
let getServerTotalStub = sinon.stub(utils, "getServerTotal")

/**
 *  显示分页的服务器信息接口
 */
// 正常显示
testOK("get", "Test showServerInfo OK", [getRedisClientAsyncStub, showServersByPagesStub, getServerTotalStub],
    [loginWithNoPerm, [{ id: "1" }], 1], "/showServer/showServerInfo", { page: "1", count: "1", search: "" }, 200,
    { "recordsTotal": 1, "recordsFiltered": 1, "data": [{ id: "1" }] })
// 参数page和count
errorPageCount.forEach(v => {
    testParams("get", "Test showServerInfo error page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/showServerInfo", { page: v, count: "1", search: "" }, 400, "page有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test showServerInfo bad page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/showServerInfo", { page: v, count: "1", search: "" }, 400, "参数不合要求")
})
errorPageCount.forEach(v => {
    testParams("get", "Test showServerInfo error count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/showServerInfo", { page: "1", count: v, search: "" }, 400, "count有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test showServerInfo bad count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/showServerInfo", { page: "1", count: v, search: "" }, 400, "参数不合要求")
})

/**
 *  根据状态分页显示服务器接口
 */
// 正常显示
testOK("get", "Test serversInfo by state", [getRedisClientAsyncStub, showServersByStateStub, getServerTotalStub], [loginWithNoPerm,
    [], 1], "/showServer/serversInfo", { page: "1", count: "1", state: "used", search: "" }, 200,
    { "recordsTotal": 1, "recordsFiltered": 1, "data": [] })
// 参数page、count和state
errorPageCount.forEach(v => {
    testParams("get", "Test serversInfo error page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/serversInfo", { page: v, count: "1", state: "new", search: "" }, 400, "page有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test serversInfo bad page", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/serversInfo", { page: v, count: "1", state: "new", search: "" }, 400, "参数不合要求")
})
errorPageCount.forEach(v => {
    testParams("get", "Test serversInfo error count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/serversInfo", { page: "1", count: v, state: "new", search: "" }, 400, "count有误")
})
badPageCount.forEach(v => {
    testParams("get", "Test serversInfo bad count", [getRedisClientAsyncStub], [loginWithNoPerm],
        "/showServer/serversInfo", { page: "1", count: v, state: "new", search: "" }, 400, "参数不合要求")
})
testParams("get", "Test serversInfo bad state", [getRedisClientAsyncStub], [loginWithNoPerm],
    "/showServer/serversInfo", { page: "1", count: "1", state: "aaa", search: "" }, 400, "state有误")

