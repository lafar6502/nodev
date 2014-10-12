var amqp = require("amqplib");
var http = require("http");
var qname = "testq1";
var messagesCount = 0;

console.log("To ja:" + qname);
var chan;
var q1 = amqp.connect("amqp://localhost");
q1.then(function(conn) {
	var ok = conn.createChannel()
		.then(function(ch) {
			ch.assertQueue(qname);
			chan = ch;
			console.log("q create");
		})
	return ok;
	
}).then(null, console.warn);
q1.then(function(conn) {
	var ok = conn.createChannel()
		.then(function(ch) {
			ch.assertQueue(qname);
			console.log('now listening for msgs');
			ch.consume(qname, function(msg) {
			      if (msg !== null) {
				console.log('msg: ' + msg.content.toString());
				messagesCount++;
				ch.ack(msg);
			      }
			});
		})
	return ok;
}).then(null, console.warn);
console.log("creating web server");

http.createServer(function(rq, resp) {
	console.log('rq: ' + rq.url);
	var r = chan.sendToQueue(qname, new Buffer("incoming request " + rq.url + ": " + Date.now()));
	resp.end("wszystko ok " + messagesCount);
	
}).listen(9001);
console.log('server created');