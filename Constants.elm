module Constants where


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