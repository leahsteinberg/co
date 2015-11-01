module Graph where

import Model exposing (..)
import Dict 
import Debug
import String exposing (toList)
import List 
import Constants exposing (endChar, startChar, emptyModel)



import Graphics.Input.Field exposing (..)


--slideBackward = slide (\wc -> wc.prev) slideBackwardChar

--slideForward : Bool -> Model -> Model
--slideForward model =  slideForwardChar model

--slideBackward : Model -> Model
--slideBackward model = slide (\wc -> wc.prev) slideBackwardChar model

--slideBackward model = 
--    let
--        currIndex = fst model.cursor
--        currWChar = snd model.cursor
--        mPrevWChar = Dict.get currWChar.prev model.wChars
--    in 
--        case mPrevWChar of
--            Just prevWChar -> slideBackwardChar prevWChar model
--            _ -> model

--slide : (WChar -> String) -> (WChar -> Model-> Model) -> Model -> Model
--slide grabNeighbor slideChar model =
--    let
--        currIndex = fst model.cursor
--        currWChar = snd model.cursor
--        mNeighborWChar = Dict.get (grabNeighbor currWChar) model.wChars
--    in 
--        case mNeighborWChar of
--            Just neighborWChar ->  slideChar neighborWChar model
--            _ -> model
        
--slideBackwardChar : WChar -> Model -> Model
--slideBackwardChar = slideChar -1 slideBackward

--slideForwardChar : WChar -> Model -> Model
--slideForwardChar = slideChar 1 slideForward      

--slideChar : Bool -> Int -> (Model -> Model) -> WChar -> Model -> Model
--slideChar toIncrement direction slider wCh model =
--    if toIncrement 
--        then {model | cursor <- ((fst model.cursor) + direction, wCh)} 
--        else slider {model | cursor <- ((fst model.cursor), wCh)} 
--        if wCh.visible > 0 || wCh.id == "START" || wCh.id == "END"then {model | cursor <- ((fst model.cursor) + direction, wCh)} else slider {model | cursor <- ((fst model.cursor), wCh)} 


canAnchor : WChar -> Bool
canAnchor wCh = 
    if 
        | wCh.id == "START" || wCh.id == "END" -> True
        | otherwise -> wCh.vis > 0 

grabNext : WChar -> Dict.Dict String WChar  -> WChar
grabNext wCh dict =
    case Dict.get wCh.next dict of
        Just next -> next
        _ -> endChar

grabPrev : WChar -> Dict.Dict String WChar ->  WChar
grabPrev wCh dict=
    case Dict.get wCh.prev dict of
        Just prev -> prev
        _ -> startChar

slideForward : Bool -> Model -> Model
slideForward  = slidie 1 grabNext 


slideBackward : Bool -> Model -> Model
slideBackward  = slidie -1 grabPrev 


slidie : Int -> (WChar -> Dict.Dict String WChar -> WChar) -> Bool -> Model -> Model
slidie dir grabber toIncrement model =
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        newIndex = if toIncrement then currIndex + dir else currIndex
        newChar = grabber currWChar model.wChars
    in
        {model | cursor <- (newIndex, newChar)} 


findWChar : (Bool -> Model -> Model) -> Int -> Model -> WChar
findWChar slider goalIndex model = 
    let
        currIndex = fst model.cursor
        currWChar = snd model.cursor
        toIncrement = canAnchor currWChar
    in
        if 
            | goalIndex == currIndex -> 
                if canAnchor currWChar 
                    then currWChar
                        else findWChar slider goalIndex (slider toIncrement model)
            | currIndex < goalIndex -> findWChar slider goalIndex (slideForward toIncrement model)
            | currIndex > goalIndex ->  findWChar slider goalIndex (slideBackward toIncrement model)



-- a -1 
insertChar : Char -> Int -> Doc -> Model -> Model
insertChar char predIndex doc model =
    let
--        pred = startChar
        pred = findWChar slideBackward predIndex model
        succ = grabNext pred model.wChars
        newId = toString model.site ++ "-" ++ toString model.counter
        newWChar = {id = newId
                    , ch = char
                    , prev = pred.id
                    , next = succ.id
                    , vis = 1}
        newPred = {pred | next <- newWChar.id}
        newSucc = {succ | prev <- newWChar.id}
--        newDict = Dict.empty
--        newDict = model.wChars
        newDict = Dict.insert newId newWChar (Dict.insert newSucc.id newSucc (Dict.insert newPred.id newPred model.wChars))
    in 
--        {emptyModel | doc <- {cp = predIndex
--                                , str = String.fromChar pred.ch ++ "--" ++String.fromChar succ.ch
--                               , len = 5000}}
        { model | counter <- model.counter + 1
                , wChars <- newDict
                , cursor <- (predIndex + 2, newSucc)
               , buffer <- newWChar :: model.buffer
                , doc <- doc}



inserted1 : Doc -> Model -> Model
inserted1 doc model = 
    let
        place = doc.cp - 1
        predIndex = place - 1
--        letter = slice place (place + 1) 
        letter = List.head (List.drop place (toList  doc.str))

    in
        case letter of 
            Just l -> insertChar l predIndex doc model 
--- for the first theres a at 0. so predIndex is -1
            _ -> emptyModel



deleted1 : Doc -> Model -> Model
deleted1 doc model = 
    let

        place = doc.cp 
        predecessor = (findWChar slideForward (place - 1)  model) ----== my problem
        currWChar = findWChar slideForward place model
        deletedWChar = {currWChar | vis <- -1}
        newWChars = Dict.insert deletedWChar.id deletedWChar model.wChars
        oldDoc = model.doc
        newDoc = {oldDoc | str <- String.fromChar deletedWChar.ch}

    in
        {model | wChars <- newWChars
                , cursor <- (place - 1, predecessor)
                , buffer <- deletedWChar :: model.buffer
                , doc <- doc
        }



graphToString : Dict.Dict String WChar -> String
graphToString dict =
    case Dict.get "START" dict of
        Just start -> graphToString' start dict
        _ -> ""

graphToString' : WChar -> Dict.Dict String WChar-> String
graphToString' wCh dict =
    if 
        | wCh.id == "START" -> "" ++ graphToString' (grabNext wCh dict) dict
        | wCh.id == "END" -> ""
        | wCh.vis <= 0 -> "" ++ graphToString' (grabNext wCh dict) dict
        | otherwise -> String.fromChar wCh.ch ++ graphToString' (grabNext wCh dict) dict







