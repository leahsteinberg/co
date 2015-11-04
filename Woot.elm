module Woot where

import Dict exposing (..)
import Model exposing (..)
import Constants exposing (..)

-- - - - - - - - - - U T I L I T I E S - - - - - - - - - -

subSeq : Dict WId WChar -> WChar -> WChar -> Dict WId WChar
subSeq dict start end = subSeq' dict (grabNext start dict) end Dict.empty


subSeq' : Dict WId WChar -> WChar -> WChar -> Dict WId WChar -> Dict WId WChar
subSeq' dict curr end subDict =
    let
        newDict = Dict.insert curr.id curr subDict
    in
        if
            | curr.id == end.id -> subDict
            | otherwise -> Dict.insert curr.id curr (Dict.insert end.id end subDict)
--subSeq' dict (grabNext curr dict) end newDict


grabNext : WChar -> Dict.Dict WId WChar  -> WChar
grabNext wCh dict =
    case Dict.get wCh.next dict of
        Just next -> next
        _ -> endChar

grabPrev : WChar -> Dict.Dict WId WChar ->  WChar
grabPrev wCh dict=
    case Dict.get wCh.prev dict of
        Just prev -> prev
        _ -> startChar

contains : WChar -> Dict WId WChar -> Bool
contains wCh dict = Dict.member wCh.id dict


ithVisible : Dict WId WChar -> Int -> WChar
ithVisible dict goalPlace = 
    let
        starter = case Dict.get startId dict of
            Just start -> start
            _ -> startChar
    in
        if goalPlace == -1 then starter else ithVisible' dict goalPlace (grabNext starter dict)

ithVisible' : Dict WId WChar -> Int -> WChar -> WChar
ithVisible' dict goalPlace currWChar = 
    let
        isVis = isVisible currWChar
    in

        if 
            |isVis && goalPlace == 0 -> currWChar
            |isVis -> ithVisible' dict (goalPlace - 1) (grabNext currWChar dict)
            |currWChar.id == endId -> currWChar
            |otherwise -> ithVisible' dict goalPlace (grabNext currWChar dict)



    
isVisible : WChar -> Bool
isVisible wCh = wCh.vis > 0 || wCh.id == startId || wCh.id == endId


-- fold over pool, integrating those that we can integrate
integratePool : Model -> Model
integratePool model = model

canIns : WChar -> Dict WId WChar -> Bool
canIns wCh dict = Dict.member wCh.next dict && Dict.member wCh.prev dict

canDel : WChar -> Dict WId WChar -> Bool
canDel wCh dict = contains wCh dict

canIntegrate : WUpdate -> Dict WId WChar -> Bool
canIntegrate wUpdate dict =
    case wUpdate of
        Insert wCh -> canIns wCh dict
        Delete wCh -> canDel wCh dict



