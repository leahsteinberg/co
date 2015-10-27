module ConvertJson where
import Json.Encode as Enc exposing (encode, object, string)
import Json.Decode exposing (..)
import Model exposing (..)




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
        None -> object []


--jsonToEdit : String -> Edit
--jsonToEdit str = 
--    let 
--        typeString = decodeString ("type" := string) str
--    in
--        | typeString == "Insert" -> decodeInsert str
--        | typeString == "Delete" -> decodeDelete str
--        | otherwise -> None
