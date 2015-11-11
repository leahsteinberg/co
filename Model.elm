module Model where
import Graphics.Input.Field exposing (..)
import Dict exposing (..)
import Set exposing (..)




type alias ID = Int

type alias Doc = {cp: Int, str: String, len: Int}


type alias WChar = {id: WId
                , next: WId
                , prev: WId
                , vis: Int
                , ch: Char}

type alias WString = List WChar

type WUpdate = Insert WChar | Delete WChar | NoUpdate | SiteId Int | Caret Int

type Edit = W WUpdate | T TUpdate

type TUpdate = I Char Int | D Char Int | NoTUpdate


type alias WId = (Int, Int)

type alias Model = 
                {
                    counter: Int
                    , site: ID
                    , wString: WString
                    , start: WChar
                    , doc: Doc
                    , debug: String
                    , wSeen: Set WId
                    , pool: List WUpdate
                    , processedPool: List WUpdate
                }


