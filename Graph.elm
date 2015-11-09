module Graph where

import Model exposing (..)
import Dict 
import Debug
import String exposing (toList)
import List 
import Constants exposing (endChar, startChar, emptyModel, endId, startId)
import ConvertJson exposing (wUpdateToJson)
import Set
import Woot exposing (..)
import Graphics.Input.Field exposing (..)


-- - - - - - I N S E R T   A P I - - - - - - - 


-- only called when typing is local
generateInsert : Doc -> Model -> (Model, WUpdate)
generateInsert doc model = 
    let
        nextIndex = doc.cp - 1
        prevIndex = doc.cp - 2 
        stringListFromInserted = List.drop (nextIndex) (toList  doc.str)
        newCPModel = {model | doc<-doc}
    in
        case stringListFromInserted of 
            x :: xs -> generateInsChar x prevIndex nextIndex doc newCPModel
            _ -> (newCPModel, NoUpdate)
-- error case!


-- only called when typing is remote
integrateRemoteInsert : WChar -> Model -> (Model, WUpdate)
integrateRemoteInsert wChar model =
    let
        wPrev = grabPrev wChar model.wString
        wNext = grabNext wChar model.wString
        insertPos = pos model.wString wNext
        currCP = model.doc.cp
        newCP = if currCP > insertPos then currCP + 1 else currCP
        newCPModel =  {model | doc <- updateCP model.doc newCP}
        newModel = integrateInsert' wChar wPrev wNext insertPos newCPModel
--       
    in
        (newModel, Caret newModel.doc.cp)

        


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
                , debug <- model.debug ++ "TO STRING OF THE LIST -> " ++ toString newWStr
                    ++ "   pos is   " ++ toString pos
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
        newModel = {model | counter <- model.counter + 1
                            , doc <- doc}  
        debugModel = {newModel | debug <- "newWchar" ++ toString newWChar
                                           ++ "   pred" ++ toString pred
                                           ++ "succ    " ++ toString succ
                                            ++ "   pred index:   " ++ toString predIndex
                                            ++ "    next Index   " ++ toString nextIndex} 

    in 
        (integrateInsert' newWChar pred succ nextIndex debugModel , Insert newWChar)




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


generateDelete : Doc -> Model -> (Model, WUpdate)
generateDelete doc model = 
    let
        place = doc.cp  
        predecessor = ithVisible model.wString (place - 1)----== my problem
        successor = ithVisible model.wString (place + 1)

        currWChar = ithVisible model.wString (place)

        deletedWChar = {currWChar | vis <- -1}


        newModel = {model |
                doc <- doc
                , debug <- "DELETING: "
                ++ String.fromChar currWChar.ch++ "thisIndex: " 
                ++ toString place ++ "pred :" ++ String.fromChar predecessor.ch 
                ++ "succ: " ++ String.fromChar successor.ch
                }
    in
        (integrateDelete deletedWChar newModel, Delete deletedWChar)
       

integrateRemoteDelete : WChar -> Model -> (Model, WUpdate)
integrateRemoteDelete wChar model =
    let 
        currCP = model.doc.cp
        deletePos = pos model.wString wChar
        newCP = if currCP > deletePos then currCP - 1 else currCP
        newDocModel =  {model | doc <- (updateCP model.doc newCP)}
        newModel = integrateDelete wChar newDocModel

    in 
        (newModel, Caret newModel.doc.cp)


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
