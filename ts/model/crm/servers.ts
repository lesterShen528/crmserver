import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "./modelbase"

const [schema, table] = ["center", "servers"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Servers.getInstance(sequelize)
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        devid: DataTypes.CHAR(64),
        mac: DataTypes.CHAR(32),
        ip: DataTypes.CHAR(32),
        host: DataTypes.CHAR(32),
        ports: DataTypes.JSONB,
        type: DataTypes.CHAR(32),
        subtype: DataTypes.CHAR(32),
        version: DataTypes.CHAR(32),
        description: DataTypes.TEXT,
        state: DataTypes.ENUM('new', 'used', 'off'),
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

export class Servers extends ModelBase {
    private static instance: Servers
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Servers.instance)
            Servers.instance = new Servers(seqz, modelName)
        return Servers.instance
    }

    // 分页显示服务器信息
    public async showServersByPages(cursor: number, limit: number, search: string) {
        let res = await this.seqz.query(
            `SELECT
                c.ID,
                c.DEVID,
                c.MAC,
                c.IP,
                c.HOST,
                c.PORTS,
                c.TYPE,
                c.SUBTYPE,
                c.VERSION,
                c.STATE,
                c.DESCRIPTION,
                c.API,
                c.EXT,
                g.DESCRIPTION des,
                s.STATE status
            FROM CENTER.SERVERS c
            LEFT JOIN CENTER.GROUPS g ON c.ID = g.SERVERID
            LEFT JOIN CENTER.STATUS s ON c.DEVID = s.CLIENTID
            WHERE c.description like '%${search}%'
            ORDER BY c.created DESC
            OFFSET ${cursor}
            LIMIT ${limit}`, { type: "SELECT" })
        return res
    }

    // 状态控制显示
    public async showServersByState(cursor: number, limit: number, state: string, search: string) {
        let res = await this.model().findAll(
            {
                where: { state: state, description: { $like: '%' + search + '%' } },
                order: [['created', "DESC"]],
                offset: cursor,
                limit: limit
            })
        return res.map(r => r.get())
    }

    // 通过id查找服务器
    public async findServerById(id: number) {
        let res = await this.model().findOne({ where: { id: id } })
        return res ? res.get() : []
    }

    // 修改服务器状态
    public async updateServerState(id: number, state: string, t: any) {
        let res = await this.model().update({ state: state }, { where: { id: id }, transaction: t })
        return res
    }

    // 获取每个服务器设备类型的数量
    public async getCount() {
        let res = await this.seqz.query(`
                            SELECT
                                SUBTYPE,COUNT(*)
                            FROM CENTER.SERVERS
                                WHERE
                            STATE NOT IN ('OFF')
                            GROUP BY SUBTYPE`, { type: "SELECT" })
        return res
    }

    // 获取服务器的总数
    public async getTotalServers(search: string) {
        let res = await this.seqz.query(`
                            SELECT
                                COUNT(*)
                            FROM CENTER.SERVERS
                            WHERE DESCRIPTION like '%${search}%'
                             `, { type: "SELECT" })
        return res[0].count
    }

    // 根据状态获取服务器的数量
    public async getAmount(state: string, search: string) {
        let res = await this.seqz.query(`
                                SELECT
                                    COUNT(*)
                                FROM
                                    CENTER.servers
                                WHERE
                                    state='${state}'
                                AND
                                    description like '%${search}%'
                                `, { type: "SELECT" })
        return res[0].count
    }
}