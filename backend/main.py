from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import detect, history

# Create the FastAPI app instance
app = FastAPI(
    title="Person Detection API",
    description="API for detecting and counting people in images",
    version="1.0.0"
)

# Configure CORS to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the route modules
app.include_router(detect.router, prefix="/api", tags=["Detection"])
app.include_router(history.router, prefix="/api", tags=["History"])

# Root endpoint to verify the API is running
@app.get("/")
async def root():
    return {
        "message": "Person Detection API is running",
        "status": "active",
        "docs": "/docs"
    }
