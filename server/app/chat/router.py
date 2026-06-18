from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from google import genai

from app.database import get_session
from app.nutrition.models import MealLog
from app.workout.models import WorkoutLog
from app.config import settings

router = APIRouter()

# Reuse the initialized GenAI client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    response: str


def gather_user_context(session: Session) -> str:
    """
    Queries PostgreSQL for historical logs and formats them into a text context block for the AI.
    """
    # Fetch recent meals
    meal_stmt = select(MealLog).options(selectinload(MealLog.food_items)).order_by(MealLog.timestamp.desc()).limit(5)
    recent_meals = session.exec(meal_stmt).all()
    
    # Fetch recent workouts
    workout_stmt = select(WorkoutLog).options(selectinload(WorkoutLog.exercise_sets)).order_by(WorkoutLog.timestamp.desc()).limit(5)
    recent_workouts = session.exec(workout_stmt).all()

    # Format the collected data into a clean text context
    context = "USER HISTORICAL DATA CONTEXT:\n\n"
    
    context += "--- RECENT MEALS LOGGED ---\n"
    if not recent_meals:
        context += "No meals logged yet.\n"
    for meal in recent_meals:
        context += f"- [{meal.timestamp.strftime('%Y-%m-%d %H:%M')}] {meal.raw_text_input} (Calories: {meal.total_calories}kcal, P: {meal.total_protein}g, C: {meal.total_carbs}g, F: {meal.total_fat}g)\n"
        for item in meal.food_items:
            context += f"  * {item.name}: {item.serving_size} ({item.calories}kcal)\n"

    context += "\n--- RECENT WORKOUTS LOGGED ---\n"
    if not recent_workouts:
        context += "No workouts logged yet.\n"
    for workout in recent_workouts:
        context += f"- [{workout.timestamp.strftime('%Y-%m-%d %H:%M')}] {workout.name}\n"
        for s in workout.exercise_sets:
            context += f"  * {s.exercise_name}: Set {s.set_number} - {s.weight}lbs x {s.reps} reps\n"
            
    return context


@router.post("/coach", response_model=ChatMessageResponse)
async def fitness_coach_chat(payload: ChatMessageRequest, session: Session = Depends(get_session)):
    """
    Chat endpoint that fetches real-time database context to provide personalized fitness insights.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        # 1. Fetch user fitness data history dynamically from PostgreSQL
        db_context = gather_user_context(session)
        
        # 2. Build the system directive combined with the retrieved database tables
        system_instruction = f"""
        You are 'FitTrack AI Coach', an expert personal trainer and clinical nutritionist. 
        Use the user's historical fitness data provided below to answer their question accurately.
        Be encouraging, analytical, and highly specific to their real numbers.
        
        {db_context}
        """

        # 3. Call Gemini using explicit config parameters
        # Passing the key explicitly helps resolve SDK initialization bugs on certain local network stacks
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