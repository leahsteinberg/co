module ConvertJson where
import Json.Encode as Enc exposing (encode, object, string)
import Json.Decode as Dec exposing (..)
import Model exposing (..)
import Char exposing (toCode)
import String exposing (toList)
import List exposing (head)
import Debug
import Result exposing (..)

--decodeInsert : String -> Edit
--decodeInsert str = 
--    let
--        decoder = object2 (,) ("parent" := string) (id)

--editToJson : Edit -> String
--editToJson edit = 
--    let
--        editValue = getEditValue edit 
--    in 
--        encode 2 editValue


decId = ("id" := Dec.string)

decVis = ("vis" := Dec.int)

decNext = ("next" := Dec.string)
decPrev = ("prev" := Dec.string)
decCh = ("ch" := Dec.string)


toChar : String -> Char
toChar str = 
    case head (toList str) of
        Just l -> l
        _ -> '$'


jsonToWUpdate : String -> WUpdate
jsonToWUpdate str = 
    case Dec.decodeString ("type" := Dec.string) str of
        Ok x -> decodeWUpdate x str
        Err error -> NoUpdate


decodeWUpdate : String -> String -> WUpdate
decodeWUpdate typeStr str =
    if 
        | typeStr == "Insert" -> decodeWInsert str
        | typeStr == "Delete" -> decodeWDelete str
        | typeStr == "SiteId" -> decodeWSiteId str
        | otherwise -> NoUpdate



decodeWDelete : String -> WUpdate
decodeWDelete str = 
    case Dec.decodeString wCharDecoder str of
        Ok wCh -> Delete wCh 
        Err e -> NoUpdate


decodeWSiteId : String -> WUpdate
decodeWSiteId str = 
    case Dec.decodeString wSiteIdDecoder str of
        Ok siteId -> SiteId siteId
        Err e -> NoUpdate


decodeWInsert : String -> WUpdate
decodeWInsert str = 
    case Dec.decodeString wCharDecoder str of
        Ok wCh -> Insert wCh
        Err e -> NoUpdate


wCharDecoder : Decoder WChar
wCharDecoder = 
    Dec.object5 
            (\id next prev vis chr -> WChar id next prev vis (toChar chr))
                decId decNext decPrev decVis decCh

wSiteIdDecoder : Decoder Int
wSiteIdDecoder = "siteId" := int


wUpdateToJson : WUpdate -> String
wUpdateToJson wUpdate =
    let
        wUpValue = encodeWUpdate wUpdate
    in
        encode 2 wUpValue


--encodeWUpdate wUp =
--    case wUp of
--    Insert wCh -> encodeWInsert wCh


encodeWInsert wCh =
    object [("id", Enc.string wCh.id)
            , ("ch", Enc.string (String.fromChar wCh.ch))
            , ("next", Enc.string wCh.next)
            , ("prev", Enc.string wCh.prev)
            , ("vis", Enc.int wCh.vis)]        


encodeWUpdate : WUpdate -> Value
encodeWUpdate wUp =
    case wUp of
        Insert wCh -> object (("type", Enc.string "Insert") :: wCharToJsonList wCh)
        Delete wCh -> object (("type", Enc.string "Delete") :: wCharToJsonList wCh)
        NoUpdate -> object [("type", Enc.string "NoUpdate")]


wCharToJsonList : WChar -> List (String, Value)
wCharToJsonList wCh = 
                    [     ("id", Enc.string wCh.id)
                        , ("prev", Enc.string wCh.prev)
                        , ("next", Enc.string wCh.next)
                        , ("vis", Enc.int wCh.vis)
                        , ("ch", Enc.string (String.fromChar wCh.ch))
                    ]





--getEditValue edit =
--    case edit of
--        Insert num str -> object [("type", Enc.string "Insert"), ("loc", Enc.string (toString num)), ("content", Enc.string str)]
--        Delete num -> object [("type", Enc.string "Delete"), ("loc", Enc.string (toString num))]
--        Paste num str -> object []
--        None -> object []


mod : Int -> Int -> Int
mod modBy modThis = modThis % modBy
--jsonToEdit : String -> Edit
--jsonToEdit str = 
--    let 
--        typeString = decodeString ("type" := string) str
--    in
--        | typeString == "Insert" -> decodeInsert str
--        | typeString == "Delete" -> decodeDelete str
--        | otherwise -> None

hashString : String -> Int
hashString str = 
    List.foldl (\ch (i, acc) ->  (i + 1, (toCode ch) * i + acc)) (1, 1) (toList str)
                |> snd
                |> mod 1299827

