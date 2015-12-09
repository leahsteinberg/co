
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

pserver.on('disconnect', function(id) {

  console.log("peer disconnected: ", id);
});


var rooms = {names: {}, next_doc_id: 1, docs: {}};



/* htpp end points */

app.get('/:doc', function(req, res) {
  res.sendFile(path.resolve('public/index.html'));

});

app.get('/docs/:doc', function(req, res){

  var doc_url = req.params.doc;
  var toReturn = {};
  if (rooms.names[doc_url] === undefined){
    /* make a new document */
    console.log("new doc --> ", doc_url);

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

  } else {

    /* document already exists */
    var curr_doc_id = rooms.names[doc_url];
    var curr_doc = rooms.docs[curr_doc_id];
    var curr_site_id = curr_doc.next_site_id;
    curr_doc.next_site_id = curr_site_id + 1;


    toReturn = {"doc_id": curr_doc_id, "site_id": curr_site_id, "members": curr_doc.members}
    curr_doc.members.push(curr_site_id);
  }
  res.send(JSON.stringify(toReturn))
  // send back to user the doc id 
});


