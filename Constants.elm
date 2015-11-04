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
        , doc = {cp = 0, str = "", len = 0}
        , pool = []
        , debug = ""}

emptyWIdDict : Dict.Dict String WChar
emptyWIdDict = Dict.empty


highlightStyle : Highlight
highlightStyle = {color = green, width = 4}


docSilly stri = {cp = 900, str = stri, len = 88}

fieldStyle : Style
fieldStyle = {defaultStyle | 
                         highlight <- highlightStyle

                            }

--startChar = W "START" '`' startChar endChar -100
--endChar = W "END" '`' startChar endChar -100

startId = (0, -1)
endId = (0, 1)


startChar = {id = startId
        , vis = -100
        , ch = '`'
        , prev = startId
        , next = endId}

endChar = {id = endId
        , vis = -100
        , ch = '`'
        , prev = startId
        , next = endId}
