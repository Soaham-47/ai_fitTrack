from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.middleware.cors import CORSMiddleware  # <-- 1. IMPORT THE CORS MIDDLEWARE
import os

from app.database import init_db
from app.nutrition.router import router as nutrition_router
from app.workout.router import router as workout_router
from app.chat.router import router as chat_router
from app.auth.router import router as auth_router
from sqlmodel import text 

app = FastAPI(title="FitTrack AI Core Backend", redirect_slashes=False)

# 2. CONFIGURE ALLOWED ORIGINS
origins = [
    "http://localhost:5173",  # Your local React/Vite development server
    "http://127.0.0.1:5173",
    "https://ai-fit-track.vercel.app"
]

# 3. ADD THE MIDDLEWARE TO THE APP
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

templates = Jinja2Templates(directory="app/templates")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    template_path = os.path.join("app", "templates", "index.html")
    with open(template_path, "r", encoding="utf-8") as file:
        html_content = file.read()
    return HTMLResponse(content=html_content, status_code=200)

        
# Register Routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(nutrition_router, prefix="/api/v1/nutrition", tags=["Nutrition"])
app.include_router(workout_router, prefix="/api/v1/workout", tags=["Workout"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["AI Coach"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)

