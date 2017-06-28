import * as logger from "winston"
import Router = require('koa-router')
import { getLoginAsync } from "./../redis/logindao"
import { sendErrMsg } from "./response"
function handleError(ctx: any, e: any) {
    if (e.code)
        ctx.status = e.code
    ctx.body = { error: e.message }
    logger.error("%s", e.stack.substring(0, 300))
}

async function checkLogin(ctx: Router.IRouterContext, next: () => Promise<any>) {
    let id = ctx.cookies.get("id")
    let token = ctx.cookies.get("token")
    if (!token && !id) {
        token = (ctx as any).headers.token
        id = (ctx as any).headers.id
    }
    try {
        // TODO login
        let [info, errMsg] = await getLoginAsync(id, token)
        if (info) {
            (ctx as any).request.loginInfo = info
            return next()
        }
        return sendErrMsg(ctx, errMsg, 400)
    } catch (e) {
        handleError(ctx, e)
    }
}

export class RouterWrap {
    private router: Router
    constructor(opt?: any) {
        this.router = new Router(opt)
    }

    private register(method: string, userMiddleware: any, ...args: any[]) {
        let wrap = async (ctx: any, next: any) => {
            try {
                await userMiddleware(ctx, next)
            } catch (e) {
                handleError(ctx, e)
            }
        }
        switch (method) {
            case "get": (this.router.get as any)(...args, wrap); break
            case "post": (this.router.post as any)(...args, wrap); break
            case "put": (this.router.put as any)(...args, wrap); break
            case "patch": (this.router.patch as any)(...args, wrap); break
            case "delete": (this.router.delete as any)(...args, wrap); break
        }
    }

    public loginHandle(method: string, path: any, f: Router.IMiddleware) {
        this.register(method, f, path, checkLogin)
    }

    public handle(method: string, path: any, f: Router.IMiddleware) {
        this.register(method, f, path)
    }

    public routes() {
        return this.router.routes()
    }
}

