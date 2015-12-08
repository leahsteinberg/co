
var peer_state = {};


function setUpPeerServer(final_url){
	$.ajax({url: "/docs/" + final_ur, success: function(result) {
		var peer_info = JSON.parse(result);

		peer = new Peer(peer_id, {host: 'localhost', port: 9000, path: '/myapp'});
		if (peer === undefined) {
        	// TODO error handling
        	return;
        }

        // update peer state
       	peer_state.peer_id = peer_info.doc_id.toString() + "-"+ peer_info.site_id.toString();
       	peer_state.peer = peer;

       	// tell Woot its id.
		var siteIdUpdate = [
							{"type": "SiteId"
                            , "siteId": peer_info.site_id
                        }
                            ];

        woot.ports.incomingPeer.send(JSON.stringify(siteIdUpdate));

        contactPeers(peer_info.members);

        peer.on("connection", handleConnection); 


	}})

}


function handleConnection(conn) {

}


function contactPeers(peers_list) {

	for (var i = 0; i < peers_list.length; i++) {
		
		var fellow_id = peers_list[i];
		if (fellow_id.indexOf("-") === -1 ) {
			fellow_id = peer_info.doc_id.toString() + "-" + peer_info.members[i].toString();
		}

		if (fellow_id === peer_state.peer_id) {
			return;
		}
		var conn = peer_state.peer.connect(fellow_id);
		handleConnection(conn);

	}

}