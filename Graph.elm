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


-- - - - - - I N S E R T   A P I - - - - - - - 



generateInsert : Doc -> Model -> (Model, WUpdate)
generateInsert doc model = 
    let
        nextIndex = doc.cp - 1
        prevIndex = doc.cp - 2 
        letter = List.head (List.drop (nextIndex) (toList  doc.str))

    in
        case letter of 
            Just l -> generateInsChar l prevIndex nextIndex doc model 
            _ -> (emptyModel , NoUpdate)



integrateInsert : WChar -> Model -> Model
integrateInsert wChar model =
    case Dict.get wChar.next model.wChars of
        Just next -> 
            case Dict.get wChar.prev model.wChars of
                Just prev ->  integrateInsert' wChar prev next model
                _ -> {model | debug <- "Dont have necessary prev and next to add"}
        _ -> {model | debug <- "Dont have necessary prev and next to add"  }


integrateInsert' : WChar -> WChar -> WChar -> Model -> Model 
integrateInsert' wCh pred succ model =
    let
        subStr = subSeq model.wChars pred succ
        idOrderSubStr = pred :: (withoutPrecedenceOrdered subStr) ++ [succ]
        (newPred, newSucc) = findLaterWChar wCh idOrderSubStr
        debugModel =  {model | debug <-
                             "sub str:  " 
                            ++ toString subStr 
                            ++ "          idorder:    " ++ toString idOrderSubStr
                                }
    in 
        if Dict.isEmpty subStr then intInsertChar wCh pred succ model else integrateInsert' wCh newPred newSucc model


-- - - - - - I N S E R T   I M P L E M E N T A T I O N - - - - - - - 



generateInsChar : Char -> Int -> Int -> Doc -> Model -> (Model, WUpdate)
generateInsChar char predIndex nextIndex doc model =
    let
        pred = ithVisible model.wChars predIndex 
        succ = ithVisible model.wChars nextIndex
        newId = (model.site, model.counter)
        newWChar = {id = newId
                    , ch = char
                    , prev = pred.id
                    , next = succ.id
                    , vis = 1}
        newModel = {model | counter <- model.counter + 1}                
    in 
        (integrateInsert' newWChar pred succ newModel , Insert newWChar)


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


withoutPrecedenceOrdered : Dict.Dict WId WChar -> List WChar
withoutPrecedenceOrdered dict =
    let
        prevAndNextAbsent wC = not (Dict.member wC.prev dict) && not (Dict.member wC.next dict)
        includeAbsent = (\wCh wChList -> if prevAndNextAbsent wCh then  wCh::wChList else wChList)

    in
        List.foldl includeAbsent [] (Dict.values dict)


findLaterWChar : WChar -> List WChar -> (WChar, WChar)
findLaterWChar addingWC lW =
    case lW of
        [] -> (addingWC, addingWC)
        x :: [] -> (addingWC, addingWC)
        x1 :: x2 :: [] -> (x1, x2)
        x1 :: x2 :: xs -> if isLater x2 addingWC then (x1, x2) else  findLaterWChar addingWC (x2::xs)


isLater : WChar -> WChar -> Bool
isLater possLater compare =
    let
        (possSite, possClock) = possLater.id
        (compSite, compClock) = compare.id
    
    in 
        possSite > compSite || (possSite == compSite && possClock > compClock)



-- - - - - - D E L E T E   A P I - - - - - - - 


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
        (integrateDelete deletedWChar newModel, Delete deletedWChar)
       

integrateDelete : WChar -> Model -> Model
integrateDelete wChar model = 
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







