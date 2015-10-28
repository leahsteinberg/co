module Typing where

import Html exposing (..)
import Html.Attributes exposing (..)
import Graphics.Element exposing (..)
import Signal exposing (..)
import String exposing (..)
import Json.Encode as Json 
import Dict
import Model exposing (..)
import Constants exposing (..)


port caretPos : Signal Int

emptyModel : Model
emptyModel = {site = 1
        , counter = 0
        , wChars = Dict.empty
        , start = startChar
        , cursor = (0, startChar)}
-- how do we know when theres been an insert?











---- VIEW
main = view <~ caretPos ~ (toString <~ caretPos)

view : Int -> String -> Html
view cp str= 
    div
    []
    [
    (textarea [property "value"   (Json.string str), id "typingZone", cols 40, rows 40] [])
    , text (toString cp)
    ]



