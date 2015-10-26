import Graphics.Input.Field exposing (..)
import Signal exposing (..)
import Graphics.Element exposing (..)
import Debug
import Color exposing (..)
import Keyboard
import String exposing (length, slice)



type Edit = Insert Int String | Delete Int | None

type alias Update = (Edit, Content)


type All = E Edit | F Element | K Int | C Content



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
    field fieldStyle (Signal.message clientDocMB.address) "" <~ (snd <~ (Debug.watch "hi " <~ edits))



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
--    let 
--        place = content.selection.start


--    (Insert )



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
            | oldLen - newLen > 1 -> (None, newContent)
--highlightedChange newContent oldContent.string
            | otherwise -> (None, newContent)
--            | oldLen - newLen > 1 && ->
        
        
---        if length (snd oldUpdate) > length newContent then inserted newContent else deleted newContent



--changedContent = sampleOn Keyboard.presses clientDocMB.signal

edits = foldp newEdit (None, noContent) clientDocMB.signal


-- sampleOn (Debug.watch "showing" <~ (sampleOn (clientDocMB.signal) Keyboard.presses)) clientDocMB.signal



main = clientDoc


