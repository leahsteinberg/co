module TUpdate where

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
import Editor exposing (..)

import ConvertJson exposing (jsonToWUpdate, wUpdateToJson, stringUpdateToJson, jsonToTUpdate, tUpdateToJson)
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


onlyCarets : WUpdate -> Bool
onlyCarets wUp =
    case wUp of
        Caret n -> True
        _ -> False

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

tUpdate = jsonToTUpdate <~ tUpdatePort

-- - - - - - - - - O U T G O I N G - - - - - - - - -

port initializePort : Task x ()
port initializePort = socket `andThen` SocketIO.emit "example" "whaddup"


-- - - - - - S E N D - S E R V E R - U P D A T E S - - - - - - - 

port sendUpdatesPort : Signal (Task x ())
port sendUpdatesPort = (\i -> socket `andThen` SocketIO.emit "localEdits" i) <~ localUpdatesAsJsonToSend


serverUpdates = Signal.filter throwOutNoUpdatesAndCaret NoUpdate ((\u -> jsonToWUpdate u) <~ incoming.signal)

localUpdatesAsJsonToSend : Signal String
localUpdatesAsJsonToSend = wUpdateToJson <~ cleanedUpdatesToSend

cleanedUpdatesToSend : Signal WUpdate
cleanedUpdatesToSend = Signal.filter throwOutNoUpdatesAndCaret NoUpdate (editToWUpdate <~ (snd <~ modelFold))


-- - - - - - - S E N D - D O C - U P D A T E S - - - - - - - -

port docUpdatesPort : Signal String
port docUpdatesPort = tUpdateToJson <~ docUpdatesToSend

docUpdatesToSend : Signal TUpdate
docUpdatesToSend = Signal.filter throwOutNoTUpdates NoTUpdate (editToTUpdate <~ (snd <~ modelFold))



-- - - - - - - P O S S I B L Y - U N N E C E S S A R Y - U P D A T E S - - - -

port sendCaretUpdatesPort : Signal String
port sendCaretUpdatesPort = caretUpdatesToSend

port sendNewStringUpdatesPort : Signal String
port sendNewStringUpdatesPort = sendNewString


caretUpdatesToSend = wUpdateToJson <~ updateCaretPos


updateCaretPos : Signal WUpdate
updateCaretPos = Signal.filter onlyCarets NoUpdate (editToWUpdate <~ (snd <~ modelFold))


sendNewString : Signal String
sendNewString = Signal.map (\(mod, upd) -> stringUpdateToJson mod.doc.str) modelFold



-- - - - - - P R O C E S S - I N C O M I N G - - - - - 

serverUpdateToEdit : Signal Edit
serverUpdateToEdit = handleServerUpdate <~ serverUpdates

tUpdateToEdit : Signal Edit
tUpdateToEdit = handleTUpdate <~ tUpdate

edits : Signal Edit
edits = Signal.merge tUpdateToEdit serverUpdateToEdit

modelFold : Signal (Model, Edit)
modelFold = Signal.foldp processEdit (emptyModel, W NoUpdate) edits




-- - - - - - - - - V I E W - - - - - - - - - - - -
main = show "Strongly" 



view : Model -> WUpdate -> Html
view m upd =
    let debugHtml = if debug then 
            div
            []
            [
--                    , (text (toString m.wSeen))
             (text ("             \nDOc ------" ++ toString (m.doc)))
            , (text ("                SITE ID" ++ toString m.site ++ "    "))
            , (text ("                          " ++ (toString upd)))
--            , (text ("                           " ++(toString m.wString)))
            ,(text ("                                      DEBUG: ...." ++ m.debug))
            ] 

            else div [] []
    in

        div
        []
        [
        (textarea 
            [id "TUpdateZone"
            , cols 40
            , rows 20
            , property "value" (Json.string (wToString m.wString))
            ] [])

        , debugHtml
        ]

