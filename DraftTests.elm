module DraftTests where

import Set exposing (..)
import Woot exposing (wToString)
import Editor exposing (insertString)
import Model exposing (..)
import Constants exposing (..)

-- - - - - -   H E L P E R - F U N C T I O N S  - - - - - - -
makeEmptySite : Int -> Model
makeEmptySite id = { counter = 1
                    , site = id
                    , wString = [startChar, endChar]
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
      (model, added) = insertString "a" 0 empty
  in
      wToString model.wString == "a"

simpleCaseLonger = 
  let
      empty = makeEmptySite 1
      (model, edit) = insertString "hello" 0 empty
  in
      wToString model.wString == "hello"

-- - - - - - - - - - - - - - S I M P L E - C A S E S - - - - - -




runTests = []











-- - - - - - - - Local insert preserves original text


--type alias Model = 
--                {
--                    counter: Int
--                    , site: ID
--                    , wString: WString
--                    , start: WChar
--                    , doc: Doc
--                    , debug: String
--                    , wSeen: Set WId
--                    , pool: List WUpdate
--                    , processedPool: List WUpdate
--                }




