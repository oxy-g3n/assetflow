from fastapi import APIRouter, Depends, HTTPException

from app import schemas
from app.api.deps import get_current_user
from agent_runner import AgentRunner
from model_editor import DEFAULT_AGENT_TYPE, generate_model_update


router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    dependencies=[Depends(get_current_user)],
)


def _run_model_editor(
    payload: schemas.ModelEditorRequest,
    agent_type: str,
) -> schemas.ModelEditorResponse:
    try:
        result = generate_model_update(
            current_model=payload.current_model.model_dump(),
            user_instruction=payload.prompt,
            agent_type=agent_type,
        )
        archive_output = result.get("archive_output") or []
        model = AgentRunner.archive_output_to_model(archive_output)
        return schemas.ModelEditorResponse(
            model=schemas.DataModelPayload(**model),
            raw_output=result["raw_output"],
            archive_output=archive_output,
            summary=archive_output[1] if len(archive_output) > 1 else None,
            relevance_flag=archive_output[2] if len(archive_output) > 2 else None,
            agent_type=result["agent_type"],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/model-editor", response_model=schemas.ModelEditorResponse)
def update_model(payload: schemas.ModelEditorRequest):
    return _run_model_editor(payload, payload.agent_type)


@router.post("/conceptual-model", response_model=schemas.ModelEditorResponse)
def update_conceptual_model(payload: schemas.ModelEditorRequest):
    return _run_model_editor(payload, DEFAULT_AGENT_TYPE)
