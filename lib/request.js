/* 
 * Copyright (c) 2012-2013 Kaerus (kaerus.com), Anders Elo <anders @ kaerus com>.
 */

function closure(db) {    
    "use strict"

    var ajax = require('ajax'),
        parse = require('url'),
        utils = require('./utils');

    function request(method,path,data,options,callback) { 

        if(typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        options = options ? options : {};

        if(db.server.headers) {
            if(!options.headers) options.headers = {};
            /* todo: don't overwrite existing headers in options */
            utils.extend(options.headers,db.server.headers);
        }        
            
        var url = parse(path);

        if(url.host && !url.host.name) 
            utils.extend(url.host,db.server);

        if(data) {
            try {
                data = JSON.stringify(data);
            } catch(err) {
                throw "failed to json stringify data";
            }
        }    

        var res = ajax(method,url.toString(),options,data); 

        if(callback) {
            res.then(function(response) {
                return callback(0,response,this.attached);
            },function(error) {
                return callback(-1,error,this.attached);
            });
        }

        return res;    
    }

    var Methods = {
        "get": function(path,options,callback){
            return request('GET',path,null,options,callback);
        },
        "post": function(path,data,options,callback){
            return request('POST',path,data,options,callback);
        },
        "put": function(path,data,options,callback){
            return request('PUT',path,data,options,callback);
        },
        "delete": function(path,options,callback){
            return request('DELETE',path,null,options,callback);
        },
        "head": function(path,options,callback){
            return request('HEAD',path,null,options,callback);
        },
        "patch": function(path,data,options,callback){
            return request('PATCH',path,data,options,callback);
        },
        "options": function(path,options,callback){
            return request("OPTIONS",path,null,options,callback);
        }
    };

    return Methods;
}

module.exports = closure;        