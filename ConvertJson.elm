module ConvertJson where
import Json.Encode as Enc exposing (encode, object, string)
import Json.Decode as Dec exposing (..)
import Model exposing (..)
import Char exposing (toCode)
import String exposing (toList)
import List exposing (head)
import Woot exposing (wToString)
import Debug
import Result exposing (..)



wUpdateDecoder : Decoder WUpdate
wUpdateDecoder =
  oneOf
  [
  siteIdDecoder
   , insertDeleteDecoder

    ]



insertDeleteDecoder : Decoder WUpdate
insertDeleteDecoder =
  object6 (\t id ch vis next prev ->
    if t == "Insert" then
    Insert (wCharMaker id ch vis next prev)
    else
    Delete (wCharMaker id ch vis next prev))
      ("type" := Dec.string)
        decodeId
        ("ch" := Dec.string)
        ("vis" := Dec.int)
        decNext
        decPrev


wDeleteDecoder : Decoder WUpdate
wDeleteDecoder =
  object5 (\id ch vis next prev -> Delete (wCharMaker id ch vis next prev))
        decodeId
        ("ch" := Dec.string)
        ("vis" := Dec.int)
        decNext
        decPrev

siteIdDecoder : Decoder WUpdate
siteIdDecoder = object1 (\id -> SiteId id) ("siteId" := int)



wCharMaker : (Int, Int) -> String -> Int -> (Int, Int) -> (Int, Int) -> WChar
wCharMaker id strCh vis next prev =
  {id = id, ch = toChar strCh, vis = vis, next = next, prev = prev}

jsonToWUpdates : String -> List WUpdate
jsonToWUpdates str =
  case Dec.decodeString (Dec.list wUpdateDecoder) str of
    Ok x -> x
    Err err -> [NoUpdate]



jsonObjToWUpdate : String -> WUpdate
jsonObjToWUpdate str =
    case Dec.decodeString ("type" := Dec.string) str of
        Ok x -> decodeWUpdate x str
        Err error -> NoUpdate


jsonToTUpdate : String -> TUpdate
jsonToTUpdate str =
    case Dec.decodeString ("type" := Dec.string) str of
        Ok x -> decodeTUpdate x str
        Err error -> NoTUpdate


decodeId = ("id" := Dec.tuple2 (,) int int)
decVis = ("vis" := Dec.int)
decNext = ("next" := Dec.tuple2 (,) int int)
decPrev = ("prev" := Dec.tuple2 (,) int int)
decCh = ("ch" := Dec.string)


toChar : String -> Char
toChar str =
    case head (toList str) of
        Just l -> l
        _ -> '$'


decodeTUpdate : String -> String -> TUpdate
decodeTUpdate typeStr str =
    if typeStr == "Insert" then
        case Dec.decodeString tInsertDecoder str of
            Ok x -> x
            Err error -> NoTUpdate
    else if typeStr == "Delete" then
            case Dec.decodeString tDeleteDecoder str of
                Ok x -> x
                Err error -> NoTUpdate
    else if typeStr == "InsertString" then
        case Dec.decodeString tInsertStringDecoder str of
            Ok x -> x
            Err error -> NoTUpdate
    else if typeStr == "DeleteString" then
        case Dec.decodeString tDeleteStringDecoder str of
            Ok x -> x
            Err error -> NoTUpdate
    else if typeStr == "RequestWString" then
        RequestWString
    else NoTUpdate

tInsertStringDecoder : Decoder TUpdate
tInsertStringDecoder =
  object2
    (\str cp -> IS str cp )
      ("str" := Dec.string) decCP 

tDeleteStringDecoder : Decoder TUpdate
tDeleteStringDecoder =
  object2
    (\str cp -> DS str cp )
      ("str" := Dec.string) decCP


tInsertDecoder :  Decoder TUpdate
tInsertDecoder  =
    object3
        (\ ch  cp siteId -> I (toChar ch) cp siteId)
        decCh decCP ("siteId" := Dec.int)

