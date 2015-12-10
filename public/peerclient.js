
/* peer_state should contain: 
  - peer_id 
  - peer (peer.js object)
  - connections {peer_id -> peer connection}
 	- doc_id
*/

var peer_state = {connections: {}};


function setUpPeerServer(doc_name_url){

	$.ajax({url: "/docs/" + doc_name_url, 
		success: function(result) {
			var peer_info = JSON.parse(result);


			peer_state.peer_id = peer_info.doc_id.toString() + "-"+ peer_info.site_id.toString();
      console.log("peer id", peer_state.peer_id);
			peer_state.doc_id = peer_info.doc_id;
      
      var peerhost;
      console.log("at: ", window.location.host);
      if (window.location.host != "localhost:4004") {
          peerhost = "52.70.229.110";
      }
      else {
        console.log("connecting to localhost")
        peerhost = "localhost";
      }

			peer = new Peer(peer_state.peer_id, {host: peerhost, path: '/myapp', debug: 2});

			if (peer === undefined) {
        		// TODO error handling
        		return;
        	}

        	/* update peer state */
       		peer_state.peer = peer;

       		/* tell Woot its id */
			var siteIdUpdate = [
									           {
										          "type": "SiteId"
                            			, "siteId": peer_info.site_id
                        			}
                            	];

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
          handleData(data);

    });

    woot.ports.tUpdatePort.send(JSON.stringify({type: "RequestWString"}));
    // TODO send to the TYping port asking for the curr w string

}

function contactPeers(peers_list) {

	for (var i = 0; i < peers_list.length; i++) {
		
		var fellow_id = peers_list[i];

		if (fellow_id.toString().indexOf("-") === -1 ) {
			fellow_id = peer_state.doc_id.toString() + "-" + peers_list[i].toString();
		}

		if (fellow_id === peer_state.peer_id) {
			return;
		}

		if (peer_state.connections[fellow_id] === undefined) { 
			var conn = peer_state.peer.connect(fellow_id);
			handleConnection(conn);
		}
	}
}


function handleData(data) 
{
  	
  	if (data === undefined) {
    	return;
  	}

  	
  	if (data.data_type === "member_update") {
  		contactPeers(data.members);
  	}

    if (data.data_type === "woot_wstring_update") {
      console.log("woot string update!", data.woot_data);

      if (data.woot_data["String"] === undefined || data.woot_data.WString === undefined ){ 
        console.log("not working!!!")

        return; }

      woot.ports.incomingPeer.send(JSON.stringify(data.woot_data));
      console.log("watnt ot set: ", data["String"]);
      textArea.setValue(data.woot_data["String"]);


    }

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
    	if (peer_state.connections[key] === undefined) {
      		continue;
    	}
    	peer_state.connections[key].send(msg);
  	}
}

