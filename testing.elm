import Graphics.Input.Field exposing (..)
import Signal exposing (..)
import Graphics.Element exposing (..)
import Debug
import Color exposing (..)
import Keyboard
import String exposing (length, slice)
import Http
import SocketIO exposing (..)
import Task exposing (..)
import Text exposing (fromString)
import Graphics.Collage exposing (..)

import Constants exposing (..)
import ConvertJson exposing (editToJson, hashString)
import Model exposing (..)


sockConnected : Signal.Mailbox Bool
sockConnected = Signal.mailbox False

incoming : Signal.Mailbox String
incoming = Signal.mailbox "null"


socket = io "http://localhost:4004" defaultOptions




port incomingPort : Task x ()
port incomingPort = socket `andThen` SocketIO.on "hello" incoming.address

port sendEditsPort : Signal (Task x ())
port sendEditsPort = (\i -> socket `andThen` SocketIO.emit "edits" i) <~ editsToSend ---(m, lu)


port initializePort : Task x ()
port initializePort = socket `andThen` SocketIO.emit "example" "whaddup"


isConnected = socket `andThen` SocketIO.connected sockConnected.address


clientDocMB : Signal.Mailbox Content
clientDocMB = Signal.mailbox noContent

clientDoc : Signal Element
clientDoc = 
    field fieldStyle (Signal.message clientDocMB.address) "" <~ contentSignal


inserted : Content -> Update
inserted content = 
    let
        place = content.selection.start - 1
        letter = slice place (place + 1) content.string
    in
        (Insert place letter, content)


deleted : Content -> Update
deleted content = 
    let
        place = content.selection.start
    in
        (Delete place, content)

highlightDeleted : Content -> Content -> Update
highlightDeleted content oldContent = (None, oldContent)

pasted : Content -> Content -> Update
pasted content oldContent = 
    let
        end = content.selection.start 
        oldLen = length oldContent.string
        newLen = length content.string
        addedLen = newLen - oldLen
        place = end - addedLen

        addedStr = slice place (place + addedLen) content.string 
    in
        (Paste place addedStr, content)

newEdit : Content -> Update -> Update
newEdit newContent oldUpdate =
    let
        oldContent = snd oldUpdate
        oldLen = length oldContent.string
        newLen = length newContent.string
    in
        if 
            | oldLen - newLen == 1 -> deleted newContent
            | newLen - oldLen == 1 -> inserted newContent
            | oldLen - newLen > 1 -> highlightDeleted newContent oldContent -- edge case is when highlight 2 and insert on....
            | newLen - oldLen > 1 -> pasted newContent oldContent
            | otherwise -> (None, newContent)
        
contentSignal =  snd <~ (Debug.watch "edits" <~ edits)

edits = foldp newEdit (None, noContent) clientDocMB.signal

contentStringSig = (\cont -> cont.string) <~ (snd <~ edits)

editsToSend : Signal String
editsToSend = (editToJson <~ editsToSendClient)

editsToSendClient : Signal Edit
editsToSendClient = (fst <~ edits)

main = displaySigElements
----    show <~ Signal.map2 (,) sockConnected.signal incoming.signal

displaySigElements = (\cliDoc incoming outgoing hash -> flow down [cliDoc, show  "from server: ", incoming, show  "to server", outgoing, hash]) 
                        <~ clientDoc ~ (show <~ incoming.signal) ~ (show <~ editsToSendClient) ~ (show <~ (hashString <~ contentStringSig))




