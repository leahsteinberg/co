module Random.Float where
{-| List of Float Generators

# Generators
@docs anyFloat, positiveFloat, negativeFloat, floatGreaterThan, floatLessThan, probability, negativeProbability, unitRange

# Gaussian Generators
@docs normal, standardNormal, gaussian

-}

import Random       exposing (Generator, float, maxInt, minInt, generate)
import Random.Extra exposing (map)


{-| Generator that generates any float
-}
anyFloat : Generator Float
anyFloat = float (toFloat minInt) (toFloat maxInt)

{-| Generator that generates any positive float
-}
positiveFloat : Generator Float
positiveFloat = float 0 (toFloat maxInt)

{-| Generator that generates any negative float
-}
negativeFloat : Generator Float
negativeFloat = float (toFloat minInt) 0

{-| Generator that generates a float greater than a given float
-}
floatGreaterThan : Float -> Generator Float
floatGreaterThan value = float value (toFloat maxInt)

{-| Generator that generates a float less than a given float
-}
floatLessThan : Float -> Generator Float
floatLessThan value = float (toFloat minInt) value

{-| Generator that generates a float between 0 and 1
-}
probability : Generator Float
probability = float 0 1

{-| Generator that generates a float between -1 and 0
-}
negativeProbability : Generator Float
negativeProbability = float -1 0

{-| Generator that generates a float between - 1 and 1
-}
unitRange : Generator Float
unitRange = float -1 1


{-| Create a generator of floats that is normally distributed with
given minimum, maximum, and standard deviation.
-}
normal : Float -> Float -> Float -> Generator Float
normal start end standardDeviation =
  let normalDistribution mean stdDev x =
        if stdDev == 0 then x
        else
          let scale = 1 / (stdDev * sqrt (2 * pi))
              exponent = ((x - mean) * (x - mean)) / (2 * stdDev * stdDev)
          in
            scale * (e ^ -exponent)

  in
    map (normalDistribution ((end - start) / 2) standardDeviation) (float start end)

{-| Generator that follows a standard normal distribution (as opposed to
a uniform distribution)
-}
standardNormal : Generator Float
standardNormal = normal (toFloat minInt + 1) (toFloat maxInt) 1

{-| Alias for `normal`.
-}
gaussian : Float -> Float -> Float -> Generator Float
gaussian = normal
