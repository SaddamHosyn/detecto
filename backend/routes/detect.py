from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from datetime import datetime
from pathlib import Path
import shutil
import json
import cv2
import numpy as np

# Create router
router = APIRouter()

# Create directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

HISTORY_FILE = Path("detection_history.json")

# Load YOLOv8 model once when the server starts (not on every request)
model = YOLO('yolov8n.pt')
print(f"✅ YOLOv8 model loaded on: {model.device}")


@router.post("/detect")
async def detect_people(file: UploadFile = File(...)):
    """
    Detect people in an uploaded image using YOLOv8.
    Returns the number of people, bounding boxes, and confidence scores.
    """
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file."
        )
    
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Run YOLOv8 inference
        start_time = datetime.now()
        results = model(str(file_path))
        inference_time = (datetime.now() - start_time).total_seconds()
        
        # Extract person detections (class 0 in COCO dataset)
        detections = []
        person_count = 0
        total_confidence = 0
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls)
                class_name = result.names[class_id]
                
                # Filter for "person" class only
                if class_name == 'person':
                    confidence = float(box.conf)
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    detections.append({
                        "class": class_name,
                        "confidence": round(confidence, 4),
                        "bbox": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2)
                        }
                    })
                    
                    person_count += 1
                    total_confidence += confidence
        
        # Calculate average confidence
        avg_confidence = (total_confidence / person_count) if person_count > 0 else 0
        
        # Save to history
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "person_count": person_count,
            "average_confidence": round(avg_confidence, 4),
            "inference_time": round(inference_time, 3)
        }
        
        # Append to history file
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, 'r') as f:
                history = json.load(f)
        else:
            history = []
        
        history.append(history_entry)
        
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
        
        # Return results
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "filename": file.filename,
                "person_count": person_count,
                "average_confidence": round(avg_confidence, 4),
                "inference_time_seconds": round(inference_time, 3),
                "detections": detections
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )
    
    finally:
        file.file.close()
