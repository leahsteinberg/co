module Checks where
import Graphics.Element exposing (..)
import Check exposing (..)
import Check.Investigator exposing (..)
import DraftTests exposing (makeEmptySite)
import Woot exposing (wToString)
import Editor exposing (insertString, processEdits)
import String exposing (toList, length)
import Char exposing (toCode)
import Html exposing (Html, Attribute, div, text, ul, ol, li)
import Model exposing (..)

first_index = 0 
generatePseudoRandomIndex : String -> Int -> Int
generatePseudoRandomIndex origStr i =if length origStr == 0 then 0 else i % (length origStr)


claim_insert_string = 
  claim
  "Can insert a string and get same string"
  `that`
    (\ str -> 
        let
          (model, edit) =  insertString str first_index (makeEmptySite 1)
        in 
            wToString model.wString)
  `is`
      (identity)
  `for`
      string

insert_order_irrelevant =
    claim
      "remote site gets same as local"
    `that`
      (\ str ->
        let
            (localModel, lEdits) = insertString str first_index (makeEmptySite 1)
            (remoteModel, rEdits) = processEdits (lEdits) (makeEmptySite 1)
        in
            wToString remoteModel.wString 
        )
    `is`
        (identity)
    `for`
        string


concurrent_insert_consistent' = (\ origStr localStr remoteStr  x y ->
        let
          (localModel1, lEdits1) = insertString origStr first_index (makeEmptySite 1)
          (remoteModel1, rEdits1) = processEdits lEdits1 (makeEmptySite 2)
          rIndex = generatePseudoRandomIndex origStr x 
          lIndex = generatePseudoRandomIndex origStr y
          (localModel2, lEdits2) = insertString localStr lIndex localModel1
          (remoteModel2, rEdits2) = insertString remoteStr rIndex remoteModel1
          (localModel3, lEdits3) = processEdits rEdits2 localModel2
          (remoteModel3, rEdits3) = processEdits lEdits2 remoteModel2
        in
          (wToString remoteModel3.wString, wToString localModel3.wString))



concurrent_insert_consistent =
  claim 
    "two people write at same time, same result"
    `that`
        (\ (origStr, (localStr, (remoteStr, (x, y)))) ->
            fst (concurrent_insert_consistent' origStr localStr remoteStr x y)
          )
      `is`
        (\ (origStr, (localStr, (remoteStr, (x, y)))) ->
            snd (concurrent_insert_consistent' origStr localStr remoteStr x y)
          )
        `for`
          tuple (string, (tuple (string, tuple (string, tuple (int, int)))))

insert_idempotent = 
    claim
    "insert is idempotent"
    `that`
      (\str ->
        let
            (model, edits) = insertString str first_index (makeEmptySite 1)
        in
            wToString model.wString
        )
      `is`
        (\str ->
          let
              (model, edits) = insertString str first_index (makeEmptySite 1)
              (newModel, newEdits) = processEdits edits model
          in
              wToString newModel.wString
          )
        `for`
        string


local_delete_consistent = 
  claim
    "local delete produces consistent results"
  `that`
    (\ (str, x) ->
      let
          (model, edits) = insertString str first_index (makeEmptySite 1)
          newNumber = if String.length str == 0 then 0 else x % (String.length str)
          charToDelete = case List.drop newNumber (String.toList str) of
                    x :: xs -> x
                    [] -> 'a'
          (newModel, newEdits) = processEdits [T (D charToDelete newNumber)] model
--          (remoteModel, remoteEdits) = processEdits (List.reverse (edits ++ newEdits)) (makeEmptySite 2)
      in
          wToString newModel.wString
      )
  `is`
    (\ (str, x) ->
      let
          newNumber = if String.length str == 0 then 0 else x % (String.length str)
          newStrList = List.take newNumber (String.toList str) ++ (List.drop (newNumber + 1) (String.toList str))
      in
          List.foldl (\char accumStr -> toString char ++ accumStr) "" newStrList
    )
  `for`
      tuple (string, int)






suite_co = 
  suite "Collab Editing Suite"
  [claim_insert_string
  , insert_order_irrelevant
  , insert_idempotent
  , local_delete_consistent
  , concurrent_insert_consistent
    ]



tripleStrings = [("footbol", "how", "are"), ("what", "is", "love"), ("home", "cake", "twelve")]


runTests = List.map (\ (origStr, localStr, remoteStr) -> 
          concurrent_insert_consistent' origStr localStr remoteStr 1 1)
           tripleStrings


result = quickCheck suite_co

main =  show result


