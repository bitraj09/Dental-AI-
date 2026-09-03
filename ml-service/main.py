import io
import json
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
import os

app = FastAPI()

# Allow Next.js dev server to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Diagnosis model (best.pt) ───────────────────────────────────────────────
here = os.path.dirname(__file__)
DIAGNOSIS_MODEL_PATH = os.path.join(here, "models", "best.pt")
diagnosis_model = None
if os.path.exists(DIAGNOSIS_MODEL_PATH):
    try:
        diagnosis_model = YOLO(DIAGNOSIS_MODEL_PATH)
        print(f"[Diagnosis] Model loaded: {DIAGNOSIS_MODEL_PATH}")
    except Exception:
        import traceback
        print(f"[Diagnosis] Failed to load model at {DIAGNOSIS_MODEL_PATH}")
        traceback.print_exc()
else:
    print(f"[Diagnosis] Warning: Model not found at {DIAGNOSIS_MODEL_PATH}")

# ─── Landmark model (best_landmarks.pt) ──────────────────────────────────────────
LANDMARK_MODEL_PATH = os.path.join(here, "models", "best_landmarks.pt")
landmark_model = None
if os.path.exists(LANDMARK_MODEL_PATH):
    try:
        landmark_model = YOLO(LANDMARK_MODEL_PATH)
        print(f"[Landmark] Model loaded: {LANDMARK_MODEL_PATH}")
        try:
            print(f"[Landmark] Classes ({len(landmark_model.names)}): {landmark_model.names}")
            print(f"[Landmark] Task type: {landmark_model.task}")
        except Exception:
            # Some YOLO model objects may not populate names/task until fully initialized
            pass
    except Exception:
        import traceback
        print(f"[Landmark] Failed to load model at {LANDMARK_MODEL_PATH}")
        traceback.print_exc()
else:
    print(f"[Landmark] Warning: Model not found at {LANDMARK_MODEL_PATH}")

# Vivid colors for landmark overlays (matches frontend palette)
INSTANCE_COLORS = [
    "#FF6B00", "#00E5FF", "#00FF88", "#FF0055", "#FFD600",
    "#2196F3", "#E040FB", "#FF4081", "#76FF03", "#FFAB40",
    "#B388FF", "#64FFDA", "#F48FB1", "#80DEEA", "#B2FF59",
    "#EA80FC", "#18FFFF", "#FF9100", "#40C4FF", "#CCFF90",
    "#FF1744", "#00BFA5", "#FFEA00", "#AA00FF", "#C6FF00",
]

# Exact mapping of all 31 denatlyolo.pt classes → frontend categories
CATEGORY_MAP = {
    # ── Mandible ──────────────────────────────────────────────────────────
    "Sigmoid_notch":                               "mandible",
    "Coronoid_process":                            "mandible",
    "External_oblique_ridge":                      "mandible",
    "Mandibular_canal":                            "mandible",
    "Posterior_border_of_ramus":                   "mandible",
    "Gonial_angle":                                "mandible",
    "Lower_border":                                "mandible",
    "Mental_ridge":                                "mandible",
    "Genial_tubercle":                             "mandible",
    "Mental_foramen":                              "mandible",
    "Internal_oblique_ridge":                      "mandible",
    "Lingula":                                     "mandible",
    # ── TMJ ───────────────────────────────────────────────────────────────
    "Condylar_head":                               "tmj",
    "Glenoid_fossa":                               "tmj",
    "Articular_eminence":                          "tmj",
    # ── Maxilla ───────────────────────────────────────────────────────────
    "Zygomatic_arch":                              "maxilla",
    "Posterior_wall_of_maxillary_sinus":           "maxilla",
    "Floor_of_maxillary_sinus":                    "maxilla",
    "Zygomatic_process_of_maxilla_forming_innominate_line": "maxilla",
    "Hard_palate":                                 "maxilla",
    "Floor_of_the_orbit":                          "maxilla",
    "Incisive_foramen":                            "maxilla",
    "Frontal_process_of_zygomatic_bone":           "maxilla",
    "Pterygomaxillary_fissure":                    "maxilla",
    "Maxillary_tuberosity":                        "maxilla",
    # ── Midline ───────────────────────────────────────────────────────────
    "Nasal_septum":                                "midline",
    "Inferior_concha":                             "midline",
    # ── Other ─────────────────────────────────────────────────────────────
    "Hyoid_bone":                                  "other",
    "Meatus":                                      "other",
    "Spine_of_the_sphenoid_bone":                  "other",
    "Lateral_pterygoid_plate":                     "other",
}

