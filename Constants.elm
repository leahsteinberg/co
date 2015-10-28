module Constants where
import Model exposing (..)

import Color exposing (green)
import Graphics.Input.Field exposing (..)
import Dict

emptyModel : Model
emptyModel = {site = 1
        , counter = 0
        , wChars = Dict.empty
        , start = startChar
        , cursor = (-1, startChar)
        , buffer = []
        , content = noContent}


highlightStyle : Highlight
highlightStyle = {color = green, width = 4}


fieldStyle : Style
fieldStyle = {defaultStyle | 
                         highlight <- highlightStyle

                            }




hugePrime : Int
hugePrime = 1299827

startChar = {id = "START"
        , visible = -1
        , content = '`'
        , prev = "START"
        , next = "END"}

endChar = {id = "END"
        , visible = -1
        , content = '`'
        , prev = "START"
        , next = "END"}
