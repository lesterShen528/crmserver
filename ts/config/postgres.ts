export const pgOpt = {
    database: "postgres",
    username: "postgres",
    password: "123456",
    options: {
        dialect: "postgres",
        host: "119.23.19.46",
        port: 5432,
        timezone: "+8:00",
        pool: {
            maxConnections: 5,
            minConnections: 0,
            maxIdleTime: 100000
        }
    }
}