def class_to_category(class_name: str) -> str:
    """Exact match first, then substring fallback."""
    if class_name in CATEGORY_MAP:
        return CATEGORY_MAP[class_name]
    lower = class_name.lower()
    if any(k in lower for k in ["mandib", "ramus", "gonial", "mental", "coronoid", "lingula", "genial", "oblique"]):
        return "mandible"
    if any(k in lower for k in ["condyl", "glenoid", "articular", "tmj"]):
        return "tmj"
    if any(k in lower for k in ["maxill", "palate", "zygomat", "orbit", "incisive", "pterygom", "tuberosity"]):
        return "maxilla"
    if any(k in lower for k in ["nasal", "septum", "concha", "meatus"]):
        return "midline"
    return "other"

def display_name(class_name: str) -> str:
    """Convert snake_case class names to readable Title Case."""
    return class_name.replace("_", " ")

def mask_to_polygon(mask_xy, img_w: int, img_h: int):
    """Convert ultralytics mask contour points → list of {x, y} pixel dicts."""
    if mask_xy is None or len(mask_xy) == 0:
        return []
    pts = mask_xy.astype(float)
    # Downsample to max ~40 points for clean SVG polygon
    step = max(1, len(pts) // 40)
    pts = pts[::step]
    return [{"x": float(p[0]), "y": float(p[1])} for p in pts]

def bbox_to_polygon(box_xyxy):
    """Fallback: convert [x1,y1,x2,y2] bbox to 4-point polygon."""
    x1, y1, x2, y2 = box_xyxy
    return [
        {"x": float(x1), "y": float(y1)},
        {"x": float(x2), "y": float(y1)},
        {"x": float(x2), "y": float(y2)},
        {"x": float(x1), "y": float(y2)},
    ]

# ─── Root ─────────────────────────────────────────────────────────────────────
def check_result_is_valid_opg(result) -> bool:
    """
    Checks if a YOLO prediction result contains a set of landmark detections
    consistent with a valid panoramic dental OPG radiograph.
    """
    if result.boxes is None or len(result.boxes) == 0:
        return False
        
    boxes = result.boxes
    high_conf_detections = [box for box in boxes if float(box.conf[0].item()) >= 0.22]
    unique_classes = set(int(box.cls[0].item()) for box in high_conf_detections)
    
    if len(boxes) > 0:
        max_conf = max(float(box.conf[0].item()) for box in boxes)
    else:
        max_conf = 0.0

    if len(high_conf_detections) >= 3 or len(unique_classes) >= 2 or max_conf >= 0.45:
        return True
        
    return False

@app.get("/")
def read_root():
    return {
        "message": "Dental ML Service running.",
        "diagnosis_model": os.path.exists(DIAGNOSIS_MODEL_PATH),
        "landmark_model": os.path.exists(LANDMARK_MODEL_PATH),
    }

# ─── Diagnosis endpoint ───────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if diagnosis_model is None:
        return JSONResponse(status_code=500, content={"error": "Diagnosis model not loaded."})

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Validate image using landmark model (offline check)
    if landmark_model is not None:
        landmark_results = landmark_model(img, conf=0.05, iou=0.4, verbose=False)
        if not check_result_is_valid_opg(landmark_results[0]):
            return {
                "detections": [],
                "annotated_image": None,
                "isValidXray": False,
            }

    results = diagnosis_model(img)
    annotated_img = results[0].plot()

    _, buffer = cv2.imencode('.jpg', annotated_img)
    base64_img = base64.b64encode(buffer).decode('utf-8')

    detections = []
    for box in results[0].boxes:
        cls_id = int(box.cls[0].item())
        class_name = diagnosis_model.names[cls_id]
        confidence = float(box.conf[0].item())
        coords = box.xyxy[0].tolist()
        detections.append({
            "class": class_name,
            "confidence": confidence,
            "box": coords,
        })

    return {
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{base64_img}",
        "isValidXray": True,
    }

# ─── Landmark endpoint ────────────────────────────────────────────────────────
@app.post("/landmarks")
async def detect_landmarks(file: UploadFile = File(...)):
    if landmark_model is None:
        return JSONResponse(
            status_code=503,
            content={"error": "Custom AI landmark model not loaded."},
        )

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_h, img_w = img.shape[:2]

    # Use very low confidence threshold so we don't miss detections
    # Default conf=0.05 is often used for medical models
    results = landmark_model(img, conf=0.05, iou=0.4, verbose=True)
    result = results[0]

    # Validate image using the results we just generated
    if not check_result_is_valid_opg(result):
        return {
            "landmarks": [],
            "annotated_image": None,
            "model": "custom_ai_landmarks.pt",
            "image_width": img_w,
            "image_height": img_h,
            "isValidXray": False,
        }

    raw_boxes = len(result.boxes) if result.boxes is not None else 0
    raw_masks = len(result.masks) if result.masks is not None else 0
    print(f"[Landmark] Raw detections — boxes: {raw_boxes}, masks: {raw_masks}")
    if raw_boxes > 0:
        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls[0].item())
            print(f"  [{i}] class={landmark_model.names[cls_id]}  conf={float(box.conf[0].item()):.3f}  box={box.xyxy[0].tolist()}")

    # Annotated image
    annotated_img = result.plot()
    _, buffer = cv2.imencode('.jpg', annotated_img)
    base64_img = base64.b64encode(buffer).decode('utf-8')

    landmarks = []
    names = landmark_model.names

    # ── Try segmentation masks first ──────────────────────────────────────────
    has_masks = result.masks is not None and len(result.masks) > 0

    if has_masks:
        for idx, (mask, box) in enumerate(zip(result.masks, result.boxes)):
            cls_id = int(box.cls[0].item())
            class_name = names[cls_id]
            confidence = float(box.conf[0].item())

            # mask.xy is a list of contour point arrays
            mask_pts = mask.xy[0] if len(mask.xy) > 0 else np.array([])
            polygon = mask_to_polygon(mask_pts, img_w, img_h)

            if not polygon:
                polygon = bbox_to_polygon(box.xyxy[0].tolist())

            # Centroid
            xs = [p["x"] for p in polygon]
            ys = [p["y"] for p in polygon]
            cx = sum(xs) / len(xs) if xs else img_w / 2
            cy = sum(ys) / len(ys) if ys else img_h / 2

            color = INSTANCE_COLORS[idx % len(INSTANCE_COLORS)]
            category = class_to_category(class_name)

            landmarks.append({
                "id": f"lm_{idx}_{class_name.lower().replace(' ', '_').replace('/', '_')}",
                "name": display_name(class_name),
                "polygon": polygon,
                "centerX": round(cx),
                "centerY": round(cy),
                "confidence": round(confidence, 4),
                "color": color,
                "category": category,
                "description": f"Segmentation mask detected by Custom AI model",
                "significance": f"{display_name(class_name)} — Confidence: {round(confidence * 100, 1)}%",
            })

    else:
        # ── Fallback: bounding-box mode ────────────────────────────────────────
        for idx, box in enumerate(result.boxes):
            cls_id = int(box.cls[0].item())
            class_name = names[cls_id]
            confidence = float(box.conf[0].item())

            polygon = bbox_to_polygon(box.xyxy[0].tolist())

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2

            color = INSTANCE_COLORS[idx % len(INSTANCE_COLORS)]
            category = class_to_category(class_name)

            landmarks.append({
                "id": f"lm_{idx}_{class_name.lower().replace(' ', '_')}",
                "name": class_name,
                "polygon": polygon,
                "centerX": round(cx),
                "centerY": round(cy),
                "confidence": round(confidence, 4),
                "color": color,
                "category": category,
                "description": f"Detected by Custom AI landmark model",
                "significance": f"Class: {class_name} | Conf: {round(confidence * 100, 1)}%",
            })

    return {
        "landmarks": landmarks,
        "annotated_image": f"data:image/jpeg;base64,{base64_img}",
        "model": "custom_ai_landmarks.pt",
        "image_width": img_w,
        "image_height": img_h,
        "isValidXray": True,
    }


# ─── Forensics endpoint ───────────────────────────────────────────────────────
@app.post("/forensics")
async def analyze_forensics(file: UploadFile = File(...)):
    try:
        from forensic_pipeline import run_forensic_pipeline
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(status_code=400, content={"error": "Could not decode uploaded image."})

        # Validate image using landmark model
        if landmark_model is not None:
            landmark_results = landmark_model(img, conf=0.05, iou=0.4, verbose=False)
            if not check_result_is_valid_opg(landmark_results[0]):
                return {
                    "isValidXray": False,
                    "summary": "The uploaded image does not appear to be a valid OPG panoramic radiograph.",
                    "result": None
                }

        results = run_forensic_pipeline(img)
        return results

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

