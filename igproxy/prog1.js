console.log(process.argv);

console.log("Jestem!");
var fs = require('fs');
console.log(fs == null);
//var asn = require('async');
var qs = require('querystring');

fs.readFile(process.argv[1], function(fc) {
	console.log('in readfile');
	console.log(arguments);
});
var http = require('http');
var num = 0;
http.createServer(function(rq, resp) {
	var id = num++;
	console.log('request: ' + id + ':' + rq.url);
	console.log(rq.headers);
	setTimeout(function() {
	  var txt = 'and now, ending ' + id + ':' + rq.url;
	  console.log(txt);
	  resp.write(txt);
	  resp.end();
	}, 15000);
	resp.write('thats it\n');
	
}).listen(8899);
console.log('server is running');
