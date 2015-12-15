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
         debugModel = {model| debug = model.debug}-- ++ "~~~" ++ toString place ++ "~~~~" ++ "||||" ++ wToString model.wString ++ "|||"}
    in
        generateInsChar ch (place - 1) (place ) {debugModel | doc = updateCP model.doc place }
-- error case!

integrateRemoteInsert : WChar -> Model -> (Model, Edit)
integrateRemoteInsert wChar model =
    let
        next = grabNext wChar model.wString

        insertPos = pos model.wString next
        --- should prev line have wprev or wNext

        prev = grabPrev wChar model.wString

        currCP = model.doc.cp
        newCP = if currCP > insertPos then currCP + 1 else currCP
        newCPModel =  {model | doc = updateCP model.doc newCP}


        newModel = integrateInsert' wChar prev next insertPos newCPModel
        debugModel = {newModel | debug = newModel.debug ++ "integrating: " ++ toString wChar ++ "site is: " ++ toString model.site ++ "next is" ++ toString next.ch ++ "prev is " ++ toString prev.ch}
    in
        if wChar.ch == 'l' then (debugModel, T (I wChar.ch insertPos (fst wChar.id))) else 
        (newModel, T (I wChar.ch insertPos (fst wChar.id)))


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
        {model | wString = newWStr
                , wSeen = Set.insert wCh.id model.wSeen
                , doc = updateStrAndLen model.doc newStr newLen
        }


integrateInsert' : WChar -> WChar -> WChar -> Int -> Model -> Model 
integrateInsert' wCh pred succ posi model =
    let
        subStr = subSeq  (startChar :: model.wString ++ [endChar])  pred succ
        idOrderSubStr = pred :: (withoutPrecedenceOrdered subStr) ++ [succ]
        (newPred, newSucc) = findLaterWChar wCh idOrderSubStr
    in 
        case subStr of
            [] -> 
              let 
                    newModel = intInsertChar wCh (pos model.wString succ ) model
                    debugModel = {newModel | debug = newModel.debug 
                                            ++ "     MODEL BEFORE " ++ wToString model.wString
                                            ++ "     //integrating " ++ toString wCh.ch  
                                            ++ "     site" ++ toString model.site
                                            ++ "     pred - " ++ toString pred 
                                            ++ "     succ  - " ++ toString succ
                                            ++ "     subStr - " ++ toString subStr 
                                            ++ "     newPred - " ++ toString newPred 
                                            ++ "     new Succ  - "  ++ toString newSucc}

              in 
                    if wCh.ch == 'l' then debugModel else 
                    newModel
            x :: xs -> 
                let
                    debugModel = {model | debug = model.debug 
                                            ++ "integrating WITH STUFF " ++ toString wCh.ch  
                                            ++ "      site" ++ toString model.site
                                            ++ "      pred - " ++ toString pred 
                                            ++ "      succ  - " ++ toString succ
                                            ++ "      subStr - " ++ toString subStr 
                                            ++ "      id ordered " ++ toString idOrderSubStr
                                            ++ "      newPred - " ++ toString newPred 
                                            ++ "      new Succ  - "  ++ toString newSucc}
                in

                    if wCh.ch == 'l' then integrateInsert' wCh newPred newSucc posi debugModel else 


                    integrateInsert' wCh newPred newSucc posi model
--                  {newModel | debug = newModel.debug ++ "inserting: " ++ toString wCh.ch ++ "// " ++ "  newPred::  " ++ toString newPred.ch ++ "   NewSuc:: " ++ toString newSucc.ch}


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
        newModel = {model | counter = model.counter + 1}  --- at this point ! we arlready have a problem witht he 
        debugModel = {newModel | debug = "SITE IS:" ++  toString newModel.site ++ newModel.debug ++ "PRED INDEX IS: " ++ toString predIndex ++"((((((newWchar" ++ toString newWChar
                                           ++ "   pred" ++ toString pred.ch
                                           ++ " w stirng is === " ++ toString model.wString
                                          -- ++ "succ    " ++ toString succ
                                         --   ++ "   pred index:   " ++ toString predIndex
                                         --   ++ "    next Index   " ++ toString nextIndex ++ "))))))"
                                    } 

    in 
        --if char == 't' then 
        --(integrateInsert' newWChar pred succ nextIndex debugModel , W (Insert newWChar)) else 
            (integrateInsert' newWChar pred succ nextIndex newModel , W (Insert newWChar))




withoutPrecedenceOrdered : WString -> List WChar
withoutPrecedenceOrdered wStr =
    let
        prevAbsent wC = not (List.any (\x -> x.id == wC.prev) wStr)
        nextAbsent wC = not (List.any (\x -> x.id == wC.next) wStr)
        prevAndNextAbsent wC = prevAbsent wC && nextAbsent wC
    in
        List.filter prevAndNextAbsent wStr


-- the second in the pair is the thing that is a "greater" wChar..
findLaterWChar : WChar -> WString -> (WChar, WChar)
findLaterWChar insCh wStr = 
    case wStr of
        [] -> Debug.crash "empty list"
-- error case!
        x :: [] -> Debug.crash "one element in list"
-- error case
        x :: y :: [] -> --(x, y)
            if x `isLaterWChar` insCh then (startChar, x)
            else if y `isLaterWChar` insCh then (x, y)
                else (x, y) --- TODO this used to be (y, endChar)!!!!

        x :: y :: xs -> 
          if y `isLaterWChar` insCh then
              (x, y)
          else
              findLaterWChar insCh (y::xs)


-- - - - - - D E L E T E   A P I - - - - - - - 


generateDelete : Char -> Int -> Model -> (Model, Edit)
generateDelete ch place model = 
    let
        predecessor = ithVisible model.wString (place - 1)----== my problem
        successor = ithVisible model.wString (place + 1)

        currWChar = ithVisible model.wString (place)

        deletedWChar = {currWChar | vis = -1}

        newModel = {model |
                doc = updateCP model.doc place
                --, debug = "CHAR deleteing is -- " ++ fromChar ch
                --++ "    DELETING: "
                --++ String.fromChar currWChar.ch ++ "/thisIndex: " 
                --++ toString place ++ "/pred :" ++ String.fromChar predecessor.ch 
                --++ "/succ: " ++ String.fromChar successor.ch
                --++ "/place: " ++ toString place
                }
    in
        (integrateDelete deletedWChar newModel,  W (Delete deletedWChar))
       

integrateRemoteDelete : WChar -> Model -> (Model, Edit)
integrateRemoteDelete wChar model = 
    let 
        currCP = model.doc.cp
        deletePos = pos model.wString wChar
        newCP = if currCP > deletePos then currCP - 1 else currCP
        newDocModel =  {model | doc = (updateCP model.doc newCP)
                    --, debug = "deleting" ++ fromChar wChar.ch ++ " at " ++ toString deletePos
                }
        newModel = integrateDelete wChar newDocModel

    in 
        (newModel, T (D wChar.ch deletePos))


integrateDelete : WChar -> Model -> Model
integrateDelete wChar model = 
    let
        newWString = setInvisible model.wString wChar.id
    in 
        {model | wString = newWString}


-- - -- -  - - - - - - - - - - - - - - - - - - - - 


updateCP : Doc -> Int -> Doc
updateCP doc cp =
    {doc | cp = cp}    


updateStrAndLen : Doc -> String -> Int -> Doc
updateStrAndLen doc str len =
    {doc | str = str, len = len}
