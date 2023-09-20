/**
 * Date : 2023-09-12
 * By   : yinlianhua@sina.cn
 **/

'use strict';

const moment = require("moment");

class FSM {
    constructor(config={}, trans=[], lifecycle={}, tool={}) {
        this.lc     = {}; // 挂载生命方法
        this.action = {}; // 挂载事件方法
        this.tool   = {}; // 挂载工具方法
        this.ctx    = {}; // 挂载上下文
        this.params = {
            config,
            trans,
            lifecycle,
            tool,
        }
    }

    // 初始化
    async __init(data) {
        let res = {
            "err" : false,
            "res" : "success",
        }

        // 参数检查
        let cfg_check = this.__config_check(this.params.config, this.params.trans);

        if (cfg_check.err) {
            res.err = true;
            res.res = cfg_check.res;

            return res;
        }

        // 初始化配置
        this.__init_config(this.params.config);

        // 检查是否已废弃
        if (this.__deprecate_check()) {
            res.err = true;
            res.res = "流程已废弃!";

            return res;
        }

        // 检查是否已归档
        if (this.__finish_check()) {
            res.err = true;
            res.res = "流程已归档!";

            return res;
        }

        // 检查是否冻结
        if (this.__freeze_check()) {
            res.err = true;
            res.res = "流程已冻结!";

            return res;
        }

        // 初始化生命周期函数
        this.__init_lifecycle(this.params.lifecycle);

        // 初始化附加函数
        this.__init_tool(this.params.tool);

        // 初始化转换函数
        this.__init_transition(this.params.trans);

        // 删除临时变量
        delete this.params;

        if (this.ctx.current == "") {
            let init_res = await this.action.init(data);

            if (init_res.err) {
                res.err = true;
                res.res = init_res.res;
            }
        }

        return res;
    }

    // action 模板函数
    async __action(...argc) {
        let res = {
            "err" : false,
            "res" : "success",
        }

        // 检查流程是否归档
        if (this.__finish_check()) {
            res.err = true;
            res.res = "流程已归档!";

            return res;
        };

        let trans = argc[0];
        let from  = this.__get_current();
        let to    = "";
        let data  = {};

        if (argc[1] != undefined) {
            if (typeof argc[1] == "string") {
                to = argc[1];
            }

            if (typeof argc[1] == "object") {
                data = argc[1];
            }
        }

        if (argc[2] != undefined) {
            if (typeof argc[2] == "object") {
                data = argc[2];
            }
        }

        // 查找下一个节点
        let next = this.__get_next(trans, from, to);

        if (next.err) {
            res.err = true;
            res.res = next.res;

            return res;
        }

        to = next.res;

        // 生命周期函数(可中断)
        for (let lc_name of this.ctx.life_rule.can_interrupt) {
            if (this.lc[lc_name] == undefined) {
                continue;
            }

            res.lc = lc_name;

            let lc_res = await this.lc[lc_name](trans, from, to, data);

            if (lc_res.err) {
                res.err = true;
                res.res = lc_res.res;
                res.ext = lc_res.ext || {};

                break;
            }
        }

        if (res.err) {
            return res;
        }

        // 修改状态 && 记录日志
        this.__set_current(trans, from, to);

        // 生命周期函数(不可中断)
        for (let lc_name of this.ctx.life_rule.not_interrupt) {
            if (this.lc[lc_name] == undefined) {
                continue;
            }

            await this.lc[lc_name](trans, from, to, data);
        }

        return res;
    }

    __init_config(config) {
        let life_rule = config.life_rule || {
            "can_interrupt" : [],
            "not_interrupt" : [],
        };

        this.ctx.operator   = config.operator || "system"; // 操作人
        this.ctx.entrance   = config.entrance;             // 入口节点
        this.ctx.archive    = config.archive;              // 归档节点
        this.ctx.current    = config.current || "";        // 当前节点
        this.ctx.next       = config.next || "";           // 下一个节点(最高优先级)
        this.ctx.data       = config.data || {};           // 表单数据
        this.ctx.logs       = config.logs || [];           // 操作日志
        this.ctx.life_rule  = life_rule;                   // 生命周期规则
        this.ctx.route      = {};                          // 路由规则
        this.ctx.finished   = false;                       // 是否归档
        this.ctx.freeze     = false;                       // 是否冻结
        this.ctx.deprecated = false;                       // 是否废弃
    }

    __init_lifecycle(lc) {
        for (let [name, fn] of Object.entries(lc)) {
            this.lc[name] = fn.bind(this);
        }
    }

    __init_tool(tool) {
        this.tool = {};

        for (let [name, fn] of Object.entries(tool)) {
            this.tool[name] = fn;
        }
    }

