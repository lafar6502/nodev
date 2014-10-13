var http = require('http');

http.createServer(function(rq, resp) {
	console.log('SLOW SERVER got request ' + rq.url);
	setTimeout(function() {
	  var txt = 'SLOW SERVER response to ' + ':' + rq.url;
	  console.log(txt);
	  resp.write(txt);
	  resp.end();
	}, 5000);
}).listen(9997);