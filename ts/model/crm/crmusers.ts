import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "./modelbase"

const [schema, table] = ["center", "crmuser"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Crmusers.getInstance(sequelize)
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            autoIncrement: true,
        },
        username: DataTypes.CHAR(128),
        password: DataTypes.CHAR(128),
        description: DataTypes.TEXT,
        state: DataTypes.CHAR(24),
        role: DataTypes.CHAR(24),
        perm: DataTypes.CHAR(24),
        phone: DataTypes.CHAR(24),
        email: DataTypes.CHAR(64),
        realname: DataTypes.CHAR(64),
        address: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        deleted: DataTypes.INTEGER,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export class Crmusers extends ModelBase {
    private static instance: Crmusers
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Crmusers.instance)
            Crmusers.instance = new Crmusers(seqz, modelName)
        return Crmusers.instance
    }

    // 添加一个用户
    public async insertUsers(obj: any) {
        let res = await this.model().create(obj)
        return res ? res.get() : undefined
    }

    // 通过用户名找用户信息(除了删除)
    public async findByUsername(username: string) {
        let res = await this.model().findOne({ where: { username: username, deleted: 0 } })
        return res ? res.get() : undefined
    }

    // 通过用户名找用户信息(包括删除)
    public async findByUsernameNotDel(username: string) {
        let res = await this.model().findOne({ where: { username: username } })
        return res ? res.get() : undefined
    }

    // 分页显示用户除密码外的所有信息
    public async findUserInfo(cursor: number, limit: number, search: string) {
        let res = await this.model().findAll(
            {
                attributes: { exclude: ['password', 'ext', 'deleted'] },
                where: { deleted: 0, username: { $like: '%' + search + '%' } },
                order: [['created', "DESC"]],
                offset: cursor, limit: limit
            })
        return res.map(r => r.get())
    }

    // 获取用户总数
    public async getUserTotal(search: string) {
        let res = await this.seqz.query(`
                        SELECT
                            COUNT(*)
                        FROM
                            CENTER.CRMUSER
                        WHERE
                            DELETED = 0 AND USERNAME LIKE '%${search}%'
                        `, { type: "SELECT" })
        return res[0].count
    }

    // 通过主键查找用户
    public async findByPrimary(id: number) {
        let res = await this.model().findOne({ where: { id: id, deleted: 0 } })
        return res ? res.get() : undefined
    }

    // 修改用户信息
    public async updateCrmuser(crmuser: any, id: number) {
        let [number, res] = await this.model().update(crmuser, { where: { id: id }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    // 禁用和启用
    public async resetState(userid: number, state: string) {
        let [number, res] = await this.model().update({ state: state }, { where: { id: userid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    // 重置密码
    public async resetPassword(userid: number, password: string) {
        let [number, res] = await this.model().update({ password: password }, { where: { id: userid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    // 删除一个用户,伪删除
    public async deleteUser(userid: number) {
        let [number, res] = await this.model().update({ deleted: 1 }, { where: { id: userid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }
}