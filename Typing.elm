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


import ConvertJson exposing (jsonToWUpdate, wUpdateToJson, stringUpdateToJson, jsonToTypingUpdate)
import Model exposing (..)
import Constants exposing (..)
import Woot exposing (grabNext
                        , wToString
                        , canIntegrate)
import Graph exposing (generateInsert
                        , generateDelete
                        , integrateRemoteInsert
                        , integrateRemoteDelete)



---- - - - - - - -  N E T W O R K I N G - - - - - -


sockConnected : Signal.Mailbox Bool
sockConnected = Signal.mailbox False

incoming : Signal.Mailbox String
incoming = Signal.mailbox "null"


port windowLocPort : String


socket =  io windowLocPort defaultOptions

port incomingPort : Task x ()
port incomingPort = socket `andThen` SocketIO.on "serverWUpdates" incoming.address


onlyCarets : WUpdate -> Bool
onlyCarets wUp =
    case wUp of
        Caret n -> True
        _ -> False


throwOutNoUpdatesAndCaret : WUpdate -> Bool
throwOutNoUpdatesAndCaret wUp = 
    case wUp of
        NoUpdate -> False
        --Caret n -> False
        _ -> True

serverUpdates = Signal.filter throwOutNoUpdatesAndCaret NoUpdate ((\u -> jsonToWUpdate u) <~ incoming.signal)

port sendCaretUpdatesPort : Signal String
port sendCaretUpdatesPort = caretUpdatesToSend

port sendNewStringUpdatesPort : Signal String
port sendNewStringUpdatesPort = sendNewString

port sendUpdatesPort : Signal (Task x ())
port sendUpdatesPort = (\i -> socket `andThen` SocketIO.emit "localEdits" i) <~ localUpdatesAsJsonToSend

localUpdatesAsJsonToSend : Signal String
localUpdatesAsJsonToSend = wUpdateToJson <~ cleanedUpdatesToSend

caretUpdatesToSend = wUpdateToJson <~ updateCaretPos


cleanedUpdatesToSend : Signal WUpdate
cleanedUpdatesToSend = Signal.filter throwOutNoUpdatesAndCaret NoUpdate (snd <~ modelFold)

updateCaretPos : Signal WUpdate
updateCaretPos = Signal.filter onlyCarets NoUpdate (snd <~ modelFold)



port initializePort : Task x ()
port initializePort = socket `andThen` SocketIO.emit "example" "whaddup"

port typingPort: Signal String

typing = jsonToTypingUpdate <~ typingPort

-- - - - - - - - - V I E W - - - - - - - - - - - -


sendNewString : Signal String
sendNewString = Signal.map (\(mod, upd) -> stringUpdateToJson mod.doc.str) modelFold

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
            [id "typingZone"
            , cols 40
            , rows 20
            , property "value" (Json.string (wToString m.wString))
            ] [])

        , debugHtml
        ]



handleTyping : Typing -> Edit
handleTyping typing = T typing

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

integrateRemoteUpdate : WUpdate -> (Model, WUpdate) -> (Model, WUpdate)
integrateRemoteUpdate wUpd (m, prevUpd) =
    let
        moveToProcessed x m = {m | processedPool <- x :: m.processedPool}
    in

        case wUpd of
            Insert wCh -> if canIntegrate wUpd m.wSeen 
                        then integrateRemoteInsert wCh m 
                        else integratePool (moveToProcessed wUpd m, prevUpd)

            Delete wCh -> if canIntegrate wUpd m.wSeen
                                then integrateRemoteDelete wCh m
                                else integratePool (moveToProcessed wUpd m, prevUpd)

            _ -> integratePool (moveToProcessed wUpd m, prevUpd)

integratePool : (Model, WUpdate) -> (Model, WUpdate)
integratePool (m, w) = 
    case m.pool of 
        
        [] -> ({m | pool <- m.processedPool, processedPool <- []}, w)
        
        x :: xs -> integrateRemoteUpdate x ({m | pool <- xs}, w)
                


-- - - - - - - -  S I G N A L  P R O C E S S I N G - - - - - -

processEdit : Edit -> (Model, WUpdate) -> (Model, WUpdate)
processEdit edit (model, prevUpdate) =
        case edit of
            T typing -> processTyping typing (model, prevUpdate)
            W wUpdate ->  processServerUpdate wUpdate (model, prevUpdate)


processServerUpdate : WUpdate -> (Model, WUpdate) -> (Model, WUpdate)
processServerUpdate wUpd (model, prevUpdate) = 
    let
        poolUpdate = ({model | pool <- wUpd :: model.pool}, prevUpdate)
    in
        case wUpd of
            SiteId id -> ({model | site <- id}, prevUpdate)

            Insert wCh -> if canIntegrate wUpd model.wSeen 
                            then integrateRemoteInsert wCh model 
                            else poolUpdate
                        
            Delete wCh -> if canIntegrate wUpd model.wSeen 
                            then integrateRemoteDelete wCh model
                            else poolUpdate




processTyping : Typing -> (Model, WUpdate) -> (Model, WUpdate)
processTyping typ (model, prevUpdate) = 
    case typ of
        I ch place -> generateInsert ch place model
        D ch place -> generateDelete ch place model
        NoTUpdate -> ({model | debug <- "not T UPDST CASE"}, NoUpdate)
        _ -> ({model| debug <- "wtf case"}, NoUpdate)


sendDebug model str = ({model | debug <- str ++ model.debug}, NoUpdate)



main = (\t (m,w) -> show (toString t ++ "    " ++ (wToString m.wString) ++ "   " ++ toString m.debug ++ toString m.wString) ) <~ typing ~ modelFold

