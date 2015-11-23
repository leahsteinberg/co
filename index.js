var express = require('express');
var app = express();

// var ot = require('./ot.js');
// console.log("ot is", ot);

var path = require('path');


var siteCounter  = 1; 
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


io.sockets.on('connection', function(socket){
  


    var idUpdate = [{"siteId": siteCounter, "type": "SiteId"}]
    var toSend = JSON.stringify(idUpdate);

        socket.emit("serverWUpdates", JSON.stringify(idUpdate));
      console.log('a user connected, siteId: ', siteCounter);

    siteCounter = siteCounter + 1;

    socket.on("localEdits", function (msg){
    	parsedMsg = JSON.parse(msg);
    	if (parsedMsg === undefined || parsedMsg.length === 0){
    		console.log("bad message!!!");
    		return;
    	}

        //var site = parsedMsg.slice(0, parsedMsg.id.indexOf("-"));
       console.log("msg:", parsedMsg);
      socket.broadcast.emit("serverWUpdates", parsedMsg);


    })
});



