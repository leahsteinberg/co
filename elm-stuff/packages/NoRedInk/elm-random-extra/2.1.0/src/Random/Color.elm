module Random.Color where
{-| List of Color Generators

# Generators
@docs color, rgb, rgba, hsl, hsla, greyscale, grayscale, red, green, blue

-}

import Color        exposing (Color)
import Random       exposing (Generator, int, float)
import Random.Extra exposing (map, map3, map4)

{-| Generate a random color
-}
color : Generator Color
color =
  map4 Color.rgba (int 0 255) (int 0 255) (int 0 255) (float 0 1)

{-| Generate a random color which randomizes rgb values
-}
rgb : Generator Color
rgb =
  map3 Color.rgb (int 0 255) (int 0 255) (int 0 255)

{-| Generate a random color which randomizes rgba values
-}
rgba : Generator Color
rgba = color

{-| Generate a random color which randomizes hsl values
-}
hsl : Generator Color
hsl =
  map3 Color.hsl (map degrees (float 0 360)) (float 0 1) (float 0 1)

{-| Generate a random color which randomizes hsla values
-}
hsla : Generator Color
hsla =
  map4 Color.hsla (map degrees (float 0 360)) (float 0 1) (float 0 1) (float 0 1)

{-| Generate a random shade of grey
-}
greyscale : Generator Color
greyscale =
  map Color.greyscale (float 0 1)

{-| Alias for greyscale
-}
grayscale : Generator Color
grayscale = greyscale

{-| Generate a random shade of red
-}
red : Generator Color
red =
  map (\red -> Color.rgb red 0 0) (int 0 255)

{-| Generate a random shade of green
-}
green : Generator Color
green =
  map (\green -> Color.rgb 0 green 0) (int 0 255)

{-| Generate a random shade of blue
-}
blue : Generator Color
blue =
  map (\blue -> Color.rgb 0 0 blue) (int 0 255)
