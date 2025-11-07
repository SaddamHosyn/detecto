from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json

router = APIRouter()

HISTORY_FILE = Path("detection_history.json")


@router.get("/history")
async def get_detection_history():
    """
    Retrieve all detection history records.
    """
    try:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, 'r') as f:
                history = json.load(f)
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "total_detections": len(history),
                    "history": history
                }
            )
        else:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "total_detections": 0,
                    "history": []
                }
            )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )


@router.delete("/reset")
async def reset_detection_history():
    """
    Clear all detection history.
    """
    try:
        if HISTORY_FILE.exists():
            HISTORY_FILE.unlink()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Detection history cleared successfully"
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
