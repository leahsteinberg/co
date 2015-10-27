module Model where
import Graphics.Input.Field exposing (..)


type Edit = Insert Int String | Delete Int | None

type alias Update = (Edit, Content)