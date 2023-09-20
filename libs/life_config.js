/**
 * Date : 2023-09-12
 * By   : yinlianhua@sina.cn
 **/

'use strict';

const life_config = (common, action, event) => {
    for (let key of ["before", "after"]) {
        if (common[key] == undefined) {
            common[key] = {};
        }

        if (action[key] == undefined) {
            action[key] = {};
        }

        if (event[key] == undefined) {
            event[key] = {};
        }

        for (let sub_key of ["leave", "enter"]) {
            if (event[key][sub_key] == undefined) {
                event[key][sub_key] = {};
            }
        }
    }

    let life_rule = {
        "can_interrupt" : [
            "on_before_common",
            "on_before_transition",
            "on_before_leave",
            "on_before_enter",
        ],
        "not_interrupt" : [
            "on_after_common",
            "on_after_transition",
            "on_after_leave",
            "on_after_enter",
        ],
    }

    let lifecycle = {
        async on_before_common (trans, from, to, data) {
            let type = "before";
            let sub  = "common";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(common[type])) {
                if (typeof fn != "function") {
                    continue;
                }

                res = await fn.bind(this, trans, from, to, data)();

                if (res.err == undefined) {
                    res.err = true;
                    res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                }

                if (res.err) {
                    break;
                }
            }
    
            return res;
        },

        async on_after_common (trans, from, to, data) {
            let type = "after";
            let sub  = "common";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(common[type])) {
                if (typeof fn != "function") {
                    continue;
                }

                res = await fn.bind(this, trans, from, to, data)();

                if (res.err == undefined) {
                    res.err = true;
                    res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                }

                if (res.err) {
                    break;
                }
            }
    
            return res;
        },

        async on_before_transition (trans, from, to, data) {
            let type = "before";
            let sub  = "transition";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(action[type])) {
                if (name != trans) {
                    continue;
                }

                if (typeof fn == "function") {
                    res = await fn.bind(this, trans, from, to, data)();

                    if (res.err == undefined) {
                        res.err = true;
                        res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                    }
                }

                break;
            }
    
            return res;
        },

        async on_after_transition (trans, from, to, data) {
            let type = "after";
            let sub  = "transition";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(action[type])) {
                if (name != trans) {
                    continue;
                }

                if (typeof fn == "function") {
                    res = await fn.bind(this, trans, from, to, data)();

                    if (res.err == undefined) {
                        res.err = true;
                        res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                    }
                }

                break;
            }
    
            return res;
        },

        async on_before_leave (trans, from, to, data) {
            let type = "before";
            let sub  = "leave";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(event[type][sub])) {
                if (name != from) {
                    continue;
                }

                if (typeof fn == "function") {
                    res = await fn.bind(this, trans, from, to, data)();

                    if (res.err == undefined) {
                        res.err = true;
                        res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                    }
                }

                break;
            }
    
            return res;
        },

        async on_after_leave (trans, from, to, data) {
            let type = "after";
            let sub  = "leave";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(event[type][sub])) {
                if (name != from) {
                    continue;
                }

                if (typeof fn == "function") {
                    res = await fn.bind(this, trans, from, to, data)();

                    if (res.err == undefined) {
                        res.err = true;
                        res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                    }
                }

                break;
            }
    
            return res;
        },

        async on_before_enter (trans, from, to, data) {
            let type = "before";
            let sub  = "enter";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(event[type][sub])) {
                if (name != to) {
                    continue;
                }

                if (typeof fn == "function") {
                    res = await fn.bind(this, trans, from, to, data)();

                    if (res.err == undefined) {
                        res.err = true;
                        res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                    }
                }

                break;
            }

            return res;
        },

        async on_after_enter (trans, from, to, data) {
            let type = "after";
            let sub  = "enter";
            let res  = {
                "err" : false,
                "res" : "success",
            }

            for (let [name, fn] of Object.entries(event[type][sub])) {
                if (name != to) {
                    continue;
                }

                if (typeof fn == "function") {
                    res = await fn.bind(this, trans, from, to, data)();

                    if (res.err == undefined) {
                        res.err = true;
                        res.res = `[lifecycle ${type} ${sub}] fn ${name} exec error !`;
                    }
                }

                break;
            }

            return res;
        },
    }

    return {
        life_rule,
        lifecycle,
    };
};

module.exports = life_config;
