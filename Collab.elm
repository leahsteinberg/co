module Collab where

import Model exposing (..)
import String
import List
import Graph exposing (integrateRemoteInsert)

insert : String -> Int -> Model -> (Model, Edit)
insert string index model =
    let
      strIndexList = List.map2 (,) (String.toList string) [index..(index + String.length string)]
      tUpdates = List.foldr createInsertTUpdate [] strIndexList
    in
        (model, W (I 'w' 4))
--        List.foldl integrateLocalInsert (model, edit) tUpdates


createInsertTUpdate : (Char, Int) -> List TUpdate -> List TUpdate
createInsertTUpdate (char, index) tUpdates = I char index :: tUpdates


