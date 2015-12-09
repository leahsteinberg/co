module Random.Result where
{-| List of Result Generators

# Generators
@docs ok, error, result

-}

import Random       exposing (Generator, generate,float)
import Random.Extra exposing (map, frequency)


{-| Generate an ok result from a random generator of values
-}
ok : Generator value -> Generator (Result error value)
ok generator =
  map Ok generator


{-| Generate an error result from a random generator of errors
-}
error : Generator error -> Generator (Result error value)
error generator =
  map Err generator


{-| Generate an ok result or an error result with 50-50 chance

This is simply implemented as follows:

    result errorGenerator okGenerator =
      frequency
        [ (1, error errorGenerator)
        , (1, ok okGenerator)
        ] (ok okGenerator)

If you want to generate results with a different frequency, tweak those
numbers to your bidding in your own custom generators.
-}
result : Generator error -> Generator value -> Generator (Result error value)
result errorGenerator okGenerator =
  frequency
    [ (1, error errorGenerator)
    , (1, ok okGenerator)
    ] (ok okGenerator)
