module DraftTests where

import Set exposing (..)
import Woot exposing (wToString)
import Editor exposing (insertString, processEdits)
import Model exposing (..)
import Constants exposing (..)


-- - - - - -   H E L P E R - F U N C T I O N S  - - - - - - -
makeEmptySite : Int -> Model
makeEmptySite id = { counter = 1
                    , site = id
                    , wString = []
                    , doc = {cp = 666, str = "bad", len = 666}
                    , debug = ""
                    , wSeen = Set.insert startId Set.empty
                                    |> Set.insert endId
                    , start = startChar
                    , processedPool = []
                    , pool = []}



simpleCase =
  let
      empty = makeEmptySite 1
      (model, added) = insertString "a" 1 empty
  in
      wToString model.wString == "a"

simpleCaseLonger =
  let
      empty = makeEmptySite 1
      (model, edit) = insertString "hello" 1  empty
  in
      wToString model.wString == "hello"

insertOrderIrrelevant =
    let
        local = makeEmptySite 1
        remote = makeEmptySite 2
        (localModel, lEdits) = insertString "hello" 1 local
        (remoteModel, rEdits) = processEdits (lEdits) remote
    in
       wToString remoteModel.wString == "hello" && wToString localModel.wString == "hello"

concurrentInsertsConsistentText =
  let
      (localModel, lEdits) = insertString "hello" 1 (makeEmptySite 1)
      (remoteModel, rEdits) = processEdits lEdits (makeEmptySite 2)
      -- each site inserts different text at a random point
      (localModelType, newLEdits) = insertString "doggie" 3 localModel
      (remoteModelType, newREdits) = insertString "kittie" 5 remoteModel
      (localModelNew, newLPEdits) = processEdits newREdits localModelType
      (remoteModelNew, newRPEdits) = processEdits newLEdits remoteModelType
  in
      wToString remoteModelNew.wString == wToString localModelNew.wString

insertIsIdempotent =
  let
      (localModel, lEdits) = insertString "hey there" 1 (makeEmptySite 1)
      (newLocalModel, newEdits) = processEdits lEdits localModel
  in
        wToString localModel.wString == wToString newLocalModel.wString

localDeleteRemovesCharacter =
  let
      (localModel, lEdits) = insertString "hi how are you?" 1 (makeEmptySite 1)
      (newModel, newEdits) = processEdits [T (D 'h' 3)] localModel
  in
      wToString newModel.wString == "hi ow are you?"


remoteDeleteProducesConsistentResults =
  let
      (localModel, lEdits) =  insertString "what are you doing there?!?" 1 (makeEmptySite 1)
      (newLocalModel, newLEdits) = processEdits [T (D 'a' 5)] localModel
      (remoteModel, remoteEdits) = processEdits (newLEdits ++ lEdits) (makeEmptySite 2)
  in
      wToString remoteModel.wString == "what re you doing there?!?"





-- - - - - - - - - - - - - - S I M P L E - C A S E S - - - - - -


runTestsStrings = [remoteDeleteProducesConsistentResults]  


runTests1 = [simpleCase
          , simpleCaseLonger
          , insertOrderIrrelevant
          , concurrentInsertsConsistentText
          , insertIsIdempotent
          , localDeleteRemovesCharacter
          , remoteDeleteProducesConsistentResults]

