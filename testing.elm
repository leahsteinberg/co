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
import Text


sockConnected : Signal.Mailbox Bool
sockConnected = Signal.mailbox False

incoming : Signal.Mailbox String
incoming = Signal.mailbox "null"

socket = io "http://localhost:4004" defaultOptions


type Edit = Insert Int String | Delete Int | None

type alias Update = (Edit, Content)


port initial : Task x ()
port initial = socket `andThen` SocketIO.emit "example" "whaddup"


port responses : Task x ()
port responses = socket `andThen` SocketIO.on "hello" incoming.address


highlightStyle : Highlight
highlightStyle = {color = green, width = 4}


fieldStyle : Style
fieldStyle = {defaultStyle | 
                         highlight <- highlightStyle
                            }

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
pasted content oldContent = (None, oldContent)

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
        
contentSignal = snd <~ (Debug.watch "edits" <~ edits)

edits = foldp newEdit (None, noContent) clientDocMB.signal


main = show <~ incoming.signal


