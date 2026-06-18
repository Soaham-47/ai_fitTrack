from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.nutrition.models import MealLog, FoodItem
from app.ai.service import analyze_meal_text 
from app.auth.router import get_current_user, User

router = APIRouter()

# --- Pydantic Schemas for Frontend Communication ---
class TextAnalysisRequest(BaseModel):
    text_input: str

class FoodItemCreate(BaseModel):
    name: str
    serving_size: str
    calories: int
    protein: int
    carbs: int
    fat: int

class MealLogCreate(BaseModel):
    raw_text_input: str | None = None
    image_url: str | None = None
    total_calories: int
    total_protein: int
    total_carbs: int
    total_fat: int
    food_items: List[FoodItemCreate]

class FoodItemResponse(BaseModel):
    id: int
    meal_log_id: int
    name: str
    serving_size: str
    calories: int
    protein: int
    carbs: int
    fat: int

class MealLogRead(BaseModel):
    id: int
    timestamp: datetime
    raw_text_input: str | None = None
    image_url: str | None = None
    total_calories: int
    total_protein: int
    total_carbs: int
    total_fat: int
    food_items: List[FoodItemResponse] = []


# --- API Endpoints ---

@router.post("/analyze", response_model=MealLogRead, status_code=status.HTTP_201_CREATED)
async def analyze_and_log_meal(
    payload: TextAnalysisRequest, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Passes raw text to Gemini AI, breaks down the ingredients/macros,
    and automatically commits the results to the PostgreSQL database.
    """
    if not payload.text_input.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Text input cannot be empty."
        )

    try:
        # 1. Trigger the Gemini API via our AI service layer
        ai_prediction = analyze_meal_text(payload.text_input)
        
        # 2. Map the structural response into our database MealLog record
        db_meal = MealLog(
            user_id=current_user.id,
            raw_text_input=payload.text_input,
            total_calories=ai_prediction.total_calories,
            total_protein=ai_prediction.total_protein,
            total_carbs=ai_prediction.total_carbs,
            total_fat=ai_prediction.total_fat
        )
        session.add(db_meal)
        session.commit()
        session.refresh(db_meal)  # Generates the db_meal.id

        # 3. Save each generated food item from the AI prediction layout
        for item in ai_prediction.food_items:
            db_food = FoodItem(
                meal_log_id=db_meal.id,
                name=item.name,
                serving_size=item.serving_size,
                calories=item.calories,
                protein=item.protein,
                carbs=item.carbs,
                fat=item.fat
            )
            session.add(db_food)
        
        session.commit()
        session.refresh(db_meal)
        
        # Force SQLModel to lazy-load the children relationship array before returning
        _ = db_meal.food_items  
        
        return db_meal

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )


@router.post("/meals", response_model=MealLogRead, status_code=status.HTTP_201_CREATED)
async def create_meal_log(
    payload: MealLogCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Log a new meal and its associated food items into the database manually."""
    db_meal = MealLog(
        user_id=current_user.id,
        raw_text_input=payload.raw_text_input,
        image_url=payload.image_url,
        total_calories=payload.total_calories,
        total_protein=payload.total_protein,
        total_carbs=payload.total_carbs,
        total_fat=payload.total_fat
    )
    session.add(db_meal)
    session.commit()
    session.refresh(db_meal)

    for item in payload.food_items:
        db_food = FoodItem(
            meal_log_id=db_meal.id,
            name=item.name,
            serving_size=item.serving_size,
            calories=item.calories,
            protein=item.protein,
            carbs=item.carbs,
            fat=item.fat
        )
        session.add(db_food)
    
    session.commit()
    session.refresh(db_meal)
    return db_meal


@router.get("/meals", response_model=List[MealLogRead])
async def get_meals(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Fetch logged meals exclusively for the authenticated user."""
    statement = (
        select(MealLog)
        .options(selectinload(MealLog.food_items))
        .where(MealLog.user_id == current_user.id)
        .order_by(MealLog.timestamp.desc())
    )
    results = session.exec(statement).all()
    return results