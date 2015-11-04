module Typing where

import Graphics.Input.Field exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onKeyDown)

import Graphics.Element exposing (..)
import Signal exposing (..)
import String exposing (..)
import Json.Encode as Json 
import Dict
import Char exposing (..)
import Keyboard
import Debug
import Window
import SocketIO exposing (..)
import Task exposing (..)


import ConvertJson exposing (jsonToWUpdate, wUpdateToJson)
import Model exposing (..)
import Constants exposing (..)
import Woot exposing (grabNext)
import Graph exposing (generateIns, generateDelete, graphToString, integrateInsert, integrateDel)



---- - - - - - - -  N E T W O R K I N G - - - - - -


sockConnected : Signal.Mailbox Bool
sockConnected = Signal.mailbox False

incoming : Signal.Mailbox String
incoming = Signal.mailbox "null"


socket = io "http://localhost:4004" defaultOptions

port incomingPort : Task x ()
port incomingPort = socket `andThen` SocketIO.on "serverWUpdates" incoming.address


throwOutNoUpdates : WUpdate -> Bool
throwOutNoUpdates wUp = 
    case wUp of
        NoUpdate -> False
        _ -> True

serverUpdates = Signal.filter throwOutNoUpdates NoUpdate ((\u -> jsonToWUpdate u) <~ incoming.signal)

port sendUpdatesPort : Signal (Task x ())
port sendUpdatesPort = (\i -> socket `andThen` SocketIO.emit "localEdits" i) <~ localUpdatesAsJsonToSend

localUpdatesAsJsonToSend : Signal String
localUpdatesAsJsonToSend = wUpdateToJson <~ cleanedUpdatesToSend

cleanedUpdatesToSend : Signal WUpdate
cleanedUpdatesToSend = Signal.filter throwOutNoUpdates NoUpdate (snd <~ modelFold)

port initializePort : Task x ()
port initializePort = socket `andThen` SocketIO.emit "example" "whaddup"

port typingPort: Signal Doc

typing = Signal.dropRepeats typingPort

-- - - - - - - - - - - - - - - - - - - - -

prettyDictionary : Dict.Dict String WChar -> String
prettyDictionary d =
    List.foldl (\tup accStr -> accStr ++ "\n\n" ++(toString tup) ++ "\n") "" (Dict.toList d)


view : Model -> Html
view m =
        div
        []
        [
        (textarea [id "typingZone", cols 40, rows 20, property "value" (Json.string (graphToString m.wChars))] [])
--        property "value" (Json.string (graphToString m.wChars))
--        property "value" (Json.string "0"),
--        , (text ("doc----" ++ (toString t) ++ "-----"))
       , (text ("\nDOc ------" ++ toString (m.doc)))
        , (text ("SITE ID" ++ toString m.site))
--        , (text ("LEN " ++ toString m.doc.len))
        , (text (graphToString m.wChars))
        , (text (toString m.wChars))
        , (text ("DEBUG: ...." ++ m.debug))

--        , (text (toString m.buffer))


        ]
-- - - - - - - - - - - - - - - - - - - - -


handleTyping : Doc -> Edit
handleTyping doc = T doc

typingToEdit : Signal Edit
typingToEdit = handleTyping <~ typing

handleServerUpdate : WUpdate -> Edit
handleServerUpdate wUpdate = W wUpdate

serverUpdateToEdit : Signal Edit
serverUpdateToEdit = handleServerUpdate <~ serverUpdates


edits : Signal Edit
edits = Signal.merge typingToEdit serverUpdateToEdit

modelFold : Signal (Model, WUpdate)
modelFold = Signal.foldp processEdit (emptyModel, NoUpdate) edits

processEdit : Edit -> (Model, WUpdate) -> (Model, WUpdate)
processEdit edit (model, prevUpdate) =
        case edit of
            T typing -> processTyping typing (model, prevUpdate)
            W wUpdate ->  processServerUpdate wUpdate (model, prevUpdate)


processServerUpdate : WUpdate -> (Model, WUpdate) -> (Model, WUpdate)
processServerUpdate wUpd (model, prevUpdate) = 
    case wUpd of
        SiteId id -> ({model | site <- id}, prevUpdate)
        Insert wCh -> (integrateInsert wCh model False, NoUpdate)
        Delete wCh -> (integrateDel wCh model, NoUpdate)





processTyping : Doc -> (Model, WUpdate) -> (Model, WUpdate)
processTyping newDoc (model, prevUpdate) =
    let 
        oldLen = model.doc.len
        newLen = newDoc.len
    in
        if 
            | oldLen == newLen -> (model, NoUpdate)
--                (updateCursor newDoc {model | doc <- newDoc, docBuffer <- newDoc::model.docBuffer}, NoUpdate)
            | oldLen - newLen == 1 -> generateDelete newDoc model
            | newLen - oldLen == 1 -> generateIns newDoc model
--{model| cursor <- (0, grabNext startChar model.wChars)}
            | oldLen - newLen > 1 -> ({emptyModel |doc <- docSilly "BAD CASE 3"}, NoUpdate)
            | newLen - oldLen > 1 -> ({emptyModel |debug <- "BAD CASE 1:, oldLen : " ++ toString oldLen ++ "new Len: " ++ toString newLen}, NoUpdate)
            | otherwise -> ({emptyModel |doc <- docSilly "BAD CASE 2"}, NoUpdate)



--updateCursor : Doc -> Model -> Model
--updateCursor  newDoc model = {model | doc <- newDoc
--                                , cursor <- (newDoc.cp, Graph.findWChar Graph.slideBackward newDoc.cp model)}





main = Signal.map (\(mod, upd) -> view mod) modelFold

