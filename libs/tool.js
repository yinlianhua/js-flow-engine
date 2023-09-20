/**
 * Date : 2023-09-12
 * By   : yinlianhua@sina.cn
 **/

'use strict';

const test1 = async () => {
};

const test2 = async () => {
};

const http = async () => {
};

const sleep = async (time) => {
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

module.exports = {
    test1,
    test2,
    http,
    sleep,
}
