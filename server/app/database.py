from sqlmodel import create_engine, Session, SQLModel
from app.config import settings

# Import the models to ensure they are registered with SQLModel's metadata
from app.nutrition.models import MealLog, FoodItem
from app.workout.models import WorkoutLog, ExerciseSet
# Create the engine using the database URL from our config
engine = create_engine(settings.DATABASE_URL, echo=True)

def init_db():
    """
    Creates all tables defined in our models.
    We will call this on app startup.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    FastAPI dependency that provides a transactional database session.
    It automatically closes the connection when the request is complete.
    """
    with Session(engine) as session:
        yield session