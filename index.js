var express = require('express');
var app = express();

var ot = require('./ot.js');
console.log("ot is", ot);

var path = require('path');


var server = app.listen(4004, function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log("Collab App listening at http://%s:%s ~~~", host, port);
});

var thing = 1;
var io = require('socket.io')(server);
console.log("socket.io is working working: ", io!= undefined);
app.use("/public", express.static(path.resolve('public')));

app.get('/', function(req, res) {
  res.sendFile(path.resolve('public/index.html'));
});


io.on('connection', function(socket){
  console.log('a user connected');
    socket.on('example', function(msg){
    console.log('examp: ' + msg);
    
  });
    socket.on("edits", function (msg){
    	msg = JSON.parse(msg);
    	if (msg === undefined || Object.keys(msg).length === 0){
    		console.log("bad message!!!");
    		return;
    	}
    	var currDoc = ot.applyOp(msg)
    	console.log("currDoc is: ", currDoc);
    	if (msg.content){
    	console.log(ot.hashString(msg.content))
    }
		socket.emit("hello", msg);

    thing = thing + 1


    })
});



