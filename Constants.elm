module Constants where
import Model exposing (..)

import Color exposing (green)
import Graphics.Input.Field exposing (..)
import Dict
import Set

debug = False

fakeModel : Model
fakeModel = {site = 0
            , counter = 6
            , wString = [{ ch = 'a', id = (2,0), next = (0,1), prev = (0,-1), vis = 1 },{ ch = 'b', id = (2,1), next = (0,1), prev = (2,0), vis = 1 },{ ch = ' ', id = (2,2), next = (0,1), prev = (2,1), vis = 1 },{ ch = 'c', id = (2,3), next = (0,1), prev = (2,2), vis = -1 },{ ch = 'd', id = (2,4), next = (0,1), prev = (2,3), vis = 1 }]
            , start = startChar
            , doc = {cp = 4, str = "ab d", len = 4}
            , pool = []
            , processedPool = []
            , debug = ""
            , wSeen =  Set.insert startId Set.empty
                        |> Set.insert endId
                        |> Set.insert (2,0)
                        |> Set.insert (2, 1)
                        |> Set.insert (2, 2)
                        |> Set.insert (2, 4)
            }





emptyModel : Model
emptyModel = {site = 0
        , counter = 0
--        , wChars = Dict.insert endId endChar (Dict.insert startId startChar Dict.empty)
        , wString = []
        , start = startChar
        , doc = {cp = 0, str = "", len = 0}
        , pool = []
        , processedPool = []
        , debug = ""
        , wSeen = Set.insert startId Set.empty
                        |> Set.insert endId

    }

emptyDelModel : Model
emptyDelModel = {site = 0
        , counter = 0
        , wString = []
--        , wChars = Dict.insert fakeDeleted.id fakeDeleted (Dict.insert endId {endChar| prev<- (7,0)} (Dict.insert startId {startChar|next<- (7,0)} Dict.empty))
        , start = startChar
        , doc = {cp = 0, str = "", len = 0}
        , pool = []
        , processedPool = []
        , debug = ""
        , wSeen = Set.insert startId Set.empty
                        |> Set.insert endId}


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
                         highlight = highlightStyle

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
