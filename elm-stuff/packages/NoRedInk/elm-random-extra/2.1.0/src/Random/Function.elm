module Random.Function where
{-| List of Function Generators

# Generators
@docs func, func2, func3, func4, func5, func6

# Infix operators
@docs (<<<), (>>>)

-}

import Random exposing (Generator, generate)
import Random.Extra exposing (flatMap2)

{-| Generates a random function of one argument given a generator for the output.
-}
func : Generator b -> Generator (a -> b)
func generatorB =
  Random.map (\b a -> b) generatorB


{-| Generates a random function of two arguments given a generator for the output.
-}
func2 : Generator c -> Generator (a -> b -> c)
func2 generatorC =
  func (func generatorC)


{-| Generates a random function of three arguments given a generator for the output.
-}
func3 : Generator d -> Generator (a -> b -> c -> d)
func3 generatorD =
  func (func2 generatorD)


{-| Generates a random function of four arguments given a generator for the output.
-}
func4 : Generator e -> Generator (a -> b -> c -> d -> e)
func4 generatorE =
  func (func3 generatorE)


{-| Generates a random function of five arguments given a generator for the output.
-}
func5 : Generator f -> Generator (a -> b -> c -> d -> e -> f)
func5 generatorF =
  func (func4 generatorF)


{-| Generates a random function of six arguments given a generator for the output.
-}
func6 : Generator g -> Generator (a -> b -> c -> d -> e -> f -> g)
func6 generatorG =
  func (func5 generatorG)


infixl 9 >>>
{-| Compose two function generators. Analogous to `>>`
-}
(>>>) : Generator (a -> b) -> Generator (b -> c) -> Generator (a -> c)
(>>>) generatorAB generatorBC =
  Random.map2 (\f g -> f >> g) generatorAB generatorBC


infixr 9 <<<
{-| Compose two function generators. Analogous to `<<`
-}
(<<<) : Generator (b -> c) -> Generator (a -> b) -> Generator (a -> c)
(<<<) generatorBC generatorAB =
  Random.map2 (\f g -> f >> g) generatorAB generatorBC

