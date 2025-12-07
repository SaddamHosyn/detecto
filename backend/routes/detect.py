from fastapi import APIRouter, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from datetime import datetime
from pathlib import Path
import shutil
import json
import cv2
import numpy as np
import base64

from utils.n8n_connector import process_human_count

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
HISTORY_FILE = Path("detection_history.json")

model = YOLO('yolov8m.pt')
print(f"✅ YOLOv8 model loaded on: {model.device}")

def detect_persons_in_frame(frame: np.ndarray, conf: float = 0.5, iou: float = 0.45):
    """Reusable detection function"""
    results = model(frame, conf=conf, iou=iou, imgsz=640, augment=False)
    
    detections = []
    person_count = 0
    total_confidence = 0
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            class_id = int(box.cls)
            class_name = result.names[class_id]
            
            if class_name == 'person':
                confidence = float(box.conf)
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
    
    avg_confidence = (total_confidence / person_count) if person_count > 0 else 0
    
    return person_count, detections, avg_confidence

# ==================== WEBSOCKET WITH n8n AND HISTORY ====================
@router.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    """
    Real-time person detection with n8n integration and periodic history saving.
    """
    await websocket.accept()
    print("🔌 WebSocket connected for live detection")
    
    last_n8n_call = datetime.now()
    last_history_save = datetime.now()
    n8n_cooldown = 2  # seconds between n8n calls
    history_save_interval = 3  # seconds between history saves (Change this line to control how often history is saved:)
    frame_count = 0
    
    try:
        while True:
            # Receive frame from frontend
            data = await websocket.receive_text()
            frame_count += 1
            
            # Decode base64 image
            img_bytes = base64.b64decode(data.split(',')[1])
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Run detection
            person_count, detections, avg_confidence = detect_persons_in_frame(
                frame, conf=0.5, iou=0.45
            )
            
            current_time = datetime.now()
            
            # Call n8n with cooldown
            n8n_action = None
            time_since_last_n8n = (current_time - last_n8n_call).total_seconds()
            
            if time_since_last_n8n >= n8n_cooldown:
                try:
                    n8n_action = await process_human_count(person_count)
                    last_n8n_call = current_time
                    print(f"🔔 n8n action: {n8n_action} (count: {person_count})")
                except Exception as e:
                    print(f"⚠️ n8n error: {e}")
                    n8n_action = "error"
            
            # Save to history periodically
            time_since_last_save = (current_time - last_history_save).total_seconds()
            
            if time_since_last_save >= history_save_interval:
                try:
                    # Save frame snapshot to uploads
                    snapshot_filename = f"live-snapshot-{current_time.strftime('%Y%m%d-%H%M%S')}.jpg"
                    snapshot_path = UPLOAD_DIR / snapshot_filename
                    cv2.imwrite(str(snapshot_path), frame)
                    
                    # Add to history
                    history_entry = {
                        "timestamp": current_time.isoformat(),
                        "filename": snapshot_filename,
                        "person_count": person_count,
                        "n8n_action": n8n_action if n8n_action else "live_detection",
                        "average_confidence": round(avg_confidence, 4),
                        "inference_time": 0.0,
                        "source": "live_webcam"  # Tag to identify live entries
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
                    
                    last_history_save = current_time
                    print(f"💾 Saved live detection to history (frame {frame_count})")
                    
                except Exception as e:
                    print(f"⚠️ History save error: {e}")
            
            # Send results back
            await websocket.send_json({
                "person_count": person_count,
                "average_confidence": round(avg_confidence, 4),
                "detections": detections,
                "n8n_action": n8n_action,
                "timestamp": current_time.isoformat()
            })
            
    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        await websocket.close()


# ==================== ORIGINAL IMAGE UPLOAD ENDPOINT ====================
@router.post("/detect")
async def detect_people(file: UploadFile = File(...)):
    """Detect people in uploaded image with n8n integration"""
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        img = cv2.imread(str(file_path))
        
        start_time = datetime.now()
        person_count, detections, avg_confidence = detect_persons_in_frame(
            img, conf=0.25, iou=0.45
        )
        inference_time = (datetime.now() - start_time).total_seconds()
        
        # n8n integration
        n8n_action = "unknown"
        try:
            n8n_action = await process_human_count(person_count)
            if not n8n_action:
                n8n_action = "unknown"
        except Exception as e:
            print(f"⚠️ n8n error: {e}")
            n8n_action = "error"

        # Save to history
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "filename": file.filename,
            "person_count": person_count,
            "n8n_action": n8n_action,
            "average_confidence": round(avg_confidence, 4),
            "inference_time": round(inference_time, 3)
        }
        
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, 'r') as f:
                history = json.load(f)
        else:
            history = []
        
        history.append(history_entry)
        
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "filename": file.filename,
                "person_count": person_count,
                "n8n_action": n8n_action,
                "average_confidence": round(avg_confidence, 4),
                "inference_time_seconds": round(inference_time, 3),
                "detections": detections
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        file.file.close()
