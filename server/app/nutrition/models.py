from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

class MealLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # 🚀 ADD THIS FIELD TO LINK MEALS TO USERS:
    user_id: int = Field(foreign_key="user.id", index=True)
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    raw_text_input: Optional[str] = None
    image_url: Optional[str] = None
    
    total_calories: int = Field(default=0)
    total_protein: int = Field(default=0)
    total_carbs: int = Field(default=0)
    total_fat: int = Field(default=0)

    food_items: List["FoodItem"] = Relationship(back_populates="meal_log")


class FoodItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meal_log_id: int = Field(foreign_key="meallog.id")
    
    name: str = Field(index=True)        # e.g., "Chicken Breast"
    serving_size: str                    # e.g., "150g" or "1 cup"
    
    # Nutritional values per item
    calories: int
    protein: int
    carbs: int
    fat: int

    # Relationship linking back to the parent meal log
    meal_log: MealLog = Relationship(back_populates="food_items")