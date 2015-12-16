

var textArea = CodeMirror(document.body, {autofocus: true});


var colors = [" #ff0000",  "#bfff00", "#00bfff", "#7f00ff", "#ff00ff", " #00ffbf", "#ffbf00"];

/* handle user typing */
textArea.on("change", function (i, c){
  console.log("omg", c);

  setCursorColor(peer_state.peer_id_int);
  if (c.origin != "+input" && c.origin != "+delete" && c.origin != "paste"){
    return;
  }
  
  var toSend;
  var cursor = textArea.getCursor();
  var cp = textArea.indexFromPos(cursor);
  siteIdInt = parseInt(peer_state.peer_id.substr(peer_state.peer_id.lastIndexOf('-') + 1));

  /* pasted text */
  if (c.origin === "paste" && c.removed[0] === "") {
    toSend = handlePaste(c);
  }

  /* deleted a string of text */
  else if (c.origin === "+delete" && c.removed.length > 0 && c.removed[0].length > 0) {
    toSend = handleDeleteString(c);
    console.log("handling deleting a string of text", toSend);
  }

  /* deleting and inserting at the same time   (highlight replace) */
  else if (c.removed[0] != "" && c['text'][0] != "") { 
    toSend = handleTextReplace(c);
  
  }

  /* deletion */
  else if (c.removed[0] != "") {
    toSend = handleDeletion(c, cp);
  }


  /* insertion */
  else if (c['text'][0] != "" || c['text'].length === 2) {
    
    toSend = handleInsertion(c, cp, siteIdInt);
  }

  else {
    toSend = [{"type": ""}];

  }

  for (var i = 0; i < toSend.length; i++) {
      woot.ports.tUpdatePort.send(JSON.stringify(toSend[i]));
  }
    setCursorColor(peer_state.peer_id_int);

 
});


function handleTextReplace(c) {

  var toSendDelete = handleDeleteString(c);
  var toSendInsert = handlePaste(c);

  return toSendDelete.concat(toSendInsert);
}

function handleDeleteString(c) {

  var toSend = {};
  toSend["type"] = "DeleteString";
  toSend["str"] = c.removed[0];
  toSend.cp = textArea.indexFromPos(c.from);

  return [toSend];
}


function handlePaste(c) {

  var toSend = {};
  toSend["type"] = "InsertString";
  toSend["str"] = c.text[0];
  toSend.cp = textArea.indexFromPos(c.from) + 1;

  return [toSend];
}

function handleDeletion(c, cp) {

  var toSend = {};
  toSend["type"] = "Delete";
  currString = textArea.getValue();
  toSend["ch"] = c.removed[0]
  toSend.cp = cp;

  return [toSend];
}



function handleInsertion(c, cp, siteIdInt) {

  var toSend = {}

  /* standard character insertion */
  if (c['text'][0] != "") {

      toSend["type"] = "Insert";
      toSend["ch"] = c.text[0];
  }

  /* new line insertion */
  else if (c['text'].length === 2) {

      toSend["type"] = "Insert";
      toSend["ch"] = "\n";
  }

  toSend["siteId"] = siteIdInt;
  toSend.cp = cp - 1;

  return [toSend];
}


/* display changes from remote users  */
function updateDoc(str){
  setCursorColor(peer_state.peer_id_int);


  var docUpdates = JSON.parse(str);

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
  setCursorColor(peer_state.peer_id_int);

}


/* briefly make text added by other users a specific color */
function makeMark(from, to, o_peer_id) {

  var markColor = colors[o_peer_id % colors.length];
  var markedText = textArea.markText(from, to, {css: "color:" + markColor});
  setTimeout(clearMark.bind(markedText), 400);
}


/* back to black */
function clearMark() {

  var markedText = this;
  markedText.clear();
}

function setCursorColor(p_id) {
  var cursor = $(".CodeMirror-cursor");
  if (cursor != undefined && cursor[0] != undefined) {
    var markColor = colors[p_id % colors.length];
    cursor[0].style.borderLeft = "1px solid " + markColor;
    cursor[0].style.borderRight = "1px solid " + markColor;
    // cursor[0].style.setProperty("border-left", "1px solid" + markColor, "important");
    //cursor[0].style.setProperty("border-right", "1px solid" + markColor, "important");
    //cursor[0].style.setProperty("color", markColor, "important");
    //cursor[0].style.color = markColor;

  }

}


document.onkeydown = function(e) {
  setCursorColor(peer_state.peer_id_int);

  if (!upToDate) {
    e.preventDefault(); 
    e.stopPropagation();
  }
}

document.onmousedown = function(e) {

  if (peer_state.peer_id_int != undefined) {

    setCursorColor(peer_state.peer_id_int);
  }
}



