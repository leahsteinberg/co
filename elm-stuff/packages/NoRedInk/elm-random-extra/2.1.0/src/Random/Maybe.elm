module Random.Maybe where
{-| List of Maybe Generators

# Generators
@docs maybe, withDefault, withDefaultGenerator

-}

import Random       exposing (Generator)
import Random.Extra exposing (constant, map, frequency, flatMap)
import Maybe

{-| Generate a Maybe from a generator. Will generate Nothings 50% of the time.
-}
maybe : Generator a -> Generator (Maybe a)
maybe generator =
  frequency
    [ (1, constant Nothing)
    , (1, map Just generator)
    ] (constant Nothing)

{-| Generate values from a maybe generator or a default value.
-}
withDefault : a -> Generator (Maybe a) -> Generator a
withDefault value generator =
  map (Maybe.withDefault value) generator

{-| Generate values from a maybe generator or a default generator.
-}
withDefaultGenerator : Generator a -> Generator (Maybe a) -> Generator a
withDefaultGenerator default generator =
  flatMap (flip withDefault generator) default
