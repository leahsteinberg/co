

var textArea = CodeMirror(document.body);


var colors = [" #ff0000",  "#bfff00", "#00bfff", "#7f00ff", "#ff00ff", " #00ffbf", "#ffbf00"];


/* handle user typing */
textArea.on("change", function (i, c){

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
      toSend["ch"] = c.text[0];
      toSend["siteId"] = siteIdInt;

      cp = cp - 1;
  }

  else if (c['text'].length === 2){
      toSend["type"] = "Insert";
      toSend["ch"] = "\n";
      toSend["siteId"] = siteIdInt;
      cp = cp - 1;
  }
  else {
    toSend["type"] = "";
  }

  toSend.cp = cp;
  console.log("sending!", toSend);

  woot.ports.tUpdatePort.send(JSON.stringify(toSend));
 
});



/* display changes from remote users in this  */

function updateDoc(str){

  
  var docUpdates = JSON.parse(str);
  //console.log("update doc", docUpdates);
  if (docUpdates === undefined || docUpdates.length === 0){
    return;
  }
  docUpdates = docUpdates.reverse();
  
  for (var i = 0; i< docUpdates.length; i++ ) {
    var docUpdate = docUpdates[i];

    var location = docUpdate["index"];
    var from = textArea.posFromIndex(location);
  
    if (docUpdate["type"] === "typingInsert" ){
      if (docUpdate["ch"] === undefined || docUpdate["index"] === undefined){
        return;
      }

      textArea.replaceRange(docUpdate["ch"], from, null, "server!!!");
      var to = textArea.posFromIndex(location + 1);
      makeMark(from, to, docUpdate.siteId);


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


function clearMark() {
  var markedText = this;
  markedText.clear();
}


function makeMark(from, to, o_peer_id) {

  var markColor = colors[o_peer_id % colors.length];
  var markedText = textArea.markText(from, to, {css: "color:" + markColor});
  setTimeout(clearMark.bind(markedText), 400);

}




