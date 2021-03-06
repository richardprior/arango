/* 
 * Copyright (c) 2012-2013 Kaerus (kaerus.com), Anders Elo <anders @ kaerus com>.
 */

var BROWSER = (typeof window === 'object');
var utils = require('./utils');
var urlParser = require('urlparser');
var freeze = typeof Object.freeze === 'function' ? Object.freeze : function(o){return o};

function closure(db) {    
    "use strict";

    var xhr;

    /* Bring in Xhr support for nodejs or browser */
    if(!BROWSER) {

        xhr = function(method,path,options,data,resolver) {
            "use strict";

            var url = urlParser.parse(path);
            var proto = (url.host && url.host.protocol) || options.protocol;
            var req = require(proto).request;

            delete options.protocol;

            if(options.timeout) {
                request.socket.setTimeout(options.timeout);
                delete options.timeout;
            }

            options.method = method;

            if(url.host){
                if(url.host.hostname) options.hostname = url.host.hostname;
                /* todo: add authentication headers if defined in url */ 

                url.host = null;
            } 

            options.path = url.toString();

            if(!options.headers) options.headers = {};

            options.headers["content-length"] = data ? Buffer.byteLength(data) : 0;
            
            req(options,function(res) {
                var buf='';

                res.on('data',function(rdata){
                    buf+=rdata;
                }).on('end',function(){
                    try {  
                        buf = JSON.parse(buf);
                    } catch(e) { }

                    if(res.statusCode < 400) {
                        resolver.resolve(buf);
                    } else {
                        resolver.reject(buf);
                    }
                }).on('error',function(error){
                    resolver.reject(error);
                });
            }).on('error',function(error) { 
                resolver.reject(error)
            }).end(data,options.encoding);
        }
    } else {
        xhr = function(method,path,options,data,resolver){
            var ajax = require('ajax'), buf;
            ajax(method,path,options,data).when(function(res){
                /* todo: refactor out */
                buf = res.responseText;
                try {  
                    buf = JSON.parse(res.responseText);
                } catch(e) { }

                if(res.status < 400) {
                    resolver.resolve(buf);
                } else {
                    resolver.reject(buf);
                }
            },function(error){
                resolver.reject(error);
            });
        }
    }

    function request(method,path,data,options,callback) {
        var res;

        if(typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        options = options ? options : {};

        options = utils.extend(true,{},db._server,options);       

        if(data) {
            try {
                data = JSON.stringify(data);
            } catch(err) {
                throw "failed to json stringify data";
            }
        }    

        if(db._name) {
            path = '/_db/' + db._name + path;
        }

        res = new db.Promise(function(resolve,reject,progress,timeout){
            var resolver = freeze({
                resolve:resolve,
                reject:reject,
                progress:progress,
                timeout:timeout
            });

            xhr(method,path,options,data,resolver);
        });

        if(typeof callback === 'function') {
            res.then(function(value){
                callback(undefined,value);    
            },function(reason){
                callback(1,reason);    
            });         
        }

        return res;    
    }

    return request;
}

module.exports = closure;        
