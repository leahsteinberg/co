module Random.Mailbox where
{-| List of Mailbox Generators

# Generators
@docs mailbox, address
-}

import Signal       exposing (Mailbox, Address)
import Random       exposing (Generator)
import Random.Extra exposing (map)


{-| Generates a random mailbox
-}
mailbox : Generator a -> Generator (Mailbox a)
mailbox generator =
  map Signal.mailbox generator


{-| Generates a random mailbox address
-}
address : Generator a -> Generator (Address a)
address generator =
  map .address (mailbox generator)
