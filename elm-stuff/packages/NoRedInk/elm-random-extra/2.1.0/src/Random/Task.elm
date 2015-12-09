module Random.Task where
{-| List of Task Generators

# Generators
@docs task, error, spawn

# Timeout Generators
@docs timeout, rangeLengthTimeout

# Chaining Task Generators
@docs sequence, parallel, optional

# Generators that communicate with mailboxes
@docs send, broadcast

-}

import Task         exposing (Task, ThreadID, succeed, fail, sleep)
import Task.Extra   as Task
import Random       exposing (Generator, float)
import Random.Extra exposing (map, constant, flatMap)
import Time         exposing (Time)
import Signal       exposing (Address)

{-| Generate a successful task from a generator of successful values
-}
task : Generator value -> Generator (Task error value)
task generator =
  map succeed generator

{-| Generate a failed task from a generator of error values
-}
error : Generator error -> Generator (Task error value)
error generator =
  map fail generator

{-| Generate a timeout of given time
-}
timeout : Time -> Generator (Task error ())
timeout time =
  constant (sleep time)

{-| Generate a timeout which times out at some point between a given minimum
and maximum time
-}
rangeLengthTimeout : Time -> Time -> Generator (Task error ())
rangeLengthTimeout minTime maxTime =
  flatMap timeout (float minTime maxTime)


{-| Generate a task that is spawned in some independent thread given a
task generator
-}
spawn : Generator (Task x value) -> Generator (Task y ThreadID)
spawn generator =
  map Task.spawn generator


{-| Generate a sequence of tasks that are run in series from a list of tasks
-}
sequence : Generator (List (Task error value)) -> Generator (Task error (List value))
sequence generator =
  map Task.sequence generator


{-| Generate a sequence of tasks that are run in parallel from a list of tasks
-}
parallel : Generator (List (Task error value)) -> Generator (Task error (List ThreadID))
parallel generator =
  map Task.parallel generator

{-| Generate a sequence of optional tasks that are run in sequence from a list
of tasks
-}
optional : Generator (List (Task x value)) -> Generator (Task y (List value))
optional generator =
  map Task.optional generator

{-| Generate a task that sends randomly generated values to a given address
using a given random generator
-}
send : Address a -> Generator a -> Generator (Task error ())
send address generator =
  map (Signal.send address) generator

{-| Generate a task that broadcasts randomly generated values to a given address
using a given random generator
-}
broadcast : List (Address a) -> Generator a -> Generator (Task error ())
broadcast addresses generator =
  map (Task.broadcast addresses) generator
