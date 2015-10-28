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


--port caretPos : Signal Int

typing : Signal.Mailbox Int
typing = Signal.mailbox -1


--updateGraph : 

--    Signal.foldp

--keys : Signal Char
--keys = Signal.map (\code -> fromCode code) Keyboard.presses 
--   
keyBind = onKeyDown typing.address (\code ->  code)




slideForward : Model -> Model
slideForward model =
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        mNextWChar = Dict.get currWChar.next model.wChars
    in 
        case mNextWChar of
            Just nextWChar ->  slideForwardChar nextWChar model
            _ -> model
        
slideBackwardChar : WChar -> Model -> Model
slideBackwardChar = slideChar -1 slideBackward

slideForwardChar : WChar -> Model -> Model
slideForwardChar = slideChar  1 slideForward      

slideChar : Int -> (Model -> Model) -> WChar -> Model -> Model
slideChar direction slider wCh model =
    if wCh.id == "START" || wCh.id == "END" then model else
        if wCh.visible > 0 then {model | cursor <- ((fst model.cursor) + direction, wCh)} else slider model



slideBackward : Model -> Model
slideBackward model =
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        mPrevWChar = Dict.get currWChar.prev model.wChars
    in 
        case mPrevWChar of
            Just prevWChar -> slideBackwardChar prevWChar model
            _ -> model



findWChar : Int -> Model -> WChar
findWChar goalIndex model = 
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        currVisible = currWChar.visible <= 0
    in
        if 
            | goalIndex == currIndex -> currWChar
            | goalIndex > currIndex -> findWChar goalIndex (slideForward model)
            | currIndex > goalIndex -> findWChar goalIndex (slideBackward model)




insertChar : Char -> Int -> Content -> Model -> Model
insertChar char predIndex content model =
    let
        predecessor = findWChar predIndex  model
        successor = case Dict.get predecessor.next model.wChars of
                        Just succ -> succ
                        _ -> endChar
        newId = toString model.site ++ toString model.counter
        newWChar = {id = newId
                    , visible = 1
                    , content = char
                    , prev = predecessor.id
                    , next = successor.id }
        newPred = {predecessor | next <- newId}
        newSucc = {successor | prev <- newId}
        newDict = Dict.insert newId newWChar (Dict.insert newSucc.id newSucc (Dict.insert newPred.id newPred model.wChars))
    in 
        { model | counter <- model.counter + 1
                , wChars <- newDict
                , cursor <- (predIndex + 1, newWChar)
                , buffer <- newWChar :: model.buffer
                , content <- content}



inserted : Content -> Model -> Model
inserted content model = 
    let
        place = content.selection.start - 1
        predIndex = Debug.watch "Pred index" (place - 1)
--        letter = slice place (place + 1) 
        letter = List.head (List.drop place (toList (Debug.watch "content" content.string)))

    in
        case letter of 
            Just l -> insertChar l predIndex content model
            _ -> model



deleted : Content -> Model -> Model
deleted content model = 
    let
        place = content.selection.start
    in
        model

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
        oldLen = length model.content.string
        newLen = length newContent.string
    in
        if 
            | oldLen - newLen == 1 -> deleted newContent model
            | newLen - oldLen == 1 -> inserted newContent model
            | oldLen - newLen > 1 -> model
--highlightDeleted newContent oldContent -- edge case is when highlight 2 and insert on....
            | newLen - oldLen > 1 -> model
--pasted newContent oldContent
            | otherwise -> model

edits = (\m c -> c) <~ foldModel ~ clientDocMB.signal


foldModel = Debug.watch "model" <~ (Signal.foldp takeEdit emptyModel clientDocMB.signal)

--localEdits =  Signal.sampleOn (Signal.map2 (,) typing.signal caretPos) typing.signal


--updateModel : Model -> 


-- how do we know when theres been an insert?

-- we want to repaint the view iff there is an update that we get from the server. 
-- that's it. thats the only reason.

-- we need a signal of the changes we are making to the form.... how do we get that??

---- VIEW

clientDocMB : Signal.Mailbox Content
clientDocMB = Signal.mailbox noContent

clientDoc : Signal Element
clientDoc = 
    field fieldStyle (Signal.message clientDocMB.address) "" <~ edits





main = clientDoc
--<~ typing.signal
--- map view (sampleOn UPDATE_FROM_SERVER (foldp model))
--caretPos ~ (toString <~ caretPos)

--view : Html
--view  =
--    let 
--        x = 4
--    in
--        div
--        []
--        [
--        (textarea [keyBind, property "value" (Json.string "0"), id "typingZone", cols 40, rows 40] [])
--        , text (toString 0)
--        ]



