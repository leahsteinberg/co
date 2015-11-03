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



var delaySendOfSiteId = function(socket) {
    console.log("t-!!!", this);
    console.log( "s-!!!",socket);

setInterval(
            function(msg){
  

        }, 200);

}



io.sockets.on('connection', function(socket){
  

   // socket.on('example', function(msg){

    var idUpdate = {"siteId": siteCounter, "type": "SiteId"}
    var toSend = JSON.stringify(idUpdate);

        socket.emit("serverWUpdates", JSON.stringify(idUpdate));
    console.log('a user connected, siteId: ', siteCounter);

    siteCounter = siteCounter + 1;
   // });
  //      

//     console.log('examp: ' + msg);
    
   

    socket.on("localEdits", function (msg){
    	parsedMsg = JSON.parse(msg);
    	if (parsedMsg === undefined || Object.keys(msg).length === 0){
    		console.log("bad message!!!");
    		return;
    	}
        if (parsedMsg.id === undefined){
            return;
        }
        //var site = parsedMsg.slice(0, parsedMsg.id.indexOf("-"));
       // console.log("site is:", site);
        socket.broadcast.emit("serverWUpdates", parsedMsg);

    thing = thing + 1


    })
});



