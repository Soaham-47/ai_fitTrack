from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, text as sa_text
from sqlmodel import Field, SQLModel, Session

from app.config import settings


class MemoryItem(SQLModel, table=True):
    __tablename__ = "memory_item"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    source_type: str = Field(index=True)
    source_id: int = Field(index=True)
    chunk_text: str
    embedding: list[float] = Field(default_factory=list, sa_column=Column(Vector(settings.GEMINI_EMBEDDING_DIMENSIONS)))
    created_at: datetime = Field(default_factory=datetime.utcnow)


def build_meal_memory_chunk(meal) -> str:
    food_summary = ", ".join(
        f"{item.name} ({item.serving_size})" for item in meal.food_items
    ) or "No food details recorded"

    return (
        f"Meal log: {meal.timestamp.isoformat()} | "
        f"Calories={meal.total_calories} | "
        f"Protein={meal.total_protein}g | Carbs={meal.total_carbs}g | Fat={meal.total_fat}g | "
        f"Foods={food_summary} | Raw input={meal.raw_text_input or 'N/A'}"
    )


def build_workout_memory_chunk(workout) -> str:
    exercises = "; ".join(
        f"{entry.exercise_name}: {entry.weight} lbs x {entry.reps} reps (set {entry.set_number})"
        for entry in workout.exercise_sets
    ) or "No exercise details recorded"

    return (
        f"Workout log: {workout.timestamp.isoformat()} | "
        f"Name={workout.name} | Notes={workout.notes or 'N/A'} | Exercises={exercises}"
    )


def save_memory_item(session: Session, *, user_id: int, source_type: str, source_id: int, chunk_text: str, embedding: List[float]) -> MemoryItem:
    item = MemoryItem(
        user_id=user_id,
        source_type=source_type,
        source_id=source_id,
        chunk_text=chunk_text,
        embedding=embedding,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def retrieve_memory_context(session: Session, *, user_id: int, query_text: str, embedding: List[float], limit: int = 5) -> str:
    stmt = sa_text(
        """
        SELECT id, user_id, source_type, source_id, chunk_text,
               1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
        FROM memory_item
        WHERE user_id = :user_id
        ORDER BY embedding <=> CAST(:query_embedding AS vector)
        LIMIT :limit
        """
    )

    result = session.execute(
        stmt,
        {
            "user_id": user_id,
            "query_embedding": str(embedding),
            "limit": limit,
        },
    )
    rows = result.fetchall()

    if not rows:
        return "No relevant user history found."

    formatted = []
    for row in rows:
        formatted.append(f"[{row.source_type} #{row.source_id}] {row.chunk_text}")
    return "\n".join(formatted)
