from ultralytics import YOLO
import torch

# Check if GPU is available
print(f"Using device: {'cuda' if torch.cuda.is_available() else 'cpu'}")

# Load a pretrained YOLOv8 nano model (smallest and fastest)
print("\nLoading YOLOv8 model...")
model = YOLO('yolov8n.pt')

# The model will automatically download on first use (about 6MB)
print(f"Model loaded on: {model.device}")

# Run inference on a sample image from the internet
print("\nRunning detection on sample image...")
results = model('https://ultralytics.com/images/bus.jpg')

# Display results
for result in results:
    boxes = result.boxes
    print(f"\nDetected {len(boxes)} objects:")
    
    # Filter for only "person" detections (class 0 in COCO dataset)
    for box in boxes:
        class_id = int(box.cls)
        class_name = result.names[class_id]
        confidence = float(box.conf)
        
        if class_name == 'person':
            print(f"  - {class_name}: {confidence:.2%} confidence")

print("\n✅ YOLOv8 test complete!")
