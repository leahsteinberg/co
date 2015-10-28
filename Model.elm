module Model where
import Graphics.Input.Field exposing (..)
import Dict exposing (..)


--type Edit = Insert Int String | Delete Int | None | Paste Int String


--type alias Operation = {edit: Edit
--                        , pHash: String
--                        , clientId: ID}

--type alias Update = (Edit, Content)

type alias ID = Int

--id invisible content prev next

type alias WChar = {id: String
        , visible: Int
        , content: Char
        , prev: String
        , next: String}

---- TODO - need a notion of the start and end collabs


type alias Model = {counter: Int
                    , site: ID
                    , wChars: Dict.Dict String WChar
                    , cursor: (Int, WChar)
                    , start: WChar}