module Model where
import Graphics.Input.Field exposing (..)
import Dict exposing (..)
import Set exposing (..)



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

type alias WString = List WChar

type WUpdate =  Insert WChar | Delete WChar | NoUpdate | SiteId Int | Caret Int

type Edit = W WUpdate | T Doc 


type alias WId = (Int, Int)

type alias Model = 
                {
                    counter: Int
                    , site: ID
                    , wString: WString
                    , start: WChar
                    , pool: List WUpdate
                    , doc: Doc
                    , debug: String
                    , wSeen: Set WId
                    , processedPool: List WUpdate
                }


