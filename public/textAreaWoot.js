

var textArea = CodeMirror(document.body);


textArea.on("change", function (i, c){
    //console.log("omg! ", c);
  if (c.origin != "+input" && c.origin != "+delete" && c.origin != "paste"){
    return;
  }
  
  var toSend = {};
  var cursor = textArea.getCursor();
  var cp = textArea.indexFromPos(cursor);

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
      cp = cp - 1;
  }

  else if (c['text'].length === 2){
      toSend["type"] = "Insert";
      toSend["ch"] = "\n";
  }

  toSend.cp = cp;

  woot.ports.tUpdatePort.send(JSON.stringify(toSend));
 
});


function sendPeerUpdates(msg) {
  var message = JSON.parse(msg);
  if (message.length === 0) { return; }
  var toSend = {data_type: "woot_peer_update", woot_data: message}
  broadcast(toSend);

}


function docUpdate(str){
  var docUpdates = JSON.parse(str);
  //console.log("REGISTERING server Update", docUpdates);
  if (docUpdates === undefined || docUpdates.length === 0){
    return;
  }
  for (var i = 0; i< docUpdates.length; i++ ) {
    var docUpdate = docUpdates[i];
  
  if (docUpdate["type"] === "typingInsert" ){
    if (docUpdate["ch"] === undefined || docUpdate["index"] === undefined){
      return;
    }
    var location = docUpdate["index"];
    var from = textArea.posFromIndex(location);
    textArea.replaceRange(docUpdate["ch"], from, null, "server!!!");
    var to = textArea.posFromIndex(location + 1);
    //console.log("from", from, "to", to);
    textArea.markText(from, to, {css: "color: blue"});
    updateCaret("insert");
  }
  else if (docUpdate["type"] === "typingDelete"){
    if (docUpdate["ch"] === undefined || docUpdate["index"] === undefined){
      return;
    }
    var location = docUpdate["index"];
    var from = textArea.posFromIndex(location)
    var to = textArea.posFromIndex(location + 1)
    textArea.replaceRange("", from, to, "server!!!");
    updateCaret("delete");
  }
}
}
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
