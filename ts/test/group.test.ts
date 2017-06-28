///<reference path="../../typings/index.d.ts"/>

import * as sinon from "sinon"
import { testOK, testParams, getRedisClientAsyncStub, badPageCount, errorPageCount, loginInfo } from "./crmuser.test"
import { Groups } from "../model/crm/groups"
import { Clients } from "../model/crm/clients"
import { Servers } from "../model/crm/servers"
import * as index from "../deamon/connect/index"

let findGroupByIdStub = sinon.stub(Groups.prototype, "findGroupById")
let getDevicesByGroupidStub = sinon.stub(Clients.prototype, "getDevicesByGroupid")
let getTotalGroupsStub = sinon.stub(Groups.prototype, "getTotalGroups")
let findServerByIdStub = sinon.stub(Servers.prototype, "findServerById")
let findGroupByServeridStub = sinon.stub(Groups.prototype, "findGroupByServerid")
let insertGroupStub = sinon.stub(Groups.prototype, "insertGroup")
let findGroupInfoStub = sinon.stub(Groups.prototype, "findGroupInfo")
let updateGroupidStub = sinon.stub(Clients.prototype, "updateGroupid")
let batchGroupingStub = sinon.stub(Clients.prototype, "batchGrouping")
let deleteGroupStub = sinon.stub(Groups.prototype, "deleteGroup")
let updateGroupStub = sinon.stub(Groups.prototype, "updateGroup")
let clientGetCount = sinon.stub(Clients.prototype, "getCount")
let serverGetCount = sinon.stub(Servers.prototype, "getCount")
let getTotalClientsStub = sinon.stub(Clients.prototype, "getTotalClients")
let getTotalServersStub = sinon.stub(Servers.prototype, "getTotalServers")
let publishSerMesStub = sinon.stub(index, "publishSerMes")
export let findClientByIdStub = sinon.stub(Clients.prototype, "findClientById")

export let loginWithAdmin = JSON.stringify({ ...loginInfo, perm: "admin" })
let errorType = ["groups", "sss"]

/**
 *  获取一个分组下的客户端接口
 */
// 正常获取
testOK("get", "Test oneGroupOfDevice OK", [getRedisClientAsyncStub, findGroupByIdStub, getDevicesByGroupidStub], [loginWithAdmin,
    { id: "5" }, []], "/groups/oneGroupOfDevice", { groupid: "1" }, 200, [])
// 没有权限
testParams("get", "Test oneGroupOfDevice on perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/groups/oneGroupOfDevice",
    { groupid: "1" }, 401, "没有权限")
// 非法groupid
errorPageCount.forEach(v => {
    testParams("get", "Test oneGroupOfDevice error groupid", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/oneGroupOfDevice",
        { groupid: v }, 400, "groupid有误")
})
//  不合要求的groupid
badPageCount.forEach(v => {
    testParams("get", "Test oneGroupOfDevice bad groupid", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/oneGroupOfDevice",
        { groupid: v }, 400, "参数不合要求")
})
// 不存在的分组
testParams("get", "Test oneGroupOfDevice group not exist", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, undefined],
    "/groups/oneGroupOfDevice", { groupid: "1" }, 404, "不存在的分组")

/**
 *  获取终端或分组总数接口
 */
// 正常获取
testOK("get", "Test totalDevices Group OK", [getTotalGroupsStub], [3], "/groups/totalDevices", { type: "Group" }, 200, 3)
testOK("get", "Test totalDevices Client OK", [getTotalClientsStub], [3], "/groups/totalDevices", { type: "Client" }, 200, 3)
testOK("get", "Test totalDevices Server OK", [getTotalServersStub], [3], "/groups/totalDevices", { type: "Server" }, 200, 3)
// 参数type
errorType.forEach(v => {
    testParams("get", "Test totalDevices type", [], [], "/groups/totalDevices", { type: v }, 400, "type有误")
})

/**
 *  返回空数组接口
 */
// 正常
testOK("get", "Test emptyArr OK", [], [], "/groups/emptyArr", {}, 200, [])

/**
 *  新增一个分组接口
 */
// 正常新增
testOK("post", "Test add one group", [getRedisClientAsyncStub, findServerByIdStub, findGroupByServeridStub, insertGroupStub],
    [loginWithAdmin, { id: "1", state: "new" }, undefined, { id: "6", serverid: "6" }], "/groups/addGroup",
    { description: "xxx", id: "6" }, 200, { id: "6", serverid: "6" })
// 没有权限
testParams("post", "Test addGroup no perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/groups/addGroup", { description: "xxx", id: "6" },
    401, "没有权限")
