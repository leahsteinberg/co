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
import Model exposing (..)
import Constants exposing (..)
import Char exposing (..)
import Keyboard
import Debug
import Window
import Graph exposing (inserted, deleted)


port caretPos : Signal Int

-- str, caret position
port typingPort: Signal {cp: Int, str: String, len: Int}

typingMB : Signal.Mailbox Int
typingMB = Signal.mailbox -1

typing = Signal.dropRepeats typingPort
--updateGraph : 

--    Signal.foldp

--keys : Signal Char
--keys = Signal.map (\code -> fromCode code) Keyboard.presses 
--   
keyBind = onKeyDown typingMB.address (\code ->  code)


        

--highlightDeleted : Content -> Content -> Update
--highlightDeleted content oldContent = (None, oldContent)

--pasted : Content -> Content -> Update
--pasted content oldContent = 
--    let
--        end = content.selection.start 
--        oldLen = length oldContent.string
--        newLen = length content.string
--        addedLen = newLen - oldLen
--        place = end - addedLen

--        addedStr = slice place (place + addedLen) content.string 
--    in
--        (Paste place addedStr, content)





takeEdit : Content -> Model -> Model
takeEdit newContent model = 
    let 
        oldLen = length (Debug.watch "old " model.content.string)
        newLen = length (Debug.watch "new" newContent.string)
        x = Debug.watch "Diff" (newLen - oldLen)
    in
        if 
            | oldLen - newLen == 1 -> deleted newContent model
            | newLen - oldLen == 1 -> inserted newContent model
            | oldLen - newLen > 1 -> emptyModel
--highlightDeleted newContent oldContent -- edge case is when highlight 2 and insert on....
            | newLen - oldLen > 1 -> emptyModel
--pasted newContent oldContent
            | otherwise -> emptyModel

edits = (\m c -> c) <~ foldModel ~ clientDocMB.signal


foldModel = Debug.watch "model" <~ (Signal.foldp takeEdit emptyModel clientDocMB.signal)

localEdits =  Signal.sampleOn (Signal.map2 (,) typingMB.signal caretPos) typingMB.signal


--updateModel : Model -> 


-- how do we know when theres been an insert?

-- we want to repaint the view iff there is an update that we get from the server. 
-- that's it. thats the only reason.

-- we need a signal of the changes we are making to the form.... how do we get that??

---- VIEW

clientDocMB : Signal.Mailbox Content
clientDocMB = Signal.mailbox noContent

clientDoc :  Content -> (Int, Int) -> Element
clientDoc content (w, h)  = 
    (field fieldStyle (Signal.message clientDocMB.address) "" content)
                |> Graphics.Element.height (h//2)
                |> Graphics.Element.width  (w//2)



main = view
--clientDoc <~  edits ~ Window.dimensions 
--<~ typing.signal
--- map view (sampleOn UPDATE_FROM_SERVER (foldp model))
--caretPos ~ (toString <~ caretPos)

view : Html
view  =
        div
        []
        [
        (textarea [keyBind, property "value" (Json.string "0"), id "typingZone", cols 40, rows 40] [])
        , text (toString 0)
        ]