tDeleteDecoder : Decoder TUpdate
tDeleteDecoder =
    object2 (\ ch cp -> D (toChar ch) cp) ("ch" := Dec.string) ("cp" := Dec.int)


decCP = ("cp" := Dec.int)



decodeWUpdate : String -> String -> WUpdate
decodeWUpdate typeStr str =
    if typeStr == "Insert" then decodeWInsert str
    else if typeStr == "Delete" then decodeWDelete str
    else if typeStr == "SiteId" then decodeWSiteId str
    else if typeStr == "CurrWString" then decodeCurrWString str
    else NoUpdate



decodeWInsert : String -> WUpdate
decodeWInsert str =
    case Dec.decodeString wCharDecoder str of
        Ok wCh -> Insert wCh
        Err e -> NoUpdate



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




decodeCurrWString : String -> WUpdate
decodeCurrWString str =
    case Dec.decodeString wStringDecoder str of
        Ok wString -> CurrWString wString (wToString wString)
        Err e -> NoUpdate


wStringDecoder : Decoder WString
wStringDecoder =
    Dec.list (wCharDecoder) 


wCharDecoder : Decoder WChar
wCharDecoder =
    Dec.object5
            (\ id next prev vis chr -> WChar id next prev vis (toChar chr))
                decodeId decNext decPrev decVis decCh

wSiteIdDecoder : Decoder Int
wSiteIdDecoder = "siteId" := int

-- - - - - - - -  - - - - - --

tUpdatesToJson : List TUpdate -> String
tUpdatesToJson tUpdates =
  let
      tUpdateListValue = Enc.list (List.map encodeTUpdate tUpdates)
  in
      encode 2 tUpdateListValue



tUpdateToJson : TUpdate -> String
tUpdateToJson tUpd =
    let
        tUpValue = encodeTUpdate tUpd
    in
        encode 2 tUpValue


wUpdatesToJson : List WUpdate -> String
wUpdatesToJson wUpdates =
  let
      wUpdateListValue = Enc.list (List.map encodeWUpdate wUpdates)
  in
      encode 2 wUpdateListValue


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
        


        CurrWString wString str -> object [("type", Enc.string "CurrWString")
                                        , ("WString", Enc.list  (List.map (\wCh -> object (wCharToJsonList wCh)) wString))
                                        , ("String", Enc.string str)]
        _ -> object [("type", Enc.string "NoUpdate")]


wCharToJsonList : WChar -> List (String, Value)
wCharToJsonList wCh =
                    [     ("id", Enc.list [Enc.int (fst wCh.id), Enc.int (snd wCh.id)])
                        , ("prev", Enc.list [Enc.int (fst wCh.prev), Enc.int (snd wCh.prev)])
                        , ("next", Enc.list [Enc.int (fst wCh.next), Enc.int (snd wCh.next)])
                        , ("vis", Enc.int wCh.vis)
                        , ("ch", Enc.string (String.fromChar wCh.ch))
                    ]


tDelToJsonList : Char -> Int -> List (String, Value)
tDelToJsonList ch index =
    [
        ("ch", Enc.string (String.fromChar ch))
        , ("index", Enc.int index)

    ]


tInsertToJsonList : Char -> Int -> Int -> List (String, Value)
tInsertToJsonList ch index siteId =
    [
        ("ch", Enc.string (String.fromChar ch))
        , ("index", Enc.int index)
        , ("siteId", Enc.int siteId)

    ]

encodeTUpdate : TUpdate -> Value
encodeTUpdate tUp =
    case tUp of
        I ch index siteId -> object (("type", Enc.string "typingInsert") :: tInsertToJsonList ch index siteId)
        D ch index -> object (("type", Enc.string "typingDelete") :: tDelToJsonList ch index)
        _ -> object [("type", Enc.string "typingNoUpdate")]