// 非法id
errorPageCount.forEach(v => {
    testParams("post", "Test addGroup error id", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/addGroup",
        { description: "xx", id: v }, 400, "id有误")
})
// 不合要求的id
badPageCount.forEach(v => {
    testParams("post", "Test addGroup error id", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/addGroup",
        { description: "xx", id: v }, 400, "参数不合要求")
})
// 不存在的服务器
testParams("post", "Test addGroup server not exist", [getRedisClientAsyncStub, findServerByIdStub], [loginWithAdmin, {}],
    "/groups/addGroup", { description: "xxx", id: "1" }, 404, "不存在的服务器")
// 服务器已有分组
testParams("post", "Test addGroup has group", [getRedisClientAsyncStub, findServerByIdStub, findGroupByServeridStub],
    [loginWithAdmin, { id: "1", state: "used" }, undefined], "/groups/addGroup", { description: "xxx", id: "1" },
    400, "该服务器已有分组")
testParams("post", "Test addGroup has group", [getRedisClientAsyncStub, findServerByIdStub, findGroupByServeridStub],
    [loginWithAdmin, { id: "1" }, { id: "5" }], "/groups/addGroup", { description: "xxx", id: "1" },
    400, "该服务器已有分组")

/**
 *  分页显示分组信息和每个分组下的客户端数量接口
 */
// 正常显示
testOK("get", "Test get groups by page", [getRedisClientAsyncStub, findGroupInfoStub, getTotalGroupsStub], [loginWithAdmin, [], 1],
    "/groups/showGroupsByPage", { page: "1", count: "1", search: "" }, 200, { "recordsTotal": 1, "recordsFiltered": 1, "data": [] })
// 非法page
errorPageCount.forEach(v => {
    testParams("get", "Test get groups error page", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/showGroupsByPage",
        { page: v, count: "1", search: "" }, 400, "page有误")
})
// 不合要求的page
badPageCount.forEach(v => {
    testParams("get", "Test get groups bad page", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/showGroupsByPage",
        { page: v, count: "1", search: "" }, 400, "参数不合要求")
})
// 非法count
errorPageCount.forEach(v => {
    testParams("get", "Test get groups error count", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/showGroupsByPage",
        { page: "1", count: v, search: "" }, 400, "count有误")
})
// 不合要求的count
badPageCount.forEach(v => {
    testParams("get", "Test get groups bad count", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/showGroupsByPage",
        { page: "1", count: v, search: "" }, 400, "参数不合要求")
})

/**
 *  给客户端分组接口
 */
// 正常分组
testOK("patch", "Test give client group OK", [getRedisClientAsyncStub, findGroupByIdStub, findClientByIdStub, findServerByIdStub,
    updateGroupidStub, publishSerMesStub], [loginWithAdmin, { serverid: "5" }, { state: "new", groupid: null }, [],
        { groupid: "5", state: "new" }, ""], "/groups/giveDeviceGroup", { groupid: "1", id: "1" }, 200, { groupid: "5", state: "new" })
// 没有权限
testParams("patch", "Test giveDeviceGroup no perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/groups/giveDeviceGroup",
    { groupid: "1", id: "1" }, 401, "没有权限")
// 参数
errorPageCount.forEach(v => {
    testParams("patch", "Test error groupid", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/giveDeviceGroup",
        { groupid: v, id: "1" }, 400, "id有误")
})
badPageCount.forEach(v => {
    testParams("patch", "Test bad groupid", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/giveDeviceGroup",
        { groupid: v, id: "1" }, 400, "参数不合要求")
})
errorPageCount.forEach(v => {
    testParams("patch", "Test get groups error count", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/giveDeviceGroup",
        { groupid: "1", id: v }, 400, "id有误")
})
badPageCount.forEach(v => {
    testParams("patch", "Test get groups bad count", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/giveDeviceGroup",
        { groupid: "1", id: v }, 400, "参数不合要求")
})
// 不存在的分组
testParams("patch", "Test group not exist", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, undefined], "/groups/giveDeviceGroup",
    { groupid: "1", id: "1" }, 404, "不存在的分组")
// 不存在的客户端
testParams("patch", "Test client not exist", [getRedisClientAsyncStub, findGroupByIdStub, findClientByIdStub],
    [loginWithAdmin, { id: "1" }, undefined], "/groups/giveDeviceGroup", { groupid: "1", id: "1" }, 404, "不存在的客户端")
// 客户端已有分组
testParams("patch", "Test group exist", [getRedisClientAsyncStub, findGroupByIdStub, findClientByIdStub], [loginWithAdmin, { id: "1" },
    { state: "used", groupid: "1" }], "/groups/giveDeviceGroup", { groupid: "1", id: "1" }, 400, "该客户端已有分组")

/**
 *  给客户端批量分组接口
 */
