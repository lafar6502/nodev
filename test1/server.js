var amqp = require("amqplib");
var http = require("http");
var qname = "testq1";

console.log("To ja:" + qname);

var q1 = amqp.connect("amqp://localhost");
q1.then(function(conn) {
	var ok = conn.createChannel()
		.then(function(ch) {
			ch.assertQueue(qname);
			console.log("q create");
		});
	return ok;
	
}).then(null, console.warn);
console.log("creating web server");

http.createServer(function(rq, resp) {
	console.log('rq: ' + rq.url);
	resp.end("wszystko ok");
	
}).listen(9001);
console.log('server created');