
/* set up regular http server*/
var express = require('express');
var app = express();
var path = require('path');

var server = app.listen(4004, function(){
        var host = server.address().address;
        var port = server.address().port;
        console.log("Collab App listening at http://%s:%s ~~~", host, port);
});

app.use("/public", express.static(path.resolve('public')));



/* peer js server */


var PeerServer = require('peer').PeerServer;
var pserver = PeerServer({port: 9000, path: '/myapp'});

pserver.on('connection', function(id) { 
  console.log("peer connected: ", id);


 });

var rooms = {names: {}, next_doc_id: 1, docs: {}};





app.get('/:doc', function(req, res) {
  res.sendFile(path.resolve('public/index.html'));
  // need to some how return the doc id and site id in here. 
});

app.get('/docs/:doc', function(req, res){
  //res.send(JSON.stringify({"hi": req.params.doc}));
  //console.log("request is is:", req.params);
  var doc_url = req.params.doc;
  var toReturn = {};
  if (rooms.names[doc_url] === undefined){
    /* make a new document */
    console.log("new doc!");

    var curr_site_id = 1;
    var curr_doc_id = rooms.next_doc_id;

    var new_doc = {
                    id: curr_doc_id, 
                    name: doc_url, 
                    members: [curr_site_id], 
                    next_site_id: curr_site_id
                  };

    rooms.names[doc_url] = curr_doc_id;
    rooms.docs[curr_doc_id] = new_doc;

    toReturn = {"doc_id": curr_doc_id, "site_id": curr_site_id, "members": new_doc.members};

    rooms.next_doc_id = curr_doc_id + 1;
    new_doc.next_site_id = curr_site_id + 1;
    console.log(rooms)

  } else {
    console.log("new doc!");
    /* document already exists */
    var curr_doc_id = rooms.names[doc_url];
    var curr_doc = rooms.docs[curr_doc_id];
    var curr_site_id = curr_doc.next_site_id;
    curr_doc.next_site_id = curr_site_id + 1;


    toReturn = {"doc_id": curr_doc_id, "site_id": curr_site_id, "members": curr_doc.members}
    curr_doc.members.push(curr_site_id);
  }
  console.log("sending back", toReturn);
  res.send(JSON.stringify(toReturn))
  // send back to user the doc id 

});

/* logic to handle clients*/
var siteCounter  = 1; 













/* socket io server*/
var io = require('socket.io')(server);
console.log("socket.io is working: ", io!= undefined);



io.sockets.on('connection', function(socket){
    /* new client */
  
    var idUpdate = [{"siteId": siteCounter, "type": "SiteId"}]
    socket.emit("serverWUpdates", JSON.stringify(idUpdate));
    //console.log('a user connected, siteId: ', siteCounter);

    siteCounter = siteCounter + 1;

    socket.on("localEdits", function (msg){
    	wootUpdate = JSON.parse(msg);
    	if (wootUpdate === undefined || wootUpdate.length === 0){
    		return;
    	}

      console.log("msg:", wootUpdate);
      socket.broadcast.emit("serverWUpdates", wootUpdate);

    });
});



