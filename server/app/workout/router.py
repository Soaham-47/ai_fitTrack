from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import selectinload

from app.database import get_session     
from app.auth.router import get_current_user, User  
from app.workout.models import WorkoutLog, ExerciseSet

router = APIRouter()

# --- Request/Response Schemas ---
class ExerciseSetCreate(BaseModel):
    exercise_name: str
    weight: float
    reps: int

class WorkoutCreate(BaseModel):
    name: str
    notes: Optional[str] = None
    sets: List[ExerciseSetCreate]

# 🚀 NEW: Response Schemas to guarantee serialization of relationships over the wire
class ExerciseSetResponse(BaseModel):
    id: int
    exercise_name: str
    set_number: int
    weight: float
    reps: int

    class Config:
        from_attributes = True

class WorkoutResponse(BaseModel):
    id: int
    user_id: int
    name: str
    timestamp: datetime
    notes: Optional[str] = None
    exercise_sets: List[ExerciseSetResponse] = [] # 🚀 Forces inclusion in JSON output

    class Config:
        from_attributes = True


@router.post("/log", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def log_workout(
    workout_data: WorkoutCreate, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Create the parent workout container
    db_workout = WorkoutLog(
        user_id=current_user.id,
        name=workout_data.name,
        notes=workout_data.notes
    )
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)

    # 2. Add each individual exercise set linking back to the workout container
    for index, set_item in enumerate(workout_data.sets, start=1):
        db_set = ExerciseSet(
            workout_log_id=db_workout.id,
            exercise_name=set_item.exercise_name,
            set_number=index,
            weight=set_item.weight,
            reps=set_item.reps
        )
        db.add(db_set)
    
    db.commit()
    
    # 3. Eagerly reload the freshly populated data structure
    statement = select(WorkoutLog).where(WorkoutLog.id == db_workout.id).options(selectinload(WorkoutLog.exercise_sets))
    result = db.exec(statement).first()
    
    return result


@router.get("/history", response_model=List[WorkoutResponse]) # 🚀 Use response model list here too
def get_workout_history(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = (
        select(WorkoutLog)
        .where(WorkoutLog.user_id == current_user.id)
        .options(selectinload(WorkoutLog.exercise_sets))
        .order_by(WorkoutLog.timestamp.desc())
    )
    results = db.exec(statement).all()
    return results