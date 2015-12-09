module Random.Dict where
{-| List of Dict Generators

# Generators
@docs dict, emptyDict, rangeLengthDict

-}

import Dict         exposing (Dict, fromList, empty)
import Random       exposing (Generator, list, int)
import Random.Extra exposing (zip, map, flatMap, constant)

{-| Generate a random dict with given length, key generator, and value generator

    randomLength10StringIntDict = dict 10 (englishWord 10) (int 0 100)
-}
dict : Int -> Generator comparable -> Generator value -> Generator (Dict comparable value)
dict dictLength keyGenerator valueGenerator =
  map (fromList) (list dictLength (zip keyGenerator valueGenerator))

{-| Generator that always generates the empty dict
-}
emptyDict : Generator (Dict comparable value)
emptyDict =
  constant empty

{-| Generate a random dict of random length given a minimum length and
a maximum length.
-}
rangeLengthDict : Int -> Int -> Generator comparable -> Generator value -> Generator (Dict comparable value)
rangeLengthDict minLength maxLength keyGenerator valueGenerator =
  flatMap (\len -> dict len keyGenerator valueGenerator) (int minLength maxLength)
