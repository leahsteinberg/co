module Random.Keyboard where
{-| List of Keyboard Generators

# Generators
@docs arrows, keyCode, numberKey, letterKey, arrowKey, numpadKey, fKey

-}

import List
import Char         exposing (KeyCode)
import Random       exposing (Generator, int)
import Random.Extra exposing (map, selectWithDefault)


{-| Generate random Keyboard arrows input
-}
arrows : Generator { x : Int, y : Int }
arrows =
  selectWithDefault { x = 0, y = 0 }
    [ { x = 0, y = 0 }
    , { x = 0, y = 1 }
    , { x = 1, y = 0 }
    , { x = 1, y = 1 }
    ]

{-| Generate a random Keyboard input.
-}
keyCode : Generator KeyCode
keyCode =
  let validCodes =
        [8, 9, 13] ++
        [16..20] ++
        [27] ++
        [33..40] ++
        [45, 46] ++
        [48..57] ++
        [65..93] ++
        [96..107] ++
        [109..123] ++
        [144, 145] ++
        [186..192] ++
        [219..222]

      elem index list =
        if index < 0
        then Nothing
        else
          case List.drop index list of
            [] -> Nothing
            x :: xs -> Just x

      intToCode int =
        case elem int validCodes of
          Nothing -> 0
          Just code -> code

  in
    map intToCode (int 0 97)

{-| Generate a random number key input
-}
numberKey : Generator KeyCode
numberKey =
  map (\int -> int + 48) (int 0 9)

{-| Generate a random letter key input
-}
letterKey : Generator KeyCode
letterKey =
  map (\int -> int + 65) (int 0 25)

{-| Generate a random arrow key input
-}
arrowKey : Generator KeyCode
arrowKey =
  map (\int -> int + 37) (int 0 3)

{-| Generate a random numpadKey input
-}
numpadKey : Generator KeyCode
numpadKey =
  map (\int -> int + 96) (int 0 9)

{-| Generate a random fKey input
-}
fKey : Generator KeyCode
fKey =
  map (\int -> int + 112) (int 0 11)
