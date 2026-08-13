import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.models.camera import Camera
from app.models.alert import Alert
from app.schemas.video import CameraCreate, CameraUpdate, CameraResponse, VideoMetricsResponse
from app.services.video_service import video_service
from app.utils.deps import get_db, get_current_user
from app.models.user import User

logger = logging.getLogger("video_router")

router = APIRouter(prefix="/video", tags=["Surveillance Video Network"])


@router.get("/cameras", response_model=List[CameraResponse])
def list_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve all configured CCTV cameras from database."""
    cameras = db.query(Camera).all()
    # Pydantic serialization alias or custom validation will serialize model to response schema
    return [CameraResponse.model_validate(cam) for cam in cameras]


@router.post("/cameras", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def create_camera(camera_data: CameraCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Configure and register a new camera."""
    db_camera = Camera(**camera_data.model_dump())
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    logger.info(f"Registered new camera: {db_camera.name} ({db_camera.location})")
    return CameraResponse.model_validate(db_camera)


@router.get("/cameras/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve details for a single camera."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return CameraResponse.model_validate(camera)


@router.put("/cameras/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: int, camera_data: CameraUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update camera details (name, stream_url, IP address, etc.)."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    for key, value in camera_data.model_dump(exclude_unset=True).items():
        setattr(camera, key, value)
        
    db.add(camera)
    db.commit()
    db.refresh(camera)
    logger.info(f"Updated camera config for Camera {camera_id}")
    return CameraResponse.model_validate(camera)


@router.delete("/cameras/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(camera_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove a camera registration and stop its active ingestion stream."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    # Stop active stream if running
    if camera.is_ingesting:
        video_service.stop_camera(camera_id, db)
        
    db.delete(camera)
    db.commit()
    logger.info(f"Deleted Camera {camera_id} from database")
    return None


@router.post("/cameras/{camera_id}/start")
def start_camera_feed(camera_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Manually start video stream ingestion and safety violation monitoring."""
    try:
        success = video_service.start_camera(camera_id, db)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to initialize video ingestion stream source.")
        return {"message": "Camera stream ingestion started successfully."}
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference process error: {str(e)}")


@router.post("/cameras/{camera_id}/stop")
def stop_camera_feed(camera_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Manually stop video ingestion stream."""
    success = video_service.stop_camera(camera_id, db)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to stop camera ingestion stream.")
    return {"message": "Camera stream ingestion stopped."}


# MJPEG frame generator
def frame_generator(camera_id: int):
    # Send frames if available, otherwise wait
    while True:
        frame_bytes = video_service.latest_frames.get(camera_id)
        if frame_bytes:
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
            )
        else:
            # Sleep briefly to avoid infinite loop when there's no frame
            time_to_sleep = 0.1
            import time
            time.sleep(time_to_sleep)


@router.get("/live/{camera_id}")
def stream_camera_live(camera_id: int, db: Session = Depends(get_db)):
    """MJPEG stream endpoint for camera view."""
    # Verify camera exists
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    return StreamingResponse(
        frame_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/metrics", response_model=VideoMetricsResponse)
def get_video_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve video metrics for the main system dashboard."""
    total_cameras = db.query(Camera).count()
    online_cameras = db.query(Camera).filter(Camera.status == "online").count()
    active_alerts = db.query(Alert).filter(Alert.status == "active").count()
    
    # Calculate health category
    if active_alerts == 0:
        system_health = "Healthy"
    elif active_alerts <= 2:
        system_health = "Degraded"
    else:
        system_health = "Critical"
        
    return VideoMetricsResponse(
        total_cameras=total_cameras,
        online_cameras=online_cameras,
        active_alerts=active_alerts,
        system_health=system_health
    )