    __init_transition(trans) {
        // 每个 trans 有四个属性 name, desc, from, to, to 可以是函数
        for (let ts of trans) {
            if (this.ctx.route[ts.name] == undefined) {
                this.ctx.route[ts.name] = {};
            }

            this.ctx.route[ts.name][ts.from] = ts.to;

            // 添加事件方法
            if (this.action[ts.name] == undefined) {
                this.action[ts.name] = this.__action.bind(this, ts.name);
            }
        }
    }

    __config_check(config, trans) {
        let res = {
            "err" : false,
            "res" : "success!",
        }

        if (Object.keys(config).length == 0) {
            res.err = true;
            res.res = "配置不能为空!";
            return res;
        }

        if (trans.length == 0) {
            res.err = true;
            res.res = "转换操作不能为空!";
            return res;
        }

        if (config.entrance == undefined) {
            res.err = true;
            res.res = "入口节点不能为空!";
            return res;
        }

        if (config.archive == undefined) {
            res.err = true;
            res.res = "归档节点不能为空!";
            return res;
        }

        this.ctx.node_map = {}; // 节点映射

        for (let elem of trans) {
            for (let key of [ "name", "from", "to" ]) {
                if (elem[key] == undefined) {
                    res.err = true;
                    res.res = `转换规则缺少属性 ${key}`;
                }
            }

            if (res.err) {
                continue;
            }

            for (let key of [ "from", "to" ]) {
                if (typeof elem[key] == "string") {
                    this.ctx.node_map[elem[key]] = true;
                }
            }
        }

        if (res.err) {
            return res;
        }

        for (let key of [ "entrance", "archive", "current", "next" ]) {
            if (config[key] != undefined && config[key] != "" && this.ctx.node_map[config[key]] == undefined) {
                res.err = true;
                res.res = `${key} 节点 ${config[key]} 不存在!`;
            }
        }

        return res;
    }

    __deprecate_check() {
        return this.ctx.deprecated;
    }

    __finish_check() {
        if (this.ctx.current == this.ctx.archive) {
            this.ctx.finished = true;
        }

        return this.ctx.finished;
    }

    __freeze_check() {
        return this.ctx.freeze;
    }

    __get_current() {
        return this.ctx.current;
    }

    __set_current(trans, from, to) {
        if (this.ctx.next != "") {
            to = this.ctx.next;

            this.ctx.next = "";
        }

        this.ctx.current = to;

        this.__finish_check();
 
        // 记录日志
        this.__set_log(trans, from, to);
    }

    __get_next(trans, from, to) {
        let res = {
            "err" : false,
            "res" : "",
        }

        if (this.ctx.route[trans] == undefined) {
            res.err = true;
            res.res = `非法的转换操作[${trans}]!`;
            return res;
        }

        let routes = this.ctx.route[trans];

        // 精确匹配
        if (routes[from] != undefined) {
            if (typeof routes[from] == "function") {
                res.res = routes[from](to);
            } else {
                res.res = routes[from];
            }

            if (this.ctx.node_map[res.res] == undefined) {
                res.err = true;
                res.res = `[${trans} : ${from} -> ${res.res}]无匹配节点`;
            }

            return res;
        }

        // * 号匹配
        if (routes["*"] != undefined) {
            if (typeof routes["*"] == "function") {
                res.res = routes["*"](to);
            } else {
                res.res = routes["*"];
            }

            if (this.ctx.node_map[res.res] == undefined) {
                res.err = true;
                res.res = `[${trans} : * -> ${res.res}]无匹配节点`;
            }

            return res;
        }

        return {
            "err" : true,
            "res" : `[${trans} : ${from} -> ${to}]无匹配节点`,
        };
    }

    __set_next(state) {
        this.ctx.next = state;
    }

    __get_log() {
        return this.ctx.logs;
    }

    __set_log(trans, from, to) {
        this.ctx.logs.push({
            "date"     : moment().format("YYYY-MM-DD HH:mm:ss"),
            "operator" : this.ctx.operator,
            "trans"    : trans,
            "from"     : from,
            "to"       : to,
            "data"     : JSON.stringify(this.ctx.data),
        });
    }

    __get_data() {
        return this.ctx.data;
    }

    __get_config() {
        let cfg       = {};
        let omit_keys = {
            "data"      : 1,
            "logs"      : 1,
            "route"     : 1,
            "node_map"  : 1,
            "life_rule" : 1,
        }

        for (let [k, v] of Object.entries(this.ctx)) {
            if (omit_keys[k]) {
                continue;
            }

            cfg[k] = v;
        }

        return cfg;
    }

    __get_node() {
        let nodes = [];

        for (let [k, v] of Object.entries(this.ctx.node_map)) {
            if (k != "*") {
                nodes.push(k);
            }
        }

        return nodes;
    }

    __get_route() {
        return this.ctx.route;
    }
}

module.exports = FSM;
