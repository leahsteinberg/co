module Random.Window where
{-| List of window Generators

# Generators
@docs windowDimensions, windowWidth, windowHeight

-}

import Random       exposing (Generator, int)
import Random.Extra exposing (zip)

{-| Generate a random tuple of window dimensions given a minimum screen width, a maximum screen width, a minimum screen height, a maximum screen height
-}
windowDimensions : Int -> Int -> Int -> Int -> Generator (Int, Int)
windowDimensions minScreenWidth maxScreenWidth minScreenHeight maxScreenHeight =
  zip (int minScreenWidth maxScreenWidth) (int minScreenHeight maxScreenHeight)

{-| Generate a random window width value given a minimum screen width and a maximum screen width
-}
windowWidth : Int -> Int -> Generator Int
windowWidth minScreenWidth maxScreenWidth =
  int minScreenWidth maxScreenWidth

{-| Generate a random width height value given a minimum screen height and a maximum screen height
-}
windowHeight : Int -> Int -> Generator Int
windowHeight minScreenHeight maxScreenHeight =
  int minScreenHeight maxScreenHeight
