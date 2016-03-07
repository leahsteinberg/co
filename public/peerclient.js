
/* peer_state should contain:
  - peer_id
  - peer (peer.js object)
  - connections {peer_id -> peer connection}
 	- doc_id
*/

var peer_state = {connections: {}};

var upToDate = false;


function setUpPeerServer(doc_name_url){

	$.ajax({url: "/docs/" + doc_name_url,
		success: function(result) {
			document.title = "CoType Text Editor -- " + doc_name_url;


			// gather information about this peer and other peers.
			var peer_info = JSON.parse(result);
			peer_state.peer_id = peer_info.doc_id.toString() + "-"+ peer_info.site_id.toString();
			peer_state.doc_id = peer_info.doc_id;

      peer_state.peer_id_int = peer_info.site_id;
      setCursorColor(peer_info.site_id);

      var peerhost;
      if (window.location.host != "localhost:4004") {
        peerhost = "52.36.231.76";
      }
      else {
        peerhost = "localhost";
      }

			peer = new Peer(peer_state.peer_id, {host: peerhost, path: '/myapp', debug: 2});

			if (peer === undefined) { return; }

        	/* update peer state */
      peer_state.peer = peer;

       		/* tell Woot its id */
			var siteIdUpdate = [{
										        "type": "SiteId",
                            "siteId": peer_info.site_id
                        	}];


      woot.ports.incomingPeer.send(JSON.stringify(siteIdUpdate));

      contactPeers(peer_info.members);
      peer_state.peer.on("connection", handleConnection);
		}
	});

}


function handleConnection(conn) {

  var conn_id = conn.peer;
  console.log("connected to : ", conn_id);

  if (conn_id === peer_state.peer_id) {
    return;
  }

  if (peer_state.connections[conn_id] === undefined){
    peer_state.connections[conn_id] = conn;
  }

  conn.on('open', initializeConnection.bind(conn));

}


function initializeConnection() {

	 var conn = this;
   console.log("initializing connection to: ", conn.peer);
    var members = Object.keys(peer_state.connections).concat([peer_state.peer_id])

    var initialData =
      					{ peer_id: peer_state.peer_id
        				, members: members
        				, data_type: "member_update"
        				};

    conn.send(initialData);

    conn.on('data', function(data){
      console.log("got data from: ", conn.peer);
          handleData(data, conn.peer);

    });

    woot.ports.tUpdatePort.send(JSON.stringify({type: "RequestWString"}));

}

function contactPeers(peers_list) {
  if (peers_list.length <= 1 ){
    upToDate = true;
  }

	for (var i = 0; i < peers_list.length; i++) {

		// make the fellow ids
		var fellow_id = peers_list[i];

		if (fellow_id.toString().indexOf("-") === -1 ) {
			fellow_id = peer_state.doc_id.toString() + "-" + peers_list[i].toString();
		}

		if (fellow_id === peer_state.peer_id) {
			return;
		}

		// haven't already connected
		if (peer_state.connections[fellow_id] === undefined) {
			var conn = peer_state.peer.connect(fellow_id);
			handleConnection(conn);
		}
	}
}


function handleData(data, sending_peer_id)
{

  	if (data === undefined) {
    	return;
  	}


  	if (data.data_type === "member_update") {
  		contactPeers(data.members);
  	}

		// this is the case where someone has joined.
    if (data.data_type === "woot_wstring_update") {
      if (upToDate) {
        console.log("already up to date!");
      }

      if (data.woot_data["String"] === undefined
        || data.woot_data.WString === undefined || data.woot_data.WString.length === 0 ){ return; }

      var catchUpStr = data.woot_data["String"];
			console.log("Catch Up -> ", data);

      var other_peer_id =  parseInt(sending_peer_id.substr(sending_peer_id.lastIndexOf('-') + 1));

      upToDate = true;
			// here is where we update the document on the screen.
      woot.ports.incomingPeer.send(JSON.stringify(data.woot_data));
      textArea.setValue(catchUpStr);
			updateCaret("insert");
						//textArea.setCursor(textArea.posFromIndex(0));
      makeMark(textArea.posFromIndex(0), textArea.posFromIndex(catchUpStr.length), other_peer_id);
			// TODO why is this not working?
			console.log(textArea)

    }

		// we get a woot update, send to woot Alg in Elm, which will trigger CodeMirror update
  	if (data.data_type === "woot_peer_update"){
    	if (data.woot_data != undefined){
      		woot.ports.incomingPeer.send(JSON.stringify(data.woot_data));
    	}
  	}
}


/* relay typing updates to peers through p2p connection */
function sendPeerUpdates(msg) {
  var message = JSON.parse(msg);
  if (message.length === 0) { return; }
  var toSend;
  if (message[0]["type"] == "CurrWString") {
    toSend = {data_type: "woot_wstring_update", woot_data: message[0]};
  }
  else {
    toSend = {data_type: "woot_peer_update", woot_data: message};
  }
  broadcast(toSend); /* in peerserver.js */
}



function broadcast(msg){

  	for (key in peer_state.connections) {
    	if (peer_state.connections[key] === undefined) { continue; }
    	peer_state.connections[key].send(msg);
  	}
}
