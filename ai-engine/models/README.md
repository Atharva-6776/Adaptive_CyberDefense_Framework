# AI Engine - PPE Detection Model

Place the trained YOLO PPE detection model (`best.pt`) in this directory.

**Required path:** `ai-engine/models/best.pt`

The backend service loads this model via the `MODEL_PATH` environment variable.

> **Do NOT commit the `.pt` model file to version control.**
> Model files are typically large binary artifacts and should be managed separately.

## How to obtain the model

The PPE detection model was trained separately by the AI/Video team using YOLOv8.
Contact the team lead for the latest `best.pt` artifact.
