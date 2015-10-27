module ConvertJson where
import Json.Encode as Enc exposing (encode, object, string)
import Json.Decode exposing (..)
import Model exposing (..)
import Char exposing (toCode)
import String exposing (toList)

import Debug


--decodeInsert : String -> Edit
--decodeInsert str = 
--    let
--        decoder = object2 (,) ("parent" := string) (id)

editToJson : Edit -> String
editToJson edit = 
    let
        editValue = getEditValue edit 
    in 
        encode 2 editValue



getEditValue edit =
    case edit of
        Insert num str -> object [("type", Enc.string "Insert"), ("loc", Enc.string (toString num)), ("content", Enc.string str)]
        Delete num -> object [("type", Enc.string "Delete"), ("loc", Enc.string (toString num))]
        Paste num str -> object []
        None -> object []


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

