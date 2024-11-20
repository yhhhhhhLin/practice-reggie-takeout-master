/*
 * Copyright © 2023 Enaium <enaium@outlook.com>
 *
 * This work is free. You can redistribute it and/or modify it under the
 * terms of the Do What The Fuck You Want To Public License, Version 2,
 * as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
 */

import axios from "axios";

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
// 创建axios实例
const service = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: 'http://localhost:8080/admin',
    // 超时
    timeout: 1000000
})
// request拦截器
service.interceptors.request.use(config => {
    // 是否需要设置 token
    // const isToken = (config.headers || {}).isToken === false
    // if (getToken() && !isToken) {
    //   config.headers['Authorization'] = 'Bearer ' + getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
    // }
    // get请求映射params参数

    if (localStorage.getItem("token")) {
        config.headers.token = localStorage.getItem("token")
    }


    if (config.method === 'get' && config.params) {
        let url = config.url + '?';
        for (const propName of Object.keys(config.params)) {
            const value = config.params[propName];
            let part = encodeURIComponent(propName) + "=";
            if (value !== null && typeof (value) !== "undefined") {
                if (typeof value === 'object') {
                    for (const key of Object.keys(value)) {
                        let params = propName + '[' + key + ']';
                        let subPart = encodeURIComponent(params) + "=";
                        url += subPart + encodeURIComponent(value[key]) + "&";
                    }
                } else {
                    url += part + encodeURIComponent(value) + "&";
                }
            }
        }
        url = url.slice(0, -1);
        config.params = {};
        config.url = url;
    }
    return config
}, error => {
    console.log(error)
    Promise.reject(error).then(ignored => ignored)
})

// 响应拦截器
service.interceptors.response.use(res => {
        console.log('---响应拦截器---', res)
        // 未设置状态码则默认成功状态
        const code = res.data.code;
        // 获取错误信息
        const msg = res.data.msg
        console.log('---code---', code)
        if (res.data.code === 0 && res.data.msg === 'NOTLOGIN') {// 返回登录页面
            console.log('---/backend/login---', code)
            localStorage.removeItem('userInfo')
            $router.push({path: "/backend/login"}).then(ignored => ignored)
        } else {
            return res.data
        }
    },
    error => {
        console.log('err' + error)
        let {message} = error;
        if (message == "Network Error") {
            message = "后端接口连接异常";
        } else if (message.includes("timeout")) {
            message = "系统接口请求超时";
        } else if (message.includes("Request failed with status code")) {
            message = "系统接口" + message.substr(message.length - 3) + "异常";
        }

        $message({
            message: message,
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(error)
    }
)

export default service