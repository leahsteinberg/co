module Graph where

import Model exposing (..)
import Dict 
import Debug
import String exposing (toList)
import List 
import Constants exposing (endChar, startChar, emptyModel)
import ConvertJson exposing (wUpdateToJson)

import Woot exposing (..)

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
generateInsChar : Char -> Int -> Doc -> Model -> (Model, WUpdate)
generateInsChar char predIndex doc model =
    let
        pred = findWChar slideForward predIndex model
        succ = grabNext pred model.wChars
        newId = toString model.site ++ "-" ++ toString model.counter
        newWChar = {id = newId
                    , ch = char
                    , prev = pred.id
                    , next = succ.id
                    , vis = 1}
        newModel = {model | counter <- model.counter + 1
                                , doc <- doc
                    , debug <- "cursor at:" ++ toString (fst model.cursor) 
                        ++ "predIndex: " ++ toString predIndex 
                        ++ "pred :" 
                        ++ String.fromChar pred.ch ++ "succlol: " ++ String.fromChar succ.ch
                        , buffer <-  Insert newWChar ::model.buffer
                        , docBuffer <- doc:: model.docBuffer


                            }
    in 
        (integrateInsert newWChar newModel True, Insert newWChar)



cursorUpdateServer : WChar -> Dict.Dict String WChar -> (Int, WChar) -> (Int, WChar)
cursorUpdateServer addedWCh dict cursor =
    let 
        currIndex = fst cursor
        currWChar = snd cursor
        addedPrev = grabPrev addedWCh dict
    in
        if addedPrev.id == currWChar.id then (currIndex, addedWCh)
            else if shouldBumpCursor addedWCh currWChar dict then (currIndex + 1, currWChar)
                else cursor


shouldBumpCursor : WChar -> WChar -> Dict.Dict String WChar -> Bool
shouldBumpCursor  addedWCh cursorWCh dict = shouldBumpCursor' (grabNext startChar dict) addedWCh cursorWCh dict



shouldBumpCursor' : WChar -> WChar -> WChar -> Dict.Dict String WChar-> Bool
shouldBumpCursor' currWCh addedWCh cursorWCh dict =
    if
        |currWCh.id == addedWCh.id -> True
        |currWCh.id == cursorWCh.id -> False
        |currWCh.id == "END" -> True
        |otherwise -> shouldBumpCursor' (grabNext currWCh dict) addedWCh currWCh dict


integrateInsert : WChar -> Model -> Bool -> Model
integrateInsert wCh model local = 
    let
        pred = grabPrev wCh model.wChars
        succ = grabNext wCh model.wChars
        newPred = {pred | next <- wCh.id}
        newSucc = {succ | prev <- wCh.id}
        newDict = Dict.insert newPred.id newPred model.wChars
                    |> Dict.insert newSucc.id newSucc
                    |> Dict.insert wCh.id wCh
        newStr = graphToString newDict
        newLen = String.length newStr
        newCursor = if local then ((fst model.cursor) + 1, newSucc) else cursorUpdateServer wCh newDict model.cursor
--                            if shouldBumpCursor wCh (snd model.cursor) newDict then ((fst model.cursor) + 1, snd model.cursor)
--                                    else model.cursor
        newDoc  = {cp = fst newCursor, str = newStr, len = newLen}
        -- need to find the index of this new wChar. Need to update the cursor appropriately.
        -- lets make a naive solution!!!

    in 
        {model | wChars <- newDict
            , cursor <- newCursor
            , doc <- newDoc
            , docBuffer <- newDoc :: model.docBuffer

        }


generateIns : Doc -> Model -> (Model, WUpdate)
generateIns doc model = 
    let
        place = doc.cp - 1
        predIndex = place - 1
        letter = List.head (List.drop place (toList  doc.str))

    in
        case letter of 
            Just l -> generateInsChar l predIndex doc model 
            _ -> ({emptyModel | debug <- "cant find the letter in the list"}, NoUpdate)



generateDelete : Doc -> Model -> (Model, WUpdate)
generateDelete doc model = 
    let
        place = doc.cp 
        predecessor = (findWChar slideForward (place - 1) model) ----== my problem
        successor = findWChar slideForward (place + 1) model
        currWChar = findWChar slideForward place model
        deletedWChar = {currWChar | vis <- -1}
        oldCursor = model.cursor
        oldIndex = fst model.cursor
        oldCurr = snd model.cursor
        newModel = {model | cursor <- (oldIndex - 1, successor)
                , doc <- doc
                , debug <- "DELETING: "++ String.fromChar currWChar.ch++"cursor at:" ++ toString (fst model.cursor) ++ "thisIndex: " ++ toString place ++ "pred :" ++ String.fromChar predecessor.ch ++ "succhahah: " ++ String.fromChar successor.ch
                , buffer <- (Delete deletedWChar):: model.buffer 
                , docBuffer <- doc:: model.docBuffer

                    }
--        newWChars = Dict.insert deletedWChar.id deletedWChar model.wChars
--        oldDoc = model.doc
--        newDoc = {oldDoc | str <- String.fromChar deletedWChar.ch}

    in
        (integrateDel deletedWChar newModel, Delete deletedWChar)
       


--        {model | wChars <- newWChars
--                , cursor <- (place - 1, predecessor)
--                , buffer <- deletedWChar :: model.buffer
--                , doc <- doc
--                , debug <- "pred: " ++ String.fromChar pred.ch ++ "succ: "
--        }


integrateDel : WChar -> Model -> Model
integrateDel wChar model = 
    let
        newWChars = Dict.insert wChar.id wChar model.wChars
        newStr = graphToString newWChars
        newLen = String.length newStr
    in 
        {model | wChars <- newWChars
                , doc <- {cp = fst model.cursor, str = newStr, len = newLen}


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







