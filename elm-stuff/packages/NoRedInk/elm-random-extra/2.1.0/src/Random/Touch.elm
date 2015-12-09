module Random.Touch where
{-| List of Touch Generators

# Generators
@docs tap, touch

-}

import Touch        exposing (Touch)
import Random       exposing (Generator, int)
import Random.Extra exposing (map2, map6)
import Random.Int   exposing (anyInt)
import Random.Float exposing (positiveFloat)

{-| Generate a random tap given a screen width and screen height
-}
tap : Int -> Int -> Generator { x : Int, y : Int }
tap screenWidth screenHeight =
  let makeTap x y = { x = x , y = y }
  in
    map2 makeTap (int 0 screenWidth) (int 0 screenHeight)

{-| Generate a random touch given a screen width and screen height
-}
touch : Int -> Int -> Generator Touch
touch screenWidth screenHeight =
  map6 Touch (int 0 screenWidth) (int 0 screenHeight) anyInt (int 0 screenWidth) (int 0 screenHeight) positiveFloat
