module Random.List where
{-| List of List Generators

# Generators
@docs emptyList, rangeLengthList

-}

import Random       exposing (Generator, int, list)
import Random.Extra exposing (flatMap, constant)

{-| Generator that always returns the empty list.
-}
emptyList : Generator (List a)
emptyList =
  constant []


{-| Generate a random list of random length given a minimum length and
a maximum length.
-}
rangeLengthList : Int -> Int -> Generator a -> Generator (List a)
rangeLengthList minLength maxLength generator =
  flatMap (\len -> list len generator) (int minLength maxLength)
