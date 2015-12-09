module Random.Signal where
{-| List of Signal Generators

# Generators
@docs constant

# Random Seeds
@docs randomSeed, randomSeedEvery

# Generate Signals
@docs generate, generateEvery

# Generate a run of an application
@docs application, run
-}

import Signal       exposing (Signal)
import Random       exposing (Generator, Seed)
import Random.Extra exposing (map, reduce)
import Time         exposing (Time)

{-| Generates constant signals.
-}
constant : Generator a -> Generator (Signal a)
constant generator =
  map Signal.constant generator


{-| Generate a random seed that updates 60 times per second.
Note: The seed uses the current Unix time.
-}
randomSeed : Signal Seed
randomSeed =
  randomSeedEvery (1000 / 60)

{-| Generate a random seed that updates every given timestep.
-}
randomSeedEvery : Time -> Signal Seed
randomSeedEvery timestep =
  let
      currentTime = Time.every timestep
  in
      Signal.map (floor >> Random.initialSeed) currentTime


{-| Generate a signal from a random generator that updates every
given number of milliseconds.
-}
generateEvery : Time -> Generator a -> Signal a
generateEvery time generator =
  let
      initialModel =
        { seed = Random.initialSeed 1
        , generator = generator
        }

      update seed model =
        { model | seed = seed }

      view model =
        fst <| Random.generate model.generator model.seed

  in
      Signal.map view
        (Signal.foldp update initialModel (randomSeedEvery time))


{-| Generate a signal from a random generator that updates 60 times per second.
-}
generate : Generator a -> Signal a
generate =
  generateEvery (1000 / 60)


{-| Generate a random run of an application that follows the Elm Architecture.
Here, the Elm Architecture is interpreted as follows:

    initialModel : model
    actions : Signal action
    update : action -> model -> model
    view : model -> view -- where view is usually Element or Html

    main =
      Signal.map view
        (Signal.foldp update initialModel actions)


How to use:

    applicationGenerator =
      application initialModel actionGenerator update view

    main =
      generate applicationGenerator

-}
application : model -> Generator action -> (action -> model -> model) -> (model -> view) -> Generator view
application initialModel actionGenerator update view =
  map view
    (reduce update initialModel actionGenerator)

{-| Create a running signal from an application that follows the Elm Architecture.
This is analogous to `application` and works better as it avoids issues with
`Random.Extra.reduce`.

How to use:

    main =
      run initialModel actionGenerator update view
-}
run : model -> Generator action -> (action -> model -> model) -> (model -> view) -> Signal view
run initialModel actionGenerator update view =
  Signal.map view
    (Signal.foldp update initialModel (generate actionGenerator))
