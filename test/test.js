/**
* Date : 2023-05-06
* By   : yinlianhua@sina.cn
**/

'use strict';

// 节点流转规则
const trans = [
    { "name" : "reset",  "from" : "*", "to" : "user",    "desc" : "重置", },
    { "name" : "reject", "from" : "*", "to" : s => s,    "desc" : "驳回", },
    { "name" : "goto",   "from" : "*", "to" : s => s,    "desc" : "跳转", },
    { "name" : "finish", "from" : "*", "to" : "archive", "desc" : "归档", },

    // 执行
    { "name" : "next", "from" : "user", "to" : "dep",     "desc" : "个人提交", }, // 提交人审核
    { "name" : "next", "from" : "dep",  "to" : "bu",      "desc" : "部门审核", },  // 部门审核
    { "name" : "next", "from" : "bu",   "to" : "umc",     "desc" : "BU审核",  }, // BU 审核
    { "name" : "next", "from" : "umc",  "to" : "archive", "desc" : "UCM审核", }, // UMC 审核
]

const data = {
    "count" : 1000,
}

const logs = [];

const action = {
    "before" : {
        async next (trans, from, to, data) {
            if (to == "bu") {
                this.__set_next("archive");
            }

            return {
                "err" : false,
                "res" : "success",
                "ext" : {},
            }
        },
    },
    "after"  : {
        async next (trans, from, to, data) {
            return {
                "err" : false,
                "res" : "success",
                "ext" : {},
            }
        },
    }
}

const event = {
    "before" : {
        "leave" : {
            async user (trans, from, to, data) {
                return {
                    "err" : false,
                    "res" : "success",
                    "ext" : {},
                }
            },
        },
        "enter" : {
            async archive (trans, from, to, data) {
                return {
                    "err" : false,
                    "res" : "success",
                    "ext" : {},
                }
            },
        }
    },
    "after" : {
        "leave" : {
            async user (trans, from, to, data) {
                return {
                    "err" : false,
                    "res" : "success",
                    "ext" : {},
                }
            },
        },
        "enter" : {
            async archive (trans, from, to, data) {
                // await this.tool.sleep(2000);

                return {
                    "err" : false,
                    "res" : "success",
                    "ext" : {},
                }
            },
        }
    }
}

const common = {
    "before" : {
        async logs (trans, from, to, data) {
            // console.log(trans, from , to, JSON.stringify(data));

            return {
                "err" : false,
                "res" : "success",
                "ext" : {},
            }
        },
    },
    "after"  : {
        async sleep (trans, from, to, data) {
            await this.tool.sleep(2000);

            return {
                "err" : true,
                "res" : "success",
                "ext" : {},
            }
        },
    },
}

const flow = require("../flow");

;(async () => {
    // 初始化配置数据
    let f = new flow({
        "operator" : "ivan.yin",
        "entrance" : "user",
        "archive"  : "archive",
        "current"  : "",
        "next"     : "",
    }, trans, common, action, event, data, logs);

    let test = {"test" : 1};
    let res;

    res = await f.init(test);
    console.log(res, f.current());

    res = await f.action.next();
    console.log(res, f.current());

    res = await f.action.reset(test);
    console.log(res, f.current());

    res = await f.action.next();
    console.log(res, f.current());

    res = await f.action.reject("user", test);
    console.log(res, f.current());

    res = await f.action.next();
    console.log(res, f.current());

    res = await f.action.next();
    console.log(res, f.current());

    res = await f.action.next();
    console.log(res, f.current());

    res = await f.action.next();
    console.log(res, f.current());

    // 输出日志
    let flow_logs = f.log();

    flow_logs.map((log) => {
        console.log(JSON.stringify(log));
    });

    // 输出数据
    let flow_data = f.data();
    console.log(flow_data);

    // 输出配置
    let flow_cfg = f.config();
    console.log(flow_cfg);

    // 生成可视化
    let flow_visual = f.visualize();
    console.log(flow_visual);
})()
