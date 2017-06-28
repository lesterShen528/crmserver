import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "./modelbase"

const [schema, table] = ["center", "clients"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    Clients.getInstance(sequelize)
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        devid: DataTypes.CHAR(64),
        mac: DataTypes.CHAR(32),
        ip: DataTypes.CHAR(32),
        type: DataTypes.CHAR(32),
        subtype: DataTypes.CHAR(36),
        version: DataTypes.CHAR(32),
        description: DataTypes.TEXT,
        state: DataTypes.ENUM('new', 'used', 'off'),
        groupid: DataTypes.INTEGER,
        api: DataTypes.JSONB,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export class Clients extends ModelBase {
    private static instance: Clients
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Clients.instance)
            Clients.instance = new Clients(seqz, modelName)
        return Clients.instance
    }

    // 给客户端分组
    public async updateGroupid(id: number, groupid: number) {
        let [number, res] = await this.model().update(
            {
                groupid: groupid, state: "used"
            },
            {
                where: { id: id }, returning: true
            })
        return number > 0 ? res[0].get() : undefined
    }

    // 给客户端批量分组
    public async batchGrouping(arr: number[], groupid: number) {
        let res = await this.model().update(
            {
                groupid: groupid, state: "used"
            },
            { where: { id: { $in: arr } }, returning: true }
        )
        return res[1] as any[]
    }

    // 一个分组下有哪些客户端
    public async getDevicesByGroupid(groupid: number) {
        let res = await this.model().findAll({ where: { groupid: groupid } })
        return res.map(r => r.get())
    }

    // 分页显示客户端信息
    public async showClientsByPages(cursor: number, limit: number, search: string) {
        let res = await this.seqz.query(
            `SELECT
                c.ID,
                c.DEVID,
                c.mac,
                c.IP,
                c.TYPE,
                c.SUBTYPE,
                c.VERSION,
                c.MAC,
                c.DESCRIPTION,
                c.STATE,
                c.GROUPID,
                c.API,
                c.EXT,
                g.SERVERID,
                g.DESCRIPTION des,
                s.STATE status
                FROM CENTER.CLIENTS c
            LEFT JOIN CENTER.GROUPS g ON c.GROUPID = g.ID
            LEFT JOIN CENTER.STATUS s ON c.DEVID = s.CLIENTID
            WHERE c.description like '%${search}%'
            ORDER BY c.created DESC
            OFFSET ${cursor}
            LIMIT ${limit}`, { type: "SELECT" })
        return res
    }

    // 状态控制显示客户端
    public async showClientsByState(cursor: number, limit: number, state: string, search: string) {
        let res = await this.model().findAll(
            {
                where: { state: state, description: { $like: '%' + search + '%' } },
                order: [['created', "DESC"]],
                offset: cursor,
                limit: limit
            })
        return res.map(r => r.get())
    }

    // 通过id查找客户端
    public async findClientById(id: number) {
        let res = await this.model().findOne({ where: { id: id } })
        return res ? res.get() : undefined
    }

    // 获取每个设备类型的数量
    public async getCount() {
        let res = await this.seqz.query(`
                                SELECT
                                    SUBTYPE,COUNT(*)
                                FROM
                                    CENTER.CLIENTS
                                WHERE
                                    STATE NOT IN ('OFF')
                                GROUP BY SUBTYPE`, { type: "SELECT" })
        return res
    }

    // 获取客户端的数量
    public async getTotalClients(search: string) {
        let res = await this.seqz.query(`
                                SELECT
                                    COUNT(*)
                                FROM
                                    CENTER.CLIENTS
                                WHERE
                                    DESCRIPTION like '%${search}%'
                                `, { type: "SELECT" })
        return res[0].count
    }

    // 获取未分组客户端数量
    public async getAmount(search: string) {
        let res = await this.seqz.query(`
                                SELECT
                                    COUNT(*)
                                FROM
                                    CENTER.CLIENTS
                                WHERE
                                    state='new'
                                AND
                                    groupid is null
                                AND
                                    description like '%${search}%'
                                `, { type: "SELECT" })
        return res[0].count
    }

    // 获取已分组客户端数量
    public async getCountHasGroup(search: string) {
        let res = await this.seqz.query(`
                                SELECT
                                    COUNT(*)
                                FROM
                                    CENTER.CLIENTS
                                WHERE
                                    state='used'
                                AND
                                    groupid is not null
                                AND
                                    description like '%${search}%'
                                `, { type: "SELECT" })
        return res[0].count
    }

    // 获取禁用客户端的数量
    public async getOffCount(search: string) {
        let res = await this.seqz.query(`
                                SELECT
                                    COUNT(*)
                                FROM
                                    CENTER.CLIENTS
                                WHERE
                                    state='off'
                                AND
                                    description like '%${search}%'
                                `, { type: "SELECT" })
        return res[0].count
    }

    // 解绑一个客户端
    public async removeOneBind(id: number) {
        let res = await this.model().update({ state: "new", groupid: null }, { where: { id: id } })
        return res as any[]
    }

    // 解除多个客户端的绑定
    public async removeManyBinds(arr: number[]) {
        let res = await this.model().update(
            {
                groupid: null, state: "new"
            },
            {
                where: { id: { $in: arr } }, returning: true
            })
        return res[0]
    }

    // 删除分组时把分组下的客户端移到未知分组
    public async setGroState(groupid: number, t: any) {
        await this.model().update({ state: "new", groupid: null }, { where: { groupid: groupid }, transaction: t })
    }
}
