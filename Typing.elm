module TUpdate where



import Graphics.Input.Field exposing (..)
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
import Editor exposing (..)



import DraftTests exposing (..)
import ConvertJson exposing (jsonToWUpdates, wUpdatesToJson, stringUpdateToJson, jsonToTUpdate, tUpdatesToJson)
import Model exposing (..)
import Constants exposing (..)
import Woot exposing (grabNext
                        , wToString
                        , canIntegrate)
import Graph exposing (generateInsert
                        , generateDelete
                        , integrateRemoteInsert
                        , integrateRemoteDelete)


-- - - - - - - U T I L I T I E S - - - - - 




throwOutNoTUpdates : TUpdate -> Bool
throwOutNoTUpdates tUp =
    case tUp of
        NoTUpdate -> False
        _ -> True

throwOutNoUpdatesAndCaret : WUpdate -> Bool
throwOutNoUpdatesAndCaret wUp = 
    case wUp of
        NoUpdate -> False
        --Caret n -> False
        _ -> True


editToWUpdate : Edit -> WUpdate
editToWUpdate e =
    case e of
        W wUpd -> wUpd
        T tUpd -> NoUpdate

editToTUpdate : Edit -> TUpdate
editToTUpdate e =
    case e of
        W wUpd -> NoTUpdate
        T tUpd -> tUpd


handleTUpdate : TUpdate -> Edit
handleTUpdate tUpdate = T tUpdate

handleServerUpdate : WUpdate -> Edit
handleServerUpdate wUpdate = W wUpdate

---- - - - - - - -  N E T W O R K I N G - - - - - -


sockConnected : Signal.Mailbox Bool
sockConnected = Signal.mailbox False

incoming : Signal.Mailbox String
incoming = Signal.mailbox "null"

port windowLocPort : String

socket =  io windowLocPort defaultOptions

port incomingPort : Task x ()
port incomingPort = socket `andThen` SocketIO.on "serverWUpdates" incoming.address

port tUpdatePort: Signal String

tUpdate = Signal.map jsonToTUpdate tUpdatePort

-- - - - - - - - - O U T G O I N G - - - - - - - - -

port initializePort : Task x ()
port initializePort = socket `andThen` SocketIO.emit "example" "whaddup"


-- - - - - - S E N D - S E R V E R - U P D A T E S - - - - - - - 

port sendUpdatesPort : Signal (Task x ())
port sendUpdatesPort = Signal.map (\i -> socket `andThen` SocketIO.emit "localEdits" i) localUpdatesAsJsonToSend


serverUpdates = Signal.map (\u -> jsonToWUpdates u) incoming.signal

localUpdatesAsJsonToSend : Signal String
localUpdatesAsJsonToSend = Signal.map (\updates -> wUpdatesToJson updates) cleanedUpdatesToSend

cleanedUpdatesToSend : Signal (List WUpdate)
cleanedUpdatesToSend = Signal.map (\ (model, edits) -> List.map editToWUpdate edits) modelFold


-- - - - - - - S E N D - L O C A L - D O C - U P D A T E S - - - - - - - -

port docUpdatesPort : Signal String
port docUpdatesPort = Signal.map (\updates -> tUpdatesToJson updates) docUpdatesToSend

docUpdatesToSend : Signal (List TUpdate)
docUpdatesToSend = Signal.map (\ (model, edits) -> List.map editToTUpdate edits) modelFold



-- - - - - - - P O S S I B L Y - U N N E C E S S A R Y - U P D A T E S - - - -

port sendNewStringUpdatesPort : Signal String
port sendNewStringUpdatesPort = sendNewString


sendNewString : Signal String
sendNewString = Signal.map (\(mod, upd) -> stringUpdateToJson mod.doc.str) modelFold



-- - - - - - P R O C E S S - I N C O M I N G - - - - - 

serverUpdateToEdit : Signal (List Edit)
serverUpdateToEdit = Signal.map (List.map handleServerUpdate) serverUpdates

tUpdateToEdit : Signal (List Edit)
tUpdateToEdit = Signal.map (\t -> [handleTUpdate t]) tUpdate

edits : Signal (List Edit)
edits = Signal.merge tUpdateToEdit serverUpdateToEdit

modelFold : Signal (Model, List Edit)
modelFold = Signal.foldp (\ e (m,w) -> processEdits e m) (emptyModel, []) edits


-- - - - - - - - - V I E W - - - - - - - - - - - -
tester =    
  let
      local = makeEmptySite 1
      remote = makeEmptySite 2
      (localModel, lEdits) = insertString "hello" 1 local
      (remoteModel, rEdits) = processEdits (lEdits) remote
  in
      (remoteModel, rEdits, lEdits)



main = show runTests
--(\ (m, r, l) -> show (wToString m.wString)) tester
--++ "   pool ----   " ++ toString m.pool ++ " ----processed -----" ++ toString m.processedPool)) tester   
--  (\ (m, w) t s  -> show  ("this wStrings: " ++ toString m.wString ++ "  other client:  " ++ toString  s ++ "                  this client: " ++ toString t ++ "             debug: " ++ m.debug)) <~ modelFold ~ tUpdate ~ serverUpdates


