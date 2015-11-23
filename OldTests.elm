module Tests where

import String 
import Graphics.Element exposing (Element, show)


import ElmTest.Test exposing (..)
import ElmTest.Assertion exposing (..)
import ElmTest.Run exposing (..)
import ElmTest.Runner.Console exposing (..)
import ElmTest.Runner.Element exposing (..)
import ElmTest.Runner.String exposing (..)

x = 4
sampleTest = test "Example Test" (assert True)

main =  (ElmTest.elementRunner sampleTest)








