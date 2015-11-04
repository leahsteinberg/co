module Model where
import Graphics.Input.Field exposing (..)
import Dict exposing (..)



--type Edit = Insert Int String | Delete Int | None | Paste Int String


--type alias Operation = {edit: Edit
--                        , pHash: String
--                        , clientId: ID}

--type alias Update = (Edit, Content)

type alias ID = Int

type alias Doc = {cp: Int, str: String, len: Int}

--id invisible content prev next

type alias WChar = {id: WId
                , next: WId
                , prev: WId
                , vis: Int
                , ch: Char}

type WUpdate = Insert WChar | Delete WChar | NoUpdate | SiteId Int

type Edit = W WUpdate | T Doc 

---- TODO - need a notion of the start and end collabs

type alias WId = (Int, Int)

type alias Model = {counter: Int
                    , site: ID
                    , wChars: Dict.Dict WId WChar
                    , start: WChar
                    , pool: List WUpdate
                    , doc: Doc
                    , debug: String}


