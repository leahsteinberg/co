module Editor where
import Model exposing (..)
import Constants exposing (..)
import Woot exposing (canIntegrate)
import Graph exposing (generateInsert, generateDelete, integrateRemoteDelete,  integrateRemoteInsert)
import String
import Set exposing (..)

integrateRemoteUpdate : WUpdate -> Model -> (Model, List Edit)
integrateRemoteUpdate wUpd m =
    let
        integrate intFunction wCh = 
            let
                (newModel, newEdits) = toEditList (intFunction wCh m)
                (newIntModel, newIntEdits) = integratePool newModel
            in
                (newIntModel, newIntEdits ++ newEdits)
    in
      case wUpd of
          Insert wCh -> integrate integrateRemoteInsert wCh
          Delete wCh -> integrate integrateRemoteDelete wCh
          _ -> (m, [])

integratePool : Model -> (Model, List Edit)
integratePool model =
    case model.pool of
        [] -> ({model | pool = model.processedPool, processedPool = []}, [])
        wUpdate :: wUpdates -> 
            if canIntegrate wUpdate model.wSeen then
                        -- first we move all updates to pool, so that we'll have to start over
                        -- then we integrate the update
                integrateRemoteUpdate wUpdate {model | pool = model.processedPool ++ wUpdates, processedPool = []}
            else 
                        -- move this update to the processedPool, and keep integrating pool
                integratePool {model | pool = wUpdates, processedPool = wUpdate :: model.processedPool}



processEdits : List Edit -> Model -> (Model, List Edit)
processEdits edits model = processEditsAccum edits model []


processEditsAccum : List Edit -> Model -> List Edit -> (Model, List Edit)
processEditsAccum edits model oldEdits =
  case edits of
    [] -> (model, oldEdits)
    x :: xs -> 
      let 
          (newModel, accEdits) = processEdit x model
      in
          processEditsAccum xs newModel (oldEdits ++ accEdits)


processEdit : Edit -> Model -> (Model, List Edit)
processEdit edit model =
        case edit of
          T tUpdate -> processTUpdate tUpdate model
          W wUpdate -> processServerUpdate wUpdate model


integrateNew : (WChar -> Model -> (Model, Edit)) -> WUpdate -> WChar -> Model -> (Model, List Edit)
integrateNew integrateFunction wUpd wCh model =
    let 
        (newModel, newEdits) = toEditList (integrateFunction wCh model)
        (intNewModel, intNewEdits) = integratePool newModel
    in
        (intNewModel, intNewEdits ++ newEdits)

processServerUpdate : WUpdate -> Model-> (Model, List Edit)
processServerUpdate wUpd model =
  let
      handleIntegration wCh insert integrateFunction = 
          if insert && Set.member wCh.id model.wSeen then
            (model, [])
          else if canIntegrate wUpd model.wSeen then
            integrateNew integrateFunction wUpd wCh model
          else ({model | pool = wUpd :: model.pool}, [])
  in
      case wUpd of
        SiteId id -> ({model | site = id}, [])

        Insert wCh -> handleIntegration wCh True integrateRemoteInsert

        Delete wCh -> handleIntegration wCh False integrateRemoteDelete

        NoUpdate ->  (model, [])


processTUpdate : TUpdate -> Model -> (Model, List Edit)
processTUpdate typ model =
    case typ of
        I ch index siteId -> toEditList (generateInsert ch index model)
        D ch index -> toEditList (generateDelete ch index model)
        IS str index -> 
          let
              (newModel, newEdits) = insertString str (index - 1) model
          in
              (newModel, List.reverse newEdits)
        _ -> (model, [W NoUpdate])



insertString : String -> Int -> Model -> (Model, List Edit)
insertString string index model =
    let
      strIndexList = List.map2 (\ch index -> (ch, index, model.site)) (String.toList string) [index..(index + String.length string - 1)]
      tUpdates = List.foldr createInsertTUpdate [] strIndexList
    in
        List.foldl insertCharOfString (model, []) tUpdates


insertCharOfString : TUpdate -> (Model, List Edit) -> (Model, List Edit)
insertCharOfString tUpdate (model, edits) =
    let
        (newModel, newEdits) = processTUpdate tUpdate model
    in
        (newModel, edits ++ newEdits)

toEditList : (Model, Edit) -> (Model, List Edit)
toEditList (model, edit) = (model, [edit])

createInsertTUpdate : (Char, Int, Int) -> List TUpdate -> List TUpdate
createInsertTUpdate (char, index, siteId) tUpdates =  I char index siteId :: tUpdates


sendDebug model str = ({model | debug = str ++ model.debug}, W NoUpdate)
