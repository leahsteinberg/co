module Editor where
import Model exposing (..)
import Constants exposing (..)
import Woot exposing (canIntegrate)
import Graph exposing (generateInsert, generateDelete, integrateRemoteDelete,  integrateRemoteInsert)
import String

integrateRemoteUpdate : WUpdate -> Model -> (Model, List Edit)
integrateRemoteUpdate wUpd m =
    let
        moveToProcessed x m = ({m | processedPool <- x :: m.processedPool}, [])
    in

        case wUpd of
            Insert wCh -> if canIntegrate wUpd m.wSeen 
                        then toEditList  (integrateRemoteInsert wCh m)
                        else  moveToProcessed wUpd m

            Delete wCh -> if canIntegrate wUpd m.wSeen
                                then toEditList (integrateRemoteDelete wCh m)
                                else moveToProcessed wUpd m

--            _ -> integratePool (moveToProcessed wUpd m, prevUpd)
integratePool : Model -> (Model, List Edit)
integratePool model =
    case model.pool of
        [] -> ({model | pool <- model.processedPool, processedPool <- []}, [])
        wUpdate :: wUpdates -> 
            if canIntegrate wUpdate model.wSeen then
-- first we move all updates to pool
-- then we integrate the update
                integrateRemoteUpdate wUpdate {model | pool <- wUpdate :: model.processedPool, processedPool <- []}
            else 
-- move this update to the processedPool, and keep integrating pool
                integratePool {model | pool <- wUpdates, processedPool <- wUpdate :: model.processedPool}

processEdits : List Edit -> Model -> (Model, List Edit)
processEdits edits model = 
  case List.head edits of
    Just edit -> processEdit edit model
    _ -> (model, [])


processEdit : Edit -> Model -> (Model, List Edit)
processEdit edit model =
        case edit of
          T tUpdate -> processTUpdate tUpdate model
          W wUpdate -> processServerUpdate wUpdate model

processServerUpdate : WUpdate -> Model-> (Model, List Edit)
processServerUpdate wUpd model =
    let
        poolUpdate = ({model | pool <- wUpd :: model.pool}, [])
    in
        case wUpd of
            SiteId id -> ({model | site <- id}, [])

            Insert wCh -> if canIntegrate wUpd model.wSeen
                            then toEditList (integrateRemoteInsert wCh model)
                            else poolUpdate

            Delete wCh -> if canIntegrate wUpd model.wSeen
                            then toEditList ( integrateRemoteDelete wCh model)
                            else poolUpdate
            NoUpdate ->  (model, [])
            




processTUpdate : TUpdate -> Model -> (Model, List Edit)
processTUpdate typ model =
    case typ of
        I ch index -> toEditList (generateInsert ch index model)
        D ch index -> toEditList (generateDelete ch index model)
        IS str index -> insertString str index model


insertString : String -> Int -> Model -> (Model, List Edit)
insertString string index model =
    let
      strIndexList = List.map2 (,) (String.toList string) [index..(index + String.length string)]
      tUpdates = List.foldr createInsertTUpdate [] strIndexList
    in
        List.foldr insertCharOfString (model, []) tUpdates


    

insertCharOfString : TUpdate -> (Model, List Edit) -> (Model, List Edit)
insertCharOfString tUpdate (model, edits) =
    let
        (newModel, newEdits) = processTUpdate tUpdate model
    in
        (newModel, newEdits ++ edits)

toEditList : (Model, Edit) -> (Model, List Edit)
toEditList (model, edit) = (model, [edit])

createInsertTUpdate : (Char, Int) -> List TUpdate -> List TUpdate
createInsertTUpdate (char, index) tUpdates = I char index :: tUpdates



sendDebug model str = ({model | debug <- str ++ model.debug}, W NoUpdate)
