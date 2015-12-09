module Random.Order where
{-| List of Order Generators

# Generators
@docs order
-}

import Random exposing (Generator)
import Random.Extra exposing (selectWithDefault)

{-| Generate a random order with equal probability.
-}
order : Generator Order
order =
  selectWithDefault EQ
    [ LT
    , EQ
    , GT
    ]
