from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional  # <-- FIX: Added Optional here
from app.config import settings

# 1. Initialize the official Google GenAI Client
client = genai.Client(api_key=settings.GEMINI_API_KEY)


# --- NUTRITION SCHEMAS ---
class FoodItemPrediction(BaseModel):
    name: str = Field(description="The clean name of the food item, e.g., 'Large Egg'")
    serving_size: str = Field(description="The quantity or weight analyzed, e.g., '2 items' or '100g'")
    calories: int = Field(description="Estimated calories")
    protein: int = Field(description="Estimated protein in grams")
    carbs: int = Field(description="Estimated carbohydrates in grams")
    fat: int = Field(description="Estimated fat in grams")

class MealAnalysisResponse(BaseModel):
    total_calories: int = Field(description="Sum of all food item calories")
    total_protein: int = Field(description="Sum of all food item protein")
    total_carbs: int = Field(description="Sum of all food item carbs")
    total_fat: int = Field(description="Sum of all food item fat")
    food_items: List[FoodItemPrediction] = Field(description="List of individual food items found in the description")


# --- WORKOUT SCHEMAS ---
class ExerciseSetPrediction(BaseModel):
    exercise_name: str = Field(description="Name of the exercise, capitalized, e.g., 'Bench Press'")
    set_number: int = Field(description="The sequential set number starting from 1")
    weight: float = Field(description="The amount of weight lifted")
    reps: int = Field(description="The number of repetitions completed")
    rpe: Optional[int] = Field(None, description="Rate of Perceived Exertion from 1 to 10 if implied, otherwise null")

class WorkoutAnalysisResponse(BaseModel):
    workout_name: str = Field(description="A clean title for the workout, e.g., 'Chest & Triceps' or 'Strength Training'")
    exercise_sets: List[ExerciseSetPrediction] = Field(description="List of all individual sets parsed from the text")


# --- SERVICE FUNCTIONS ---
def analyze_meal_text(text_input: str) -> MealAnalysisResponse:
    """
    Sends raw text to Gemini and forces it to return a structured nutritional breakdown.
    """
    prompt = f"""
    You are an expert nutritionist AI. Analyze the following meal description and estimate its nutritional breakdown:
    "{text_input}"
    
    Break down the text into distinct food items and calculate the macronutrients (protein, carbs, fat) and total calories for each.
    If the quantities are vague, use standard realistic serving sizes.
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MealAnalysisResponse,
            temperature=0.1, 
        ),
    )
    return response.parsed
    

def analyze_workout_text(text_input: str) -> WorkoutAnalysisResponse:
    """
    Sends raw workout text to Gemini and forces it to return a structured workout breakdown.
    """
    prompt = f"""
    You are an elite strength and conditioning coach AI. Analyze the following workout log entry:
    "{text_input}"
    
    CRITICAL INSTRUCTIONS:
    1. Parse EVERY single exercise mentioned in the text. Do not omit any movements.
    2. For each exercise, look at the number of sets. If a user says '3 sets of 10 reps', 
       you must output 3 separate distinct set objects tracking set_number 1, 2, and 3 sequentially.
    3. Keep tracking the set_number sequence starting back at 1 whenever a new exercise begins.
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=WorkoutAnalysisResponse,
            temperature=0.1,
        ),
    )
    return response.parsed