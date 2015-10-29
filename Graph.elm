module Graph where

import Model exposing (..)
import Dict 
import Debug
import String exposing (toList)
import List 
import Constants exposing (endChar, startChar)



import Graphics.Input.Field exposing (..)


--slideBackward = slide (\wc -> wc.prev) slideBackwardChar

slideForward : Model -> Model
slideForward model = slide (\wc -> wc.next) slideForwardChar model

slideBackward : Model -> Model
slideBackward model = slide (\wc -> wc.prev) slideBackwardChar model

--slideBackward model = 
--    let
--        currIndex = fst model.cursor
--        currWChar = snd model.cursor
--        mPrevWChar = Dict.get currWChar.prev model.wChars
--    in 
--        case mPrevWChar of
--            Just prevWChar -> slideBackwardChar prevWChar model
--            _ -> model

slide : (WChar -> String) -> (WChar -> Model-> Model) -> Model -> Model
slide grabNeighbor slideChar model =
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        mNeighborWChar = Dict.get (grabNeighbor currWChar) model.wChars
    in 
        case mNeighborWChar of
            Just neighborWChar ->  slideChar neighborWChar model
            _ -> model
        
slideBackwardChar : WChar -> Model -> Model
slideBackwardChar = slideChar -1 slideBackward

slideForwardChar : WChar -> Model -> Model
slideForwardChar = slideChar 1 slideForward      

slideChar : Int -> (Model -> Model) -> WChar -> Model -> Model
slideChar direction slider wCh model =
    if wCh.id == "START" || wCh.id == "END" then model else
        if wCh.visible > 0 then {model | cursor <- ((fst model.cursor) + direction, wCh)} else slider model


canAnchor : WChar -> Bool
canAnchor ch =
    if ch.id == "START" || ch.id == "END" then True
        else ch.visible > 0



findWChar : (Model -> Model) -> Int -> Model -> WChar
findWChar slider goalIndex model = 
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        currVisible = currWChar.visible <= 0
    in
        if 
            | goalIndex == currIndex -> Debug.watch "anchor char " (if canAnchor currWChar then currWChar else (Debug.watch "SPECIALL" findWChar slider goalIndex (slider model)))
            | currIndex < goalIndex -> findWChar slideForward goalIndex (slideForward model)
            | currIndex > goalIndex -> findWChar slideBackward goalIndex (slideBackward model)




insertChar : Char -> Int -> Content -> Model -> Model
insertChar char predIndex content model =
    let
        predecessor = findWChar slideBackward predIndex model
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
            Just l -> insertChar (Debug.watch "ADDING" l) predIndex content model
            _ -> Debug.watch "BAD MODELLLLLL" model



deleted : Content -> Model -> Model
deleted content model = 
    let

        place = content.selection.start
        predecessor =(findWChar slideBackward (place - 1)  model)
        currWChar = findWChar slideForward place model
        d = currWChar.content
        deletedWChar = {currWChar | visible <- -1}
        newWChars = Dict.insert deletedWChar.id deletedWChar model.wChars

    in
        {model | wChars <- newWChars
                , cursor <- (place - 1, predecessor)
                , content <- content
                , buffer <- deletedWChar :: model.buffer
        }
