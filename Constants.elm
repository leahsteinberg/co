module Constants where
import Model exposing (..)

import Color exposing (green)
import Graphics.Input.Field exposing (..)
import Dict

emptyModel : Model
emptyModel = {site = 0
        , counter = 0
--        , wChars = Dict.insert endId endChar (Dict.insert startId startChar Dict.empty)
        , wString = []
        , start = startChar
        , doc = {cp = 0, str = "", len = 0}
        , pool = []
        , debug = ""}

emptyDelModel : Model
emptyDelModel = {site = 0
        , counter = 0
        , wString = []
--        , wChars = Dict.insert fakeDeleted.id fakeDeleted (Dict.insert endId {endChar| prev<- (7,0)} (Dict.insert startId {startChar|next<- (7,0)} Dict.empty))
        , start = startChar
        , doc = {cp = 0, str = "", len = 0}
        , pool = []
        , debug = ""}


fakeDeleted = {id = (7,0)
                , next = endId
                , prev = startId
                , vis = -1
                , ch = 't'}


emptyWIdDict : Dict.Dict String WChar
emptyWIdDict = Dict.empty


highlightStyle : Highlight
highlightStyle = {color = green, width = 4}



fieldStyle : Style
fieldStyle = {defaultStyle | 
                         highlight <- highlightStyle

                            }


startId = (0, -1)
endId = (0, 1)


startChar = {id = startId
        , vis = -100
        , ch = '<'
        , prev = startId
        , next = endId}

endChar = {id = endId
        , vis = -100
        , ch = '>'
        , prev = startId
        , next = endId}
