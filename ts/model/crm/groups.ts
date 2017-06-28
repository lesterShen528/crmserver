import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "./modelbase"
import { Servers } from "./servers"
import { Clients } from "./clients"

const [schema, table] = ["center", "groups"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Groups.getInstance(sequelize)
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            autoIncrement: true,
        },
        serverid: DataTypes.INTEGER,
        description: DataTypes.TEXT,
        deleted: DataTypes.INTEGER,
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

export class Groups extends ModelBase {
    private static instance: Groups
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Groups.instance)
            Groups.instance = new Groups(seqz, modelName)
        return Groups.instance
    }

    // 分页列出分组的信息
    public async findGroupInfo(cursor: number, limit: number, search: string) {
        let res = await this.seqz.query(`
                            SELECT
                                g.id,
                                g.serverid,
                                g.description,
                                s.description des,
                                COALESCE(b.count,0) as total
                            from center.groups g
                            left join
                            ( select count(*), groupid from center.clients c group by c.groupid ) b
                            on
                                g.id=b.groupid
                            LEFT JOIN
                                center.servers s
                            on
                                g.serverid= s.id
                            WHERE
                                g.deleted=0 and g.description like '%${search}%'
                            ORDER BY g.created desc
                            offset ${cursor}
                            limit ${limit}
                            `, { type: "SELECT" })
        return res
    }

    // 获取分组的总数
    public async getTotalGroups(search: string) {
        let res = await this.seqz.query(`
                            SELECT
                                COUNT(*)
                            FROM CENTER.GROUPS
                                WHERE
                            DELETED = 0 and description like '%${search}%'
                             `, { type: "SELECT" })
        return res[0].count
    }

    // 通过serverid查询分组
    public async findGroupByServerid(serverid: number) {
        let res = await this.model().findOne({ where: { serverid: serverid } })
        return res ? res.get() : undefined
    }

    // 通过id查找一个分组
    public async findGroupById(id: number) {
        let res = await this.model().findOne({ where: { id: id, deleted: 0 } })
        return res ? res.get() : undefined
    }

    // 新增一个分组
    public async insertGroup(description: string, id: number) {
        return await this.seqz.transaction(async t => {
            await Servers.getInstance().updateServerState(id, "used", t)
            let res = await this.model().create({ serverid: id, description: description, deleted: 0 }, { transaction: t })
            return res ? res.get() : undefined
        })
    }

    // 通过id删除一个分组
    public async deleteGroup(id: number, serverid: number, client: any) {
        return await this.seqz.transaction(async t => {
            await this.model().update({ deleted: 1, serverid: 0 }, { where: { id: id, deleted: 0 }, transaction: t })
            //判断该分组下有没有服务器，有就修改，没有则不改
            if (serverid !== 0)
                await Servers.getInstance().updateServerState(serverid, "new", t)
            // 判断该分组下有没有客户端，有就修改，没有则不改
            if (!!client[0])
                await Clients.getInstance().setGroState(id, t)
        })
    }

    // 修改分组信息
    public async updateGroup(id: number, description: string) {
        let res = await this.model().update(
            { description: description },
            {
                where:
                { id: id, deleted: 0 }
            })
        return res ? res : undefined
    }
}