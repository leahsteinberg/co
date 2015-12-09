module Random.Int where
{-| List of Int Generators

# Generators
@docs anyInt, positiveInt, negativeInt, intGreaterThan, intLessThan
-}

import Random exposing (Generator, int, minInt, maxInt)

{-| Generator that generates any int that can be generate by the
random generator algorithm.
-}
anyInt : Generator Int
anyInt = int minInt maxInt

{-| Generator that generates a positive int
-}
positiveInt : Generator Int
positiveInt = int 1 maxInt

{-| Generator that generates a negative int
-}
negativeInt : Generator Int
negativeInt = int minInt -1

{-| Generator that generates an int greater than a given int
-}
intGreaterThan : Int -> Generator Int
intGreaterThan value = int (value + 1) maxInt

{-| Generator that generates an int less than a given int
-}
intLessThan : Int -> Generator Int
intLessThan value = int minInt (value - 1)
