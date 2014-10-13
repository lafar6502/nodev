var http = require('http');

http.createServer(function(rq, resp) {
	console.log('DUMB LISTENER got request ' + rq.url);
	console.log(rq.headers);
	var len = 0;
	rq.on('data', function(chunk) {
		console.log('data: ' + chunk.length);
		len += chunk.length;
	});
	rq.on('end', function(chunk) {
		console.log('received bytes: ' + len);
		resp.end();
	});
	
	
}).listen(9999);