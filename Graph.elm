module Graph where

import Model exposing (..)
import Dict 
import Debug
import String exposing (toList)
import List 
import Constants exposing (endChar, startChar, emptyModel, endId, startId)
import ConvertJson exposing (wUpdateToJson)

import Woot exposing (..)

import Graphics.Input.Field exposing (..)



--canAnchor : WChar -> Bool
--canAnchor wCh = 
--    if 
--        | wCh.id == startId || wCh.id == endId -> True
--        | otherwise -> wCh.vis > 0 



--slideForward : Bool -> Model -> Model
--slideForward  = slidie 1 grabNext 


--slideBackward : Bool -> Model -> Model
--slideBackward  = slidie -1 grabPrev 


--slidie : Int -> (WChar -> Dict.Dict WId WChar -> WChar) -> Bool -> Model -> Model
--slidie dir grabber toIncrement model =
--    let
--        currIndex = fst model.cursor
--        currWChar = snd model.cursor
--        newIndex = if toIncrement then currIndex + dir else currIndex
--        newChar = grabber currWChar model.wChars
--    in
--        {model | cursor <- (newIndex, newChar)} 


--findWChar : (Bool -> Model -> Model) -> Int -> Model -> WChar
--findWChar slider goalIndex model = 
--    let
--        currIndex = fst model.cursor
--        currWChar = snd model.cursor
--        toIncrement = canAnchor currWChar
--    in
--        if 
--            | goalIndex == currIndex -> 
--                if canAnchor currWChar 
--                    then currWChar
--                        else findWChar slider goalIndex (slider toIncrement model)
--            | currIndex < goalIndex -> findWChar slider goalIndex (slideForward toIncrement model)
--            | currIndex > goalIndex ->  findWChar slider goalIndex (slideBackward toIncrement model)



-- a -1 
generateInsChar : Char -> Int -> Int -> Doc -> Model -> (Model, WUpdate)
generateInsChar char predIndex nextIndex doc model =
    let
        pred = ithVisible model.wChars predIndex 
        succ = grabNext pred model.wChars
        newId = (model.site, model.counter)
        newWChar = {id = newId
                    , ch = char
                    , prev = pred.id
                    , next = succ.id
                    , vis = 1}
        newModel = {model | counter <- model.counter + 1
                    , doc <- doc}
--                   , debug <- "nextIndex:" ++ toString nextIndex
--                        ++ "predIndex: " ++ toString predIndex 
--                        ++ "pred :" 
--                        ++ toString pred.id ++ "next: " ++ toString succ.id
--                        ++ "CH --" ++ String.fromChar newWChar.ch
--                    }
--                        , buffer <-  Insert newWChar ::model.buffer
--                        , docBuffer <- doc:: model.docBuffer                 
    in 
--        ({emptyModel | debug <- "prev: " ++ String.fromChar pred.ch ++ ", succ: " ++ String.fromChar succ.ch}, Insert newWChar)
        (integrateInsert newWChar newModel True, Insert newWChar)



--cursorUpdateServer : WChar -> Dict.Dict WId WChar -> (Int, WChar) -> (Int, WChar)
--cursorUpdateServer addedWCh dict cursor =
--    let 
--        currIndex = fst cursor
--        currWChar = snd cursor
--        addedPrev = grabPrev addedWCh dict
--    in
--        if addedPrev.id == currWChar.id then (currIndex, addedWCh)
--            else if shouldBumpCursor addedWCh currWChar dict then (currIndex + 1, currWChar)
--                else cursor


--shouldBumpCursor : WChar -> WChar -> Dict.Dict WId WChar -> Bool
--shouldBumpCursor  addedWCh cursorWCh dict = shouldBumpCursor' (grabNext startChar dict) addedWCh cursorWCh dict



--shouldBumpCursor' : WChar -> WChar -> WChar -> Dict.Dict WId WChar-> Bool
--shouldBumpCursor' currWCh addedWCh cursorWCh dict =
--    if
--        |currWCh.id == addedWCh.id -> True
--        |currWCh.id == cursorWCh.id -> False
--        |currWCh.id == endId -> True
--        |otherwise -> shouldBumpCursor' (grabNext currWCh dict) addedWCh currWCh dict


findLaterWChar : WChar -> List WChar -> (WChar, WChar)
findLaterWChar addingWC lW =
    case lW of
        [] -> (addingWC, addingWC)
        x :: [] -> (addingWC, addingWC)
-- TO DO deal with these ^^^ cases, which should never happen
        x1 :: x2 :: [] -> (x1, x2)
        x1 :: x2 :: xs -> if isLater x2 addingWC then (x1, x2) else  findLaterWChar addingWC (x2::xs)


