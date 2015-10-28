module Constants where
import Model exposing (..)

import Color exposing (green)
import Graphics.Input.Field exposing (..)

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
        , content = 'a'
        , prev = "START"
        , next = "END"}

endChar = {id = "END"
        , visible = -1
        , content = 'a'
        , prev = "END"
        , next = "START"}