// 正常分组
testOK("patch", "Test batchGroups OK", [getRedisClientAsyncStub, findGroupByIdStub, findClientByIdStub, findServerByIdStub,
    batchGroupingStub, publishSerMesStub], [loginWithAdmin, { id: "5" }, { state: "new", groupid: null }, [], [], ""], "/groups/batchGroups",
    { groupid: "1", arr: [1, 2] }, 200, [])
// 没有权限
testParams("patch", "Test batchGroups no perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/groups/batchGroups",
    { groupid: "1", arr: [1, 2] }, 401, "没有权限")
// 参数
errorPageCount.forEach(v => {
    testParams("patch", "Test batchGroups error groupid", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/batchGroups",
        { groupid: v, arr: ["1", "2"] }, 400, "id有误")
})
badPageCount.forEach(v => {
    testParams("patch", "Test batchGroups bad groupid", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/batchGroups",
        { groupid: v, arr: ["1", "2"] }, 400, "参数不合要求")
})
testParams("patch", "Test batchGroups error arr", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, { id: "1" }],
    "/groups/batchGroups", { groupid: "1", arr: errorPageCount }, 400, "arr数组错误")
testParams("patch", "Test batchGroups bad arr", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, { id: "1" }],
    "/groups/batchGroups", { groupid: "1", arr: badPageCount }, 400, "参数不合要求")
// 不存在的分组
testParams("patch", "Test batchGroups group not exist", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, undefined],
    "/groups/batchGroups", { groupid: "1", arr: ["1"] }, 404, "不存在的分组")
// 不存在的客户端
testParams("patch", "Test batchGroups client not exist", [getRedisClientAsyncStub, findGroupByIdStub, findClientByIdStub],
    [loginWithAdmin, { id: "1" }, undefined], "/groups/batchGroups", { groupid: "1", arr: ["1"] }, 404, "id为1的客户端不存在")
// 客户端已有分组
testParams("patch", "Test batchGroups group exist", [getRedisClientAsyncStub, findGroupByIdStub, findClientByIdStub], [loginWithAdmin, { id: "1" },
    { state: "used", groupid: "1" }], "/groups/batchGroups", { groupid: "1", arr: ["1"] }, 400, "id为1的客户端已有分组")

/**
 *  删除一个分组接口
 */
// 正常删除
testOK("delete", "Test delete group OK", [getRedisClientAsyncStub, findGroupByIdStub, getDevicesByGroupidStub, deleteGroupStub],
    [loginWithAdmin, { id: "1" }, [], []], "/groups/deleteGroup/1", {}, 200, { "msg": "ok" })
// 没有权限
testParams("delete", "Test deleteGroup on perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/groups/deleteGroup/1",
    {}, 401, "没有权限")
// 参数
errorPageCount.forEach(v => {
    testParams("delete", "Test delete group error id", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/deleteGroup/" + v,
        {}, 400, "id有误")
})
badPageCount.forEach(v => {
    testParams("delete", "Test delete group bad id", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/deleteGroup/" + v,
        {}, 400, "参数不合要求")
})
// 分组不存在
testParams("delete", "Test delete group not exist", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, undefined],
    "/groups/deleteGroup/1", {}, 404, "不存在的分组")

/**
 *  修改分组信息接口
 */
// 正常修改
testOK("patch", "Tets update group", [getRedisClientAsyncStub, findGroupByIdStub, updateGroupStub], [loginWithAdmin, { description: "xxx" },
    { description: "yyy" }], "/groups/updateGroup", { id: "1", description: "yyy" }, 200, { description: "yyy" })
// 没有权限
testParams("patch", "Test updateGroup no perm", [getRedisClientAsyncStub], [JSON.stringify(loginInfo)], "/groups/updateGroup",
    { id: "1", description: "yyy" }, 401, "没有权限")
// 参数
errorPageCount.forEach(v => {
    testParams("patch", "Test update group error id", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/updateGroup",
        { id: v, description: "yyy" }, 400, "id有误")
})
badPageCount.forEach(v => {
    testParams("patch", "Test update group bad id", [getRedisClientAsyncStub], [loginWithAdmin], "/groups/updateGroup",
        { id: v, description: "yyy" }, 400, "参数不合要求")
})
// 分组不存在
testParams("patch", "Test update group not exist", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, undefined],
    "/groups/updateGroup", { id: "1", description: "yyy" }, 404, "不存在的分组")
// 没有任何修改
testParams("patch", "Test update group not exist", [getRedisClientAsyncStub, findGroupByIdStub], [loginWithAdmin, { description: "xxx" }],
    "/groups/updateGroup", { id: "1", description: "xxx" }, 400, "没有任何修改")

/**
 *  获取所有设备的数量接口
 */
// 正常获取
testOK("get", "Test devices amount", [clientGetCount, serverGetCount], [[], []], "/groups/showAllClient", {}, 200, [])
