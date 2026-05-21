from fastapi import APIRouter
from pydantic import BaseModel
from pathlib import Path
import json

router = APIRouter()

SETTINGS_FILE = Path("app_settings.json")

class DetectionSettings(BaseModel):
    confidence_threshold: float = 0.85
    sound_alerts_enabled: bool = True
    discord_alerts_enabled: bool = True
    webhook_url: str = ""

def load_settings():
    """Load settings from file"""
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    return {
        "confidence_threshold": 0.68,
        "sound_alerts_enabled": True,
        "discord_alerts_enabled": True,
        "webhook_url": ""
    }

def save_settings(settings: dict):
    """Save settings to file"""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

@router.get("/settings")
async def get_settings():
    """Get current settings"""
    return load_settings()

@router.post("/settings")
async def update_settings(settings: DetectionSettings):
    """Update settings"""
    settings_dict = settings.dict()
    save_settings(settings_dict)
    return {"success": True, "settings": settings_dict}
