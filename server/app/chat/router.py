from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel
from google import genai

from app.auth.models import User
from app.auth.router import get_current_user
from app.database import get_session
from app.config import settings
from app.ai.service import embed_text
from app.rag.memory import retrieve_memory_context

router = APIRouter()

# Reuse the initialized GenAI client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    response: str


def gather_user_context(session: Session, user_id: int, query_text: str) -> str:
    """Retrieve semantically relevant history for a user and format it for the AI."""
    query_embedding = embed_text(query_text)
    return retrieve_memory_context(session, user_id=user_id, query_text=query_text, embedding=query_embedding, limit=5)


@router.post("/coach", response_model=ChatMessageResponse)
async def fitness_coach_chat(
    payload: ChatMessageRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Chat endpoint that retrieves relevant user history and passes it as context to Gemini."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        db_context = gather_user_context(session, user_id=current_user.id, query_text=payload.message)

        system_instruction = f"""
        You are 'FitTrack AI Coach', an expert personal trainer and clinical nutritionist.
        Use the user's historical fitness data provided below to answer their question accurately.
        Be encouraging, analytical, and highly specific to their real numbers.
        If the retrieved context is limited or empty, say so and answer conservatively.

        RETRIEVED CONTEXT:
        {db_context}
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=payload.message,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7
            )
        )

        return ChatMessageResponse(response=response.text)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot processing failed: {str(e)}"
        )