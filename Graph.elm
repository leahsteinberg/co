module Graph where

import Model exposing (..)
import Dict 
import Debug
import String exposing (toList, fromChar)
import List 
import Constants exposing (endChar, startChar, emptyModel, endId, startId)
import ConvertJson exposing (wUpdateToJson)
import Set
import Woot exposing (..)
import Graphics.Input.Field exposing (..)


-- - - - - - I N S E R T   A P I - - - - - - - 


-- only called when TUpdate is local
generateInsert : Char -> Int -> Model -> (Model, Edit)
generateInsert ch place model = 
    let
         debugModel = {model | debug <- "ch is  " ++ fromChar ch ++ "   place is   " ++ toString place}
    in
        generateInsChar ch (place - 2) (place - 1) {debugModel | doc <- updateCP model.doc place }
-- error case!


-- only called when TUpdate is remote
--- todod!!! this is an 
integrateRemoteInsert : WChar -> Model -> (Model, Edit)
integrateRemoteInsert wChar model =
    let
        wPrev = grabPrev wChar model.wString
        wNext = grabNext wChar model.wString
        insertPos = pos model.wString wNext
--- should prev line have wprev or wNext
        currCP = model.doc.cp
        newCP = if currCP > insertPos then currCP + 1 else currCP
        newCPModel =  {model | doc <- updateCP model.doc newCP}
        newModel = integrateInsert' wChar wPrev wNext insertPos newCPModel
    in
        (newModel, T (I wChar.ch insertPos))


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
                , wSeen <- Set.insert wCh.id model.wSeen
--                , debug <- model.debug ++ "TO STRING OF THE LIST -> " ++ toString newWStr
--                    ++ "   pos is   " ++ toString pos
                , doc <- updateStrAndLen model.doc newStr newLen
        }


integrateInsert' : WChar -> WChar -> WChar -> Int -> Model -> Model 
integrateInsert' wCh pred succ pos model =
    let
        subStr = subSeq model.wString pred succ
        idOrderSubStr = pred :: (withoutPrecedenceOrdered subStr) ++ [succ]
        (newPred, newSucc) = findLaterWChar wCh idOrderSubStr
    in 
        case subStr of
            [] -> intInsertChar wCh pos model
            x :: xs -> integrateInsert' wCh newPred newSucc pos model


generateInsChar : Char -> Int -> Int -> Model -> (Model, Edit)
generateInsChar char predIndex nextIndex model =
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
                                           ++ "succ    " ++ toString succ
                                            ++ "   pred index:   " ++ toString predIndex
                                            ++ "    next Index   " ++ toString nextIndex} 

    in 
        (integrateInsert' newWChar pred succ nextIndex debugModel , W (Insert newWChar))




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


-- - - - - - D E L E T E   A P I - - - - - - - 


generateDelete : Char -> Int -> Model -> (Model, Edit)
generateDelete ch place model = 
    let
        predecessor = ithVisible model.wString (place - 1)----== my problem
        successor = ithVisible model.wString (place + 1)

        currWChar = ithVisible model.wString (place)

        deletedWChar = {currWChar | vis <- -1}

        newModel = {model |
                doc <- updateCP model.doc place
                , debug <- "CHAR deleteing is -- " ++ fromChar ch

                ++ "    DELETING: "
                ++ String.fromChar currWChar.ch ++ "/thisIndex: " 
                ++ toString place ++ "/pred :" ++ String.fromChar predecessor.ch 
                ++ "/succ: " ++ String.fromChar successor.ch
                ++ "/place: " ++ toString place
                }
    in
        (integrateDelete deletedWChar newModel,  W (Delete deletedWChar))
       

integrateRemoteDelete : WChar -> Model -> (Model, Edit)
integrateRemoteDelete wChar model =
    let 
        currCP = model.doc.cp
        deletePos = pos model.wString wChar
        newCP = if currCP > deletePos then currCP - 1 else currCP
        newDocModel =  {model | doc <- (updateCP model.doc newCP)
                    , debug <- "deleting" ++ fromChar wChar.ch ++ " at " ++ toString deletePos}
        newModel = integrateDelete wChar newDocModel

    in 
        (newModel, T (D wChar.ch deletePos))


integrateDelete : WChar -> Model -> Model
integrateDelete wChar model = 
    let
        newWString = setInvisible model.wString wChar.id
        newStr = wToString newWString
        newLen = String.length newStr
    in 
        {model | wString <- newWString
                }


-- - -- -  - - - - - - - - - - - - - - - - - - - - 


updateCP : Doc -> Int -> Doc
updateCP doc cp =
    {doc | cp <- cp}    


updateStrAndLen : Doc -> String -> Int -> Doc
updateStrAndLen doc str len =
    {doc | str <- str, len <- len}
