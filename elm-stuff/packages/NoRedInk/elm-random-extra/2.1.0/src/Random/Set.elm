module Random.Set where
{-| List of Random Set Generators

# Generators
@docs empty, singleton, set, notInSet

# Combinators
@docs select, selectWithDefault

-}

import Set          exposing (Set)
import Random       exposing (Generator, list)
import Random.Extra exposing (constant, map, dropIf, keepIf)


{-| Generator that always returns the empty set
-}
empty : Generator (Set comparable)
empty =
  constant Set.empty


{-| Generator that creates a singleton set from a generator
-}
singleton : Generator comparable -> Generator (Set comparable)
singleton generator =
  map Set.singleton generator


{-| A generator that creates values not present in a given set.
-}
notInSet : Set comparable -> Generator comparable -> Generator comparable
notInSet set generator =
  dropIf (flip Set.member set) generator



{-| Generate values from a set.
Analogous to `Random.Extra.select` but with sets
-}
select : Set comparable -> Generator (Maybe comparable)
select set =
  Random.Extra.select (Set.toList set)

{-| Generate values from a set or a default value.
Analogous to `Random.Extra.selectWithDefault` but with sets
-}
selectWithDefault : comparable -> Set comparable -> Generator comparable
selectWithDefault default set =
  Random.Extra.selectWithDefault default (Set.toList set)

{-| Generate a set of size at most given maxLength from a generator.
-}
set : Int -> Generator comparable -> Generator (Set comparable)
set maxLength generator =
  map Set.fromList (list maxLength generator)
