var fs = require('fs');
var qs = require('querystring');
var http = require('http');
var https = require('https');
var _ = require('lodash');
var ur = require('url');
var num = 0;
var destHdrName = 'x-iguana-destination-url';
var respHdrName = 'x-iguana-response-url';


function makeRequest(cfg, handler) {
	if (cfg.protocol == "https" || cfg.protocol == "https:") {
		cfg.port = _.isEmpty(cfg.port) ? 443 : cfg.port;
		return https.request(cfg, handler);
	} else {
		cfg.port = _.isEmpty(cfg.port) ? 80 : cfg.port;
		return http.request(cfg, handler);
	}
}

///forward received server response
///in a http request to the listener url
function forwardResponse(url, data) {
	console.log('sending POST to ' + respUrl + ' for rq id=' + data.id);
	var u3 = ur.parse(respUrl);
	var r3cfg = {
		host: u3.hostname,
		agent: false,
		port: _.isEmpty(u3.port) ? 80 : u3.port,
		method: 'POST',
		path: u3.path + '?id=' + data.id,
		protocol: u3.protocol,
		headers: {
			'Content-length' : data.contentLength
		}
	};
	console.log('making request to ' + respUrl);
	var rq3 = http.request(r3cfg, function(r3) {
		console.log('resp 3 got ' + data.id);
		r3.on('data', function() {
		});
		r3.on('end', function() {
		});
	}).on('error', function(e) {
	  console.log("Got error: " + data.id + ":" + e.message);
	  console.log(e.stack);
	});
	var masterBuf = Buffer.concat(data.chunks);
	console.log('writing ' + masterBuf.length + ' bytes id:' + data.id);
	rq3.write(masterBuf, 'binary');
	rq3.end();
	console.log('sent rq3 ' + data.id);
}

//main request handler that initiates remote communication
function proxyFun(rq, resp) {
	var data = {
		id: num++,
		contentLength: 0,
		headers: {},
		statusCode: '',
		chunks: []
	};
	
	console.log('request ' + rq.url + ':' + data.id);
	console.log(rq.headers);
	
	var dst = rq.headers[destHdrName];
	var respUrl = rq.headers[respHdrName];
	if (_.isEmpty(dst)) {
		resp.end("Missing header:" + destHdrName);
		return;
	}
	
	var rcfg = ur.parse(dst);
	rcfg.method = rq.method;
	
	
	rcfg = {
		host: rcfg.hostname,
		agent: false,
		path: rcfg.path,
		port: rcfg.port,
		method: rcfg.method,
		protocol: rcfg.protocol
	};
	rcfg.headers = _.clone(rq.headers);
	delete rcfg.headers[destHdrName];
	delete rcfg.headers[respHdrName];
	delete rcfg.headers['host'];
	console.log('making request to: ' + dst);
	console.log(rcfg);
	
	var proxy = makeRequest(rcfg, function(res2) {
	
		res2.addListener('data', function(chunk) {
			//console.log('resp data');
			data.contentLength += chunk.length;
			if (_.isEmpty(respUrl)) {
				resp.write(chunk, 'binary');
			} else {
				data.chunks.push(chunk);
			}
		});
		res2.addListener('end', function() {
			console.log('proxy response ended ' + data.id + ', contentLength: ' + data.contentLength);
			if (_.isEmpty(respUrl)) {
				console.log('ending response ' + data.id);
				resp.end();
			} else {
				_.defer(function() {
					try
					{
						console.log('sending POST to ' + respUrl + ' for rq id=' + data.id);
						var u3 = ur.parse(respUrl);
						var r3cfg = {
							host: u3.hostname,
							agent: false,
							port: _.isEmpty(u3.port) ? 80 : u3.port,
							method: 'POST',
							path: u3.path + '?id=' + data.id,
							protocol: u3.protocol,
							headers: {
								'Content-length' : data.contentLength
							}
						};
						console.log('making request to ' + respUrl);
						var rq3 = http.request(r3cfg, function(r3) {
							console.log('resp 3 got ' + data.id);
							r3.on('data', function() {
							});
							r3.on('end', function() {
							});
						}).on('error', function(e) {
						  console.log("Got error: " + data.id + ":" + e.message);
						  console.log(e.stack);
						});
						var masterBuf = Buffer.concat(data.chunks);
						console.log('writing ' + masterBuf.length + ' bytes id:' + data.id);
						rq3.write(masterBuf, 'binary');
						rq3.end();
						console.log('sent rq3 ' + data.id);
					} catch(e) {
						console.log('Error making request to ' + respUrl + ' :' + e);
					}
				});
			}
		  
		});
		if (_.isEmpty(respUrl)) {
			resp.writeHead(res2.statusCode, res2.headers);
		}
		else {
			_.assign(data.headers, res2.headers);
			data.statusCode = res2.statusCode;
		}
		
	}).on('error', function(e) {
		console.log("Got proxy request error: " + data.id + ":" + e.message);
		console.log(e.stack);
	});
	
	rq.addListener('data', function(chunk) {
		proxy.write(chunk, 'binary');
	});
	rq.addListener('end', function() {
		proxy.end();
		console.log('sent proxy request for '+ data.id + ':' + dst);
		
	});
	
	if (!_.isEmpty(respUrl)) {
		console.log('ending response: '  + data.id);
		resp.end('please wait: ' + respUrl);
	}
};



http.createServer(proxyFun).listen(8899);

console.log('server is running');
