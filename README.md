# js-flow-engine
js-workflow-engine

```js
// 基本配置
config : {
    operator   // 操作人(默认为system)
    entrance   // 入口节点(必选)
    archive    // 归档节点(必选)
    current    // 当前节点(默认为空)
    next       // 下一个节点(默认为空)
    finished   // 是否归档(默认false)
    freeze     // 是否冻结(默认false)
    deprecated // 是否废弃(默认false)
}

// 表单数据
data : object

// 流程日志
logs : array|object

// 节点流转规则
const trans = [
    { "name" : "reset",  "from" : "*", "to" : step_start, "desc" : "重置", },
    { "name" : "reject", "from" : "*", "to" : s => s,     "desc" : "驳回", },
    { "name" : "goto",   "from" : "*", "to" : s => s,     "desc" : "跳转", },
    { "name" : "finish", "from" : "*", "to" : step_end,   "desc" : "归档", },

    // 执行
    { "name" : "next", "from" : step_start, "to" : step_dep, "desc" : "个人提交", },
    { "name" : "next", "from" : step_dep,   "to" : step_bu,  "desc" : "部门审核", },
    { "name" : "next", "from" : step_bu,    "to" : step_umc, "desc" : "BU审核",  },
    { "name" : "next", "from" : step_umc,   "to" : step_end, "desc" : "UCM审核", },
]

// 附加方法
tool {
    async [tool1] function
    async [tool2] function
    async [tool3] function
    ...
}

// 通用处理全部的行为都会触发
// 返回结果需要三个参数 err, res, ext, 其中 before 返回结果 err = true 可以中断流程执行
common {
    before {
        async [com1] function
        async [com2] function
        async [com3] function
        ...
    }
    after {
        async [com1] function
        async [com2] function
        async [com3] function
        ...
    }
}

// 行为处理[init, reset, reject, goto, finish, archive, next...]
// 返回结果需要三个参数 err, res, ext, 其中 before 返回结果 err = true 可以中断流程执行
action {
    before {
        async [act1] function
        async [act2] function
        async [act3] function
        ...
    },
    after {
        async [act1] function
        async [act2] function
        async [act3] function
        ...
    }
}

// 事件处理[全部的 from, to 名称]
// 返回结果需要三个参数 err, res, ext, 其中 before 返回结果 err = true 可以中断流程执行
event {
    before {
        leave {
            async [event1] function
            async [event2] function
            async [event3] function
            ...
        },
        enter {
            async [event1] function
            async [event2] function
            async [event3] function
            ...
        }
    },
    after {
        leave {
            async [event1] function
            async [event2] function
            async [event3] function
            ...
        },
        enter {
            async [event1] function
            async [event2] function
            async [event3] function
            ...
        }
    }
}
```
