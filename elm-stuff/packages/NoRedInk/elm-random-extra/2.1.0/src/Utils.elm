module Utils where

import List exposing (drop)

get : Int -> List a -> Maybe a
get index list =
  if index < 0
  then Nothing
  else
    case List.drop index list of
      [] -> Nothing
      x :: xs -> Just x
