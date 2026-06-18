import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "FitTrack AI"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    # This defaults to a local Postgres setup if no environment variable is found
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fittrack"
    
    # AI Settings
    GEMINI_API_KEY: str

    # Automatically look for a .env file in the root directory
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        extra="ignore"
    )

# Instantiate the settings object for use across the application
settings = Settings()