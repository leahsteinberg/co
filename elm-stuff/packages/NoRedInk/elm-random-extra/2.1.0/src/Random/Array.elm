module Random.Array where
{-| List of Array Generators

# Generate an Array
@docs array, emptyArray, rangeLengthArray

# Random Operations on an Array
@docs sample, choose, shuffle

-}

import Array        exposing (Array, fromList, empty)
import Random       exposing (Generator, list, int)
import Random.Extra exposing (map, flatMap, constant)

{-| Generate a random array of given size given a random generator

    randomLength5IntArray = array 5 (int 0 100)
-}
array : Int -> Generator a -> Generator (Array a)
array arrayLength generator =
  map fromList (list arrayLength generator)

{-| Generator that always generates the empty array
-}
emptyArray : Generator (Array a)
emptyArray =
  constant empty

{-| Generate a random array of random length given a minimum length and
a maximum length.
-}
rangeLengthArray : Int -> Int -> Generator a -> Generator (Array a)
rangeLengthArray minLength maxLength generator =
  flatMap (\len -> array len generator) (int minLength maxLength)


{-| Sample with replacement: produce a randomly selected element of the
array, or `Nothing` for an empty array. Takes O(1) time. -}
sample : Array a -> Generator (Maybe a)
sample arr =
    let gen = Random.int 0 (Array.length arr - 1)
    in Random.map (\index -> Array.get index arr) gen

{-| Sample without replacement: produce a randomly selected element of the
array, and the array with that element omitted (shifting all later elements
down). -}
choose : Array a -> Generator (Maybe a, Array a)
choose arr = if Array.isEmpty arr then constant (Nothing, arr) else
  let lastIndex = Array.length arr - 1
      front i = Array.slice 0 i arr
      back i = if i == lastIndex -- workaround for #1
               then Array.empty
               else Array.slice (i+1) (lastIndex+1) arr
      gen = Random.int 0 lastIndex
      in Random.map (\index ->
        (Array.get index arr, Array.append (front index) (back index)))
        gen


{-| Shuffle the array using the Fisher-Yates algorithm. Takes O(_n_ log _n_)
time and O(_n_) additional space. -}
shuffle : Array a -> Generator (Array a)
shuffle arr = if Array.isEmpty arr then constant arr else
  let --helper : (List a, Array a) -> Generator (List a, Array a)
      helper (done, remaining) =
        choose remaining `Random.andThen` (\(m_val, shorter) ->
          case m_val of
            Nothing -> constant (done, shorter)
            Just val -> helper (val::done, shorter))
  in Random.map (fst>>Array.fromList) (helper ([], arr))
