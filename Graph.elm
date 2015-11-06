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
        stringListFromInserted = List.drop (nextIndex) (toList  doc.str)
    in
        case stringListFromInserted of 
            x :: xs -> generateInsChar x prevIndex nextIndex doc model 
            _ -> (emptyModel, NoUpdate)
-- error case!



integrateInsert : WChar -> Model -> Model
integrateInsert wChar model =
    let
        wPrev = grabPrev wChar model.wString
        wNext = grabNext wChar model.wString
    in
        integrateInsert' wChar wPrev wNext (pos model.wString wPrev) model


-- - - - - - I N S E R T   I M P L E M E N T A T I O N - - - - - - - 


insertIntoList : WChar -> WString -> Int -> WString
insertIntoList wCh wStr pos =
    case wStr of
        x :: xs -> if pos == 0 
                then wCh :: x :: xs 
                else x :: insertIntoList wCh xs (pos - 1)
        [] -> [wCh]



intInsertChar : WChar -> Int -> Model -> Model
intInsertChar wCh pos model =
    let
        newWStr = insertIntoList wCh model.wString pos
        newStr = wToString newWStr
        newLen = String.length newStr
    in 
        {model | wString <- newWStr
                , doc <- {cp = 666, str = newStr, len = newLen}
        }


integrateInsert' : WChar -> WChar -> WChar -> Int -> Model -> Model 
integrateInsert' wCh pred succ pos model =
    let
        subStr = subSeq model.wString pred succ
        idOrderSubStr = pred :: (withoutPrecedenceOrdered subStr) ++ [succ]
        (newPred, newSucc) = findLaterWChar wCh idOrderSubStr
        
        debugModel =  {model | debug <- 
                                "IN RECURSIVE INSERT!!!" 
                                ++ "pred" ++ toString pred 
                                ++ ",   succ...." ++ toString  succ
                                ++  "sub str:  "  ++ toString subStr 
                                ++ "          idorder:    " ++ toString idOrderSubStr
                                ++ "new pred -> " ++ toString newPred
                                ++ "new Succ ->" ++ toString newSucc
                                }
    in 
        case subStr of
            [] -> intInsertChar wCh pos model
            x :: xs -> integrateInsert' wCh newPred newSucc pos debugModel





generateInsChar : Char -> Int -> Int -> Doc -> Model -> (Model, WUpdate)
generateInsChar char predIndex nextIndex doc model =
    let
        pred = ithVisible model.wString predIndex 
        succ = ithVisible model.wString nextIndex
        newId = (model.site, model.counter)
        newWChar = {id = newId
                    , ch = char
                    , prev = pred.id
                    , next = succ.id
                    , vis = 1}
        newModel = {model | counter <- model.counter + 1}  
        debugModel = {newModel | debug <- "newWchar" ++ toString newWChar
                                           ++ "   pred" ++ toString pred
                                           ++ "succ    " ++ toString succ}             
    in 
--        (debugModel , Insert newWChar)
        (integrateInsert' newWChar pred succ predIndex newModel , Insert newWChar)






withoutPrecedenceOrdered : WString -> List WChar
withoutPrecedenceOrdered wStr =
    let
        prevAbsent wC = not (List.any (\x -> x.id == wC.prev) wStr)
        nextAbsent wC = not (List.any (\x -> x.id == wC.next) wStr)
        prevAndNextAbsent wC = prevAbsent wC && nextAbsent wC
    in
        List.filter prevAndNextAbsent wStr



findLaterWChar : WChar -> WString -> (WChar, WChar)
findLaterWChar insCh wStr =
    case wStr of
        [] -> (startChar, endChar)
-- error case!
        x :: [] -> (startChar, endChar)
-- error case
        x :: y :: [] -> (x, y)
        x :: xs -> findLaterWChar insCh xs

--findLater' : WChar -> WString -> WChar -> (WChar -> WChar)
--findLater' insCh wStr prevCh =
--    case wStr of
--        [] -> (prevCh, endChar)
---- error case!!!
--        x :: [] -> (prevCh, x)
--        x :: xs -> if wIdOrder x insCh == GT 
--                    then (prevCh, x)
--                    else findLater' insCh xs x





--findLaterWChar : WChar -> WString -> (WChar, WChar)
--findLaterWChar addingWC lW =
--    case lW of
--        [] -> (addingWC, addingWC)
--        x :: [] -> (addingWC, addingWC)
--        x1 :: x2 :: [] -> (x1, x2)
--        x1 :: x2 :: xs -> if isLater x2 addingWC then (x1, x2) else  findLaterWChar addingWC (x2::xs)


--isLater : WChar -> WChar -> Bool
--isLater possLater compare =
--    let
--        (possSite, possClock) = possLater.id
--        (compSite, compClock) = compare.id
    
--    in 
--        possSite > compSite || (possSite == compSite && possClock > compClock)



-- - - - - - D E L E T E   A P I - - - - - - - 


generateDelete : Doc -> Model -> (Model, WUpdate)
generateDelete doc model = 
    let
        place = doc.cp  
        predecessor = ithVisible model.wString (place - 1)----== my problem
        successor = ithVisible model.wString (place + 1)
        currWChar = ithVisible model.wString (place)
        deletedWChar = {currWChar | vis <- -1}
        newModel = {model |
                debug <- "DELETING: "
                ++ String.fromChar currWChar.ch++ "thisIndex: " 
                ++ toString place ++ "pred :" ++ String.fromChar predecessor.ch 
                ++ "succ: " ++ String.fromChar successor.ch

                    }

    in
        (integrateDelete deletedWChar newModel, Delete deletedWChar)
       

integrateDelete : WChar -> Model -> Model
integrateDelete wChar model = 
    let
        newWString = setInvisible model.wString wChar.id
        newStr = wToString newWString
        newLen = String.length newStr
    in 
        {model | wString <- newWString
                , doc <- {cp = 666, str = newStr, len = newLen}
                }



--graphToString : Dict.Dict WId WChar -> String
--graphToString dict =
--    case Dict.get startId dict of
--        Just start -> graphToString' start dict
--        _ -> ""

--graphToString' : WChar -> Dict.Dict WId WChar-> String
--graphToString' wCh dict =
--    if 
--        | wCh.id == startId -> "" ++ graphToString' (grabNext wCh dict) dict
--        | wCh.id == endId -> ""
--        | wCh.vis <= 0 -> "" ++ graphToString' (grabNext wCh dict) dict
--        | otherwise -> String.fromChar wCh.ch ++ graphToString' (grabNext wCh dict) dict







