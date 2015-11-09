module ConvertJson where
import Json.Encode as Enc exposing (encode, object, string)
import Json.Decode as Dec exposing (..)
import Model exposing (..)
import Char exposing (toCode)
import String exposing (toList)
import List exposing (head)
import Debug
import Result exposing (..)


decId = ("id" := Dec.tuple2 (,) int int)
decVis = ("vis" := Dec.int)
decNext = ("next" := Dec.tuple2 (,) int int)
decPrev = ("prev" := Dec.tuple2 (,) int int)
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
            (\ id next prev vis chr -> WChar id next prev vis (toChar chr))
                decId decNext decPrev decVis decCh

wSiteIdDecoder : Decoder Int
wSiteIdDecoder = "siteId" := int


wUpdateToJson : WUpdate -> String
wUpdateToJson wUpdate =
    let
        wUpValue = encodeWUpdate wUpdate
    in
        encode 2 wUpValue

stringUpdateToJson : String -> String
stringUpdateToJson str =
    let
        strValue = encodeStringUpdate str
    in
        encode 2 strValue


encodeWInsert wCh =
    object [("id", Enc.string wCh.id)
            , ("ch", Enc.string (String.fromChar wCh.ch))
            , ("next", Enc.string wCh.next)
            , ("prev", Enc.string wCh.prev)
            , ("vis", Enc.int wCh.vis)]        

encodeStringUpdate : String -> Value
encodeStringUpdate str =
    object [("type", Enc.string "StringUpdate"), ("string", Enc.string str)]

encodeWUpdate : WUpdate -> Value
encodeWUpdate wUp =
    case wUp of
        Insert wCh -> object (("type", Enc.string "Insert") :: wCharToJsonList wCh)
        Delete wCh -> object (("type", Enc.string "Delete") :: wCharToJsonList wCh)
        NoUpdate -> object [("type", Enc.string "NoUpdate")]
        Caret n -> object [("type", Enc.string "Caret"), ("pos", Enc.int n)]


wCharToJsonList : WChar -> List (String, Value)
wCharToJsonList wCh = 
                    [     ("id", Enc.list [Enc.int (fst wCh.id), Enc.int (snd wCh.id)])
                        , ("prev", Enc.list [Enc.int (fst wCh.prev), Enc.int (snd wCh.prev)])
                        , ("next", Enc.list [Enc.int (fst wCh.next), Enc.int (snd wCh.next)])
                        , ("vis", Enc.int wCh.vis)
                        , ("ch", Enc.string (String.fromChar wCh.ch))
                    ]


