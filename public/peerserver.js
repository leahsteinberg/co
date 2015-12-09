
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
      
      if (window.location.host != "localhost") {
          peerhost = "52.70.229.110";

      }
      else {
        peerhost = "localhost";
      }


			peer = new Peer(peer_state.peer_id, {host: peerhost, path: '/myapp', debug: 3});

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

		if (peer_state.connections[fellow_id] === undefined) { // TODO determine if this is necessary
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

  	if (data.data_type === "woot_peer_update"){
    	if (data.woot_data != undefined){
      		woot.ports.incomingPeer.send(JSON.stringify(data.woot_data));
    	}
  	}
}



function broadcast(msg){

  	for (key in peer_state.connections) {
    	if (peer_state.connections[key] === undefined) {
      		continue;
    	}
    	peer_state.connections[key].send(msg);
  	}
}