isLater : WChar -> WChar -> Bool
isLater possLater compare =
    let
        (possSite, possClock) = possLater.id
        (compSite, compClock) = compare.id
    
    in 
        possSite > compSite || (possSite == compSite && possClock > compClock)


--getIdPair : WChar -> (Int, Int)
--getIdPair wCh =
--    let
--        wChIdList = String.split "-" wCh.id
--        siteStr = case List.head wChIdList of
--                    Just ps -> ps
--                    _ -> "666"
--        clockStr = case List.head (List.tail wChIdList) of
--                    Just ps -> ps 
--                    _ -> "666"
--        siteId = case String.toInt siteStr of
--                    Ok id -> id
--                    Err e -> 666
--        clockId = case String.toInt clockStr of
--                    Ok id -> id
--                    Err e -> 666
--    in 
--        (siteId, clockId)


intInsertChar : WChar -> WChar -> WChar -> Model -> Model
intInsertChar wCh prev next model =
    let
        newPred = {prev | next <- wCh.id}
        newSucc = {next | prev <- wCh.id}
        newDict = Dict.insert newPred.id newPred model.wChars
                    |> Dict.insert newSucc.id newSucc
                    |> Dict.insert wCh.id wCh
        newStr = graphToString newDict
        newLen = String.length newStr
    in 
        {model | wChars <- newDict
                , doc <- {cp = 666, str = newStr, len = newLen}
        }




--findEarlierWChar : WChar -> WChar -> WChar -> Dict.Dict String WChar -> (WChar, WChar)
--findEarlierWChar addingWC lIMinus1 lI dict =-




intInsert : WChar -> WChar -> WChar -> Model -> Model 
intInsert wCh pred succ model =
    let
--        pred = grabPrev wCh model.wChars
--        succ = grabNext wCh model.wChars
        subStr = subSeq model.wChars pred succ
        idOrderSubStr = pred :: (removePrecedenceOrdered subStr) ++ [succ]
        (newPred, newSucc) = findLaterWChar wCh idOrderSubStr
    in 
        if Dict.isEmpty subStr then intInsertChar wCh pred succ model else intInsert wCh newPred newSucc model

            -- find the first element in the list with a higher id than our wCHar.
            -- then call this function with (c, l[i-1], l[i])
 





removePrecedenceOrdered : Dict.Dict WId WChar -> List WChar
removePrecedenceOrdered dict =
    let
        prevAndNextAbsent wC = not (Dict.member wC.prev dict) && not (Dict.member wC.next dict)
        includeAbsent = (\wCh wChList -> if prevAndNextAbsent wCh then  wCh::wChList else wChList)

    in
        List.foldl includeAbsent [] (Dict.values dict)
--                |> Dict.fromList




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
    in 
        {model | wChars <- newDict
                , doc <- {cp = 666, str = newStr, len = newLen}
        }


generateIns : Doc -> Model -> (Model, WUpdate)
generateIns doc model = 
    let
        nextIndex = doc.cp - 1
        prevIndex = doc.cp - 2 
        letter = List.head (List.drop (nextIndex) (toList  doc.str))

    in
        case letter of 
            Just l -> generateInsChar l prevIndex nextIndex doc model 
            _ -> (emptyModel , NoUpdate)



generateDelete : Doc -> Model -> (Model, WUpdate)
generateDelete doc model = 
    let
        place = doc.cp  
        predecessor = ithVisible model.wChars (place - 1)----== my problem
        successor = ithVisible model.wChars (place + 1)
        currWChar = ithVisible model.wChars (place)
        deletedWChar = {currWChar | vis <- -1}
        newModel = {model |
                debug <- "DELETING: "
                ++ String.fromChar currWChar.ch++ "thisIndex: " 
                ++ toString place ++ "pred :" ++ String.fromChar predecessor.ch 
                ++ "succ: " ++ String.fromChar successor.ch

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
                , doc <- {cp = 666, str = newStr, len = newLen}


                }


graphToString : Dict.Dict WId WChar -> String
graphToString dict =
    case Dict.get startId dict of
        Just start -> graphToString' start dict
        _ -> ""

graphToString' : WChar -> Dict.Dict WId WChar-> String
graphToString' wCh dict =
    if 
        | wCh.id == startId -> "" ++ graphToString' (grabNext wCh dict) dict
        | wCh.id == endId -> ""
        | wCh.vis <= 0 -> "" ++ graphToString' (grabNext wCh dict) dict
        | otherwise -> String.fromChar wCh.ch ++ graphToString' (grabNext wCh dict) dict







