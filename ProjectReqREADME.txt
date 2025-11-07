 Overview
In this project, you will build a real-time person detection and counting system. The application will use a FastAPI backend and a React/Vite frontend to process images or video streams, detect people in a frame, and display results with bounding boxes and confidence scores.

You’ll create a full workflow where users can upload or stream footage, detect people in real time, and analyze crowd size or presence over time. This project will introduce you to computer vision, model deployment, and modern web integration.

Role Play
You are working on an automation and safety team. Your goal is to create a system that monitors spaces (like entrances, classrooms, or warehouses) and detects the number of people in each frame. The solution should be accurate, responsive, and easy to use for operators or analysts who need quick visual feedback.

Learning Objectives
Build a React-based dashboard for visual detection and analytics.

Serve a person detection model (YOLO, OpenCV DNN, or similar) through FastAPI.

Display bounding boxes and confidence levels over detected people.

Log detections with timestamps for analysis and monitoring.

Optimize detection speed and visualization for real-world use.

Instructions
AI & Processing
Use a pretrained object detection model (e.g., YOLOv8, SSD, or MobileNet-SSD) trained on COCO or another dataset with person labels.

Apply preprocessing steps (resizing, normalization, contrast adjustment) to prepare frames.

The backend should:

Accept an image or frame (via upload or API).

Run inference and return:

The number of detected people.

The bounding boxes, confidence scores, and positions.

Optionally return the image with overlays (boxes and labels).

Save each detection result with:

Timestamp

Number of people detected

Average confidence

Frontend (React/Vite)
Build two main pages:

Detection View

Upload or stream video frames.

Display bounding boxes for detected people.

Show the total count and confidence for each detection.

Display processing time per frame.

History View

Show a table or graph of detections over time (timestamp vs. number of people).

Include filters (date, time, confidence threshold).

Allow export to CSV.

Display clear error messages for invalid or unsupported files.

Ensure smooth rendering even with multiple detections.

Backend (FastAPI)
Implement endpoints for:

/detect → accepts an image, runs inference, returns:

JSON with count, coordinates, and confidence per person.

Processed image (base64 or file path).

/history → retrieves past detections from storage.

/reset → clears stored detection history.

Store results locally (SQLite, JSON, or CSV).

Handle errors (missing files, empty uploads, unsupported formats).

Include simple performance logging (inference time, accuracy metrics).

Evaluation Metrics
Students should test the model on at least 10 sample images and document results in README.md.

Metric	Description	Target
Detection Accuracy	Correct detections ÷ total visible persons	≥ 85 %
False Positives	Non-person detections	≤ 10 %
Average Inference Time	Time per image (local GPU/CPU)	≤ 1.5 s
Average Confidence	Mean confidence of valid detections	≥ 0.7
System Reliability	Handles all test images without crashing	100 %
Include 2–3 screenshots of successful detections in the README.md.

Log test cases and failures (e.g., occlusion or partial visibility).

Mention what worked well and what could be improved.

Bonus
Add real-time webcam or CCTV feed with detection overlays.

Include region-based alerts (e.g., “too many people in restricted area”).

Implement heatmaps or tracking lines for movement visualization.

Add a small statistics panel (average crowd size per hour).

Support live video capture through browser or local camera.

Dataset
You can use open datasets such as:

COCO Dataset (contains “person” class)

CrowdHuman Dataset

Include at least 10 demo images in frontend/public/samples/ for testing.

Code Quality
Keep code modular, commented, and logically separated.

Backend and frontend should be independently testable.

Use environment variables for API keys or configuration.

The README.md must include:

Project purpose

Setup and run instructions

Example results

Evaluation metrics and screenshots

Project Repository Structure
detecto/
├── frontend/
│   ├── public/
│   │   └── samples/
│   │       ├── frame1.jpg
│   │       ├── frame2.jpg
│   └── src/
│       ├── components/
│       ├── pages/
│       └── App.jsx
│
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── detect.py
│   │   └── history.py
│   ├── models/
│   │   └── record.py
│   ├── utils/
│   │   └── preprocessing.py
│   └── samples/
│       ├── frame1.jpg
│       └── frame2.jpg
│
├── requirements.txt
├── README.md
└── .env
Tips for Success
Start with single image detection before moving to video or streaming.

Keep bounding boxes visible but not cluttered.

Benchmark performance on different image resolutions.

Use GPU acceleration (if available) for faster inference.

Record inference time and average confidence for transparency.

Resources
Ultralytics YOLOv8 Documentation

OpenCV Python Documentation

FastAPI Documentation

React Documentation

Vite Documentation

COCO Dataset. 

RESOURCE: 

https://cocodataset.org/#home.  

https://www.crowdhuman.org/
https://docs.ultralytics.com/
https://docs.opencv.org/4.x/
https://react.dev/

https://vite.dev/  
