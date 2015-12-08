

var textArea = CodeMirror(document.body);

var coloredText = [];



/* handle user typing */
textArea.on("change", function (i, c){
    //console.log("omg! ", c);
  if (c.origin != "+input" && c.origin != "+delete" && c.origin != "paste"){
    return;
  }
  
  var toSend = {};
  var cursor = textArea.getCursor();
  var cp = textArea.indexFromPos(cursor);
  var siteIdInt = parseInt(peer_state.peer_id.substr(peer_state.peer_id.lastIndexOf('-') + 1));

  if (c.origin === "paste") {
    toSend["type"] = "InsertString";
    toSend["str"] = c.text[0];
    cp = textArea.indexFromPos(c.from) + 1;
  }

  else if (c.removed[0] != ""){
    toSend["type"] = "Delete";
    currString = textArea.getValue();
    toSend["ch"] = c.removed[0]
  }

  else if (c['text'][0] != ""){
      toSend["type"] = "Insert";
      console.log("letter", c.text[0]);
      toSend["ch"] = c.text[0];
      toSend["siteId"] = siteIdInt;

      cp = cp - 1;
  }

  else if (c['text'].length === 2){
      toSend["type"] = "Insert";
      toSend["ch"] = "\n";
      toSend["siteId"] = siteIdInt;
  }

  toSend.cp = cp;
  console.log(toSend);

  woot.ports.tUpdatePort.send(JSON.stringify(toSend));
 
});


/* relay typing updates to peers through p2p connection */
function sendPeerUpdates(msg) {
  var message = JSON.parse(msg);
  if (message.length === 0) { return; }
  var toSend = {data_type: "woot_peer_update", woot_data: message}
  broadcast(toSend); /* in peerserver.js */

}


/* display changes from remote users in this  */

function docUpdate(str){
  
  var docUpdates = JSON.parse(str);
  if (docUpdates === undefined || docUpdates.length === 0){
    return;
  }
  
  for (var i = 0; i< docUpdates.length; i++ ) {
    var docUpdate = docUpdates[i];
    console.log('do remote change', docUpdate);
    var location = docUpdate["index"];
    var from = textArea.posFromIndex(location);
  
    if (docUpdate["type"] === "typingInsert" ){
      if (docUpdate["ch"] === undefined || docUpdate["index"] === undefined){
        return;
      }

      textArea.replaceRange(docUpdate["ch"], from, null, "server!!!");
      var to = textArea.posFromIndex(location + 1);
      textArea.markText(from, to, {css: "color: blue"});
      updateCaret("insert");
    }
    else if (docUpdate["type"] === "typingDelete"){
      if (docUpdate["ch"] === undefined || docUpdate["index"] === undefined){
        return;
      }

      var to = textArea.posFromIndex(location + 1)
      textArea.replaceRange("", from, to, "server!!!");
      updateCaret("delete");
    }
  }
}


/* make sure caret not affected by remote inserts and deletes */

function updateCaret(action){
  var update;
  if (action === "insert"){
    update = function(x) {return x + 1;};
  } else if (action === "delete") {
    update = function(x){return x - 1};
  }
  var caret = textArea.indexFromPos(textArea.getCursor());
  var newCaret = caret;
  if (caret > location) {
      newCaret = update(caret);
  }
  textArea.setCursor(textArea.posFromIndex(newCaret));
}




