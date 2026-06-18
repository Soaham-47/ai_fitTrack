from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

class WorkoutLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)  # 🚀 Secured session anchor
    
    name: str = Field(index=True)  # e.g., "Upper Body Push", "Leg Day"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None    # e.g., "Felt a bit tired today"

    # Relationship linking individual exercise entries to this routine
    exercise_sets: List["ExerciseSet"] = Relationship(back_populates="workout_log")


class ExerciseSet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_log_id: int = Field(foreign_key="workoutlog.id")
    
    exercise_name: str = Field(index=True)  # e.g., "Bench Press", "Squat"
    set_number: int                         # e.g., 1, 2, 3
    weight: float                           # e.g., 135.0 (in lbs or kgs)
    reps: int                               # e.g., 10

    # Relationship linking back to the parent workout session record
    workout_log: WorkoutLog = Relationship(back_populates="exercise_sets")