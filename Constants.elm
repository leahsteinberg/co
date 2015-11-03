module Constants where
import Model exposing (..)

import Color exposing (green)
import Graphics.Input.Field exposing (..)
import Dict

emptyModel : Model
emptyModel = {site = 0
        , counter = 0
        , wChars = Dict.empty
        , start = startChar
        , cursor = (0, endChar)
        , buffer = []
        , content = noContent
        , doc = {cp = 0, str = "", len = 0}
        , pool = []
        , debug = ""
        , debugCount = 0
        , docBuffer = []}


highlightStyle : Highlight
highlightStyle = {color = green, width = 4}


fieldStyle : Style
fieldStyle = {defaultStyle | 
                         highlight <- highlightStyle

                            }

--startChar = W "START" '`' startChar endChar -100
--endChar = W "END" '`' startChar endChar -100


startChar = {id = "START"
        , vis = -100
        , ch = '`'
        , prev = "START"
        , next = "END"}

endChar = {id = "END"
        , vis = -100
        , ch = '`'
        , prev = "START"
        , next = "END"}
