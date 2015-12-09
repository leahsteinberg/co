module Random.String where
{-| List of String Generators

# Simple Generators
@docs string, word, englishWord, capitalizedEnglishWord

# Random Length String Generators
@docs rangeLengthString, rangeLengthWord, rangeLengthEnglishWord, anyEnglishWord, anyCapitalizedEnglishWord, rangeLengthCapitalizedEnglishWord

-}

import String exposing (fromList)
import Random exposing (Generator, list, int)
import Random.Char exposing (upperCaseLatin, lowerCaseLatin, unicode)
import Random.Extra exposing (map, map2, flatMap)



{-| Generate a random string of a given length with a given character generator

    fiveLetterEnglishWord = string 5 english
-}
string : Int -> Generator Char -> Generator String
string stringLength charGenerator =
  map fromList (list stringLength charGenerator)



{-| Generates a random string of random length given the minimum length
and maximum length and a given character generator.
-}
rangeLengthString : Int -> Int -> Generator Char -> Generator String
rangeLengthString minLength maxLength charGenerator =
  flatMap (\len -> string len charGenerator) (int minLength maxLength)



{-| Generate a random word of a given length with a given character generator
(alias for `string`)
-}
word : Int -> Generator Char -> Generator String
word = string



{-| Alias for `rangeLengthString`
-}
rangeLengthWord : Int -> Int -> Generator Char -> Generator String
rangeLengthWord = rangeLengthString



{-| Generate a random lowercase word with english characters of a given length.
Note: This just generates a random string using the letters in english, so there
are no guarantees that the result be an actual english word.
-}
englishWord : Int -> Generator String
englishWord wordLength =
  map fromList (list wordLength lowerCaseLatin)



{-| Generate a random lowercase word with english characters of random length
given a minimum length and maximum length.
-}
rangeLengthEnglishWord : Int -> Int -> Generator String
rangeLengthEnglishWord minLength maxLength =
  rangeLengthWord minLength maxLength lowerCaseLatin



{-| Generate a random lowercase word with english characters of random length
between 1 34.
Aside: 34 was picked as a maximum as "supercalifragilisticexpialidocious"
is considered the longest commonly used word and is 34 character long.
Longer words do occur, especially in scientific contexts. In which case, consider
using `rangeLengthEnglishWord` for more granular control.
-}
anyEnglishWord : Generator String
anyEnglishWord =
  rangeLengthEnglishWord 1 34



{-| Generate a random capitalized word with english characters of a given length.
Note: This just generates a random string using the letters in english, so there
are no guarantees that the result be an actual english word.
-}
capitalizedEnglishWord : Int -> Generator String
capitalizedEnglishWord wordLength =
  (map fromList
    (map2 (::) upperCaseLatin
      (list (wordLength - 1) lowerCaseLatin)))



{-| Generate a random capitalized word with english characters of random length
given a minimum length and a maximum length.
-}
rangeLengthCapitalizedEnglishWord : Int -> Int -> Generator String
rangeLengthCapitalizedEnglishWord minLength maxLength =
  flatMap capitalizedEnglishWord (int minLength maxLength)



{-| Generate a random capitalized word with english characters of random length
between 1 34.
Aside: 34 was picked as a maximum as "supercalifragilisticexpialidocious"
is considered the longest commonly used word and is 34 character long.
Longer words do occur, especially in scientific contexts. In which case, consider
using `rangeLengthEnglishWord` for more granular control.
-}
anyCapitalizedEnglishWord : Generator String
anyCapitalizedEnglishWord =
  rangeLengthCapitalizedEnglishWord 1 34
