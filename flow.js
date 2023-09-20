/**
 * Date : 2023-09-12
 * By   : yinlianhua@sina.cn
 **/

'use strict';

const _      = require("underscore");
const moment = require("moment");
const FSM    = require("./core/fsm");
const tool   = require("./libs/tool");
const lc     = require("./libs/life_config");
const visual = require("./libs/visualize");

class Flow extends FSM {
    constructor(config={}, trans=[], common={}, action={}, event={}, data={}, logs=[]) {
        // trans 添加起止规则
        trans.push({ "desc" : "初始", "name" : "init",    "from" : "*", "to" : config.entrance });
        trans.push({ "desc" : "归档", "name" : "archive", "from" : "*", "to" : config.archive  });

        let life_config = lc(common, action, event);

        config.data      = data;
        config.logs      = logs;
        config.life_rule = life_config.life_rule;

        super(config, trans, life_config.lifecycle, tool);
    }

    // 初始化
    async init(data={}) {
        return await this.__init(data);
    }

    // 获取当前状态
    current() {
        return this.__get_current();
    }

    // 获取操作日志
    log() {
        return this.__get_log();
    }

    // 获取数据
    data () {
        return this.__get_data();
    }

    // 获取配置
    config () {
        return this.__get_config();
    }

    // 可视化
    visualize (type="horizontal") {
        // 创建数据
        let visual_data = {
            "rankdir"     : type != "horizontal" ? "LR" : "TB",
            "states"      : this.__get_node(),
            "transitions" : [],
        };

        let routes = this.__get_route();

        for (let [act, obj] of Object.entries(routes)) {
            // 过滤掉 init 行为
            if (act == "init") {
                continue;
            }

            for (let [from, to] of Object.entries(obj)) {
                if (typeof from != "string" || typeof to != "string" || to == "*") {
                    continue;
                }

                if (from != "*") {
                    visual_data.transitions.push({
                        "from"  : from,
                        "to"    : to,
                        "label" : ` ${act} `,
                    });

                    continue;
                }

                // 遍历所有
                for (let state of visual_data.states) {
                    if (state == to) {
                        continue;
                    }

                    visual_data.transitions.push({
                        "from"  : state,
                        "to"    : to,
                        "label" : ` ${act} `,
                    });
                }
            }
        }

        return visual(visual_data);
    }
}

module.exports = Flow;
