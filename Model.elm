module Model where
import Graphics.Input.Field exposing (..)


type Edit = Insert Int String | Delete Int | None | Paste Int String


type alias Operation = {edit: Edit
                        , pHash: String
                        , clientId: ID}

type alias Update = (Edit, Content)

type alias ID = Int