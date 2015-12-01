module Checks where
import Graphics.Element exposing (..)

import Check exposing (..)
import Check.Investigator exposing (..)
import DraftTests exposing (makeEmptySite)
import Woot exposing (wToString)
import Editor exposing (insertString, processEdits)

claim_insert_string = 
  claim
  "Can insert a string and get same string"
  `that`
    (\ str -> 
        let
          (model, edit) =  insertString str 1 (makeEmptySite 1)
        in 
            wToString model.wString)
  `is`
      (\str -> "whhh")
  `for`
      string


result = quickCheck claim_insert_string

main = show result


