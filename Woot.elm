module Woot where


import Dict exposing (..)
import Model exposing (..)
import Constants exposing (..)
import String exposing (fromChar)
import Set exposing (..)

-- - - - - - - - - - U T I L I T I E S - - - - - - - - - -


wIdOrder : WChar -> WChar -> Order
wIdOrder wA wB =
    let
        (wASite, wAClock) = wA.id
        (wBSite, wBClock) = wB.id
    in
        if 
            |wASite > wBSite -> GT
            |wASite < wBSite -> LT 
            |otherwise -> if wAClock > wBClock then GT else LT


wToString : WString -> String
wToString wStr = 
    case wStr of
        [] -> ""
        x :: xs -> if x.vis > 0 
                    then  String.cons x.ch (wToString xs)
                    else wToString xs


subSeq : WString -> WChar -> WChar -> WString
subSeq wStr start end =
    case wStr of
        [] -> []
        x :: xs -> if x.id == start.id 
                    then subSeqGrab xs end 
                    else subSeq xs start end


subSeqGrab : WString -> WChar -> WString
subSeqGrab wStr end =
    case wStr of
        [] -> []
        x :: xs -> if x.id == end.id 
                    then [] 
                    else x :: subSeqGrab xs end


ithVisible : WString -> Int -> WChar
ithVisible wStr i =
    if i == -1 then startChar else 
        case wStr of
            [] -> endChar
-- error case!
            x :: xs -> if i == 0 && isVisible x then x 
                else 
                    if isVisible x then ithVisible xs (i - 1)
                        else ithVisible xs i 
--                            {ch = 'W', prev = startId, next = endId, vis = -1000, id = (66, 66)}

setInvisible : WString -> WId -> WString
setInvisible wStr id =
    case wStr of
        [] -> []
        x :: xs -> if x.id == id 
                    then {x | vis <- -1} :: xs 
                    else x :: (setInvisible xs id)

pos : WString -> WChar -> Int
pos wStr wCh =
    case wStr of 
        [] -> 0
        x :: xs -> 
            if
                | isVisible x -> if x.id == wCh.id then 0 else 1 + (pos xs wCh)
                | otherwise -> if x.id == wCh.id then 0 else pos xs wCh


    
isVisible : WChar -> Bool
isVisible wCh = 
    if 
        | wCh.id == startId -> True
        | wCh.id == endId -> True
        | wCh.vis > 0 -> True
        | otherwise -> False


grabNext : WChar -> WString  -> WChar
grabNext wCh wStr =
    case wStr of
        x :: xs -> if x.id == wCh.next then x else grabNext wCh xs
        [] -> endChar

grabPrev : WChar -> WString -> WChar
grabPrev wCh wStr =
    case wStr of
        x :: xs -> if x.id == wCh.prev then x else grabNext wCh xs
        [] -> startChar




canIns : WChar -> Set WId -> Bool
canIns wCh set = Set.member wCh.next set && Set.member wCh.prev set

canDel : WChar -> Set WId -> Bool
canDel wCh set = Set.member wCh.id set

canIntegrate : WUpdate -> Set WId -> Bool
canIntegrate wUpdate dict =
    case wUpdate of
        Insert wCh -> canIns wCh dict
        Delete wCh -> canDel wCh dict



