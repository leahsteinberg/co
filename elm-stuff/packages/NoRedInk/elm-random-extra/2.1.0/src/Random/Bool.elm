module Random.Bool where
{-| List of Bool Generators

# Generators
@docs bool

-}

import Random       exposing (Generator)
import Random.Extra exposing (frequency, constant)

{-| Random Bool generator
-}
bool : Generator Bool
bool =
  frequency
    [ (1, constant True)
    , (1, constant False)
    ] (constant True)
