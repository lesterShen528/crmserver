
const username = {
    isLength: {
        errmsg: "用户名长度错误！必须4位或4位以上",
        param: [4, 128]
    }
}
const password = {
    isLength: {
        errmsg: "密码长度错误！必须4位或4位以上",
        param: [4, 128]
    }
}

const description = {
    isLength: {
        errmsg: "description有误",
        param: [0, 200]
    }
}

const state = {
    isIn: {
        errmsg: "state有误",
        param: [["on", "off"]]
    }
}

const page = {
    isInt: {
        errmsg: "page有误",
        param: [1, 4]
    }
}
const count = {
    isInt: {
        errmsg: "count有误",
        param: [1, 4]
    }
}

const phone = {
    isMobilePhone: {
        errmsg: "手机号格式错误！",
        param: ["zh-CN"]
    }
}

const address = {
    require: 0,
    isLength: {
        errmsg: "address错误",
        param: [1, 256]
    }
}

const email = {
    isEmail: {
        errmsg: "email有误",
        param: 1
    }
}

const realname = {
    isLength: {
        errmsg: "realname有误",
        param: [1, 64]
    }
}

const perm = {
    isIn: {
        errmsg: "perm值有误",
        param: [["root", "admin"]]
    }
}
const groupid = {
    isInt: {
        errmsg: "groupid有误",
        param: [1, 4]
    }
}
const search = {
    isLength: {
        errmsg: "search有误",
        param: [0, 50]
    }
}
const id = {
    isInt: {
        errmsg: "id有误",
        param: [1, 4]
    }
}

const status = {
    isIn: {
        errmsg: "state有误",
        param: [["new", "off", "used"]]
    }
}

export const crmusersValidator = {
    group: {
        groupid: groupid,
    },
    des: {
        description: description,
        id: id
    },
    crmUsersInfo: {
        username: username,
        description: description,
        state: state,
        phone: phone,
        email: email,
        realname: realname,
        address: address,
    },
    id: {
        id: id
    },
    username: {
        username: username
    },
    password: {
        password: password
    },
    login: {
        username: username,
        password: password
    },
    setState: {
        id: id,
        state: state
    },
    setPassword: {
        id: id,
        password: password,
    },
    create: {
        username: username,
        password: password,
        description: description,
        perm: perm,
        realname: realname,
        phone: phone,
        state: state,
        email: email,
        address: address
    },
    pageAndCount: {
        page: page,
        count: count,
        search: search
    },
    pageCountState: {
        page: page,
        count: count,
        state: status,
        search: search
    },
    updateCrmUser: {
        username: username,
        description: description,
        phone: phone,
        email: email,
        realname: {
            isLength: {
                errmsg: "realname有误",
                param: [1, 64]
            }
        },
        address: address
    }
}
const tid = {
    isInt: {
        errmsg: "arr数组错误",
        param: { min: 0, max: 9999999999 }
    }
}

const type = {
    isIn: {
        errmsg: "type有误",
        param: [["Client", "Server", "Group"]]
    }
}
export const groupsValidator = {
    type: {
        type: type
    },
    ckeckId: {
        s_id: id,
        id: id
    },
    groupid: {
        groupid: id,
    },
    tid: {
        tid: tid,
    },
    id: {
        id: id
    },
    check: {
        groupid: id,
        id: id,
    },
    updateGroup: {
        id: id,
        description: description
    }
}
