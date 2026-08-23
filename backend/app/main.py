import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import setup_logging
from app.routers.auth import router as auth_router
from app.routers.mtd import router as mtd_router
from app.routers.video import router as video_router
from app.routers.alerts import router as alerts_router
from app.routers.security_analytics import router as security_analytics_router
from app.routers.reports import router as reports_router
from app.routers.settings import router as settings_router
from app.services.mtd_service import mtd_service

# Setup logging config
setup_logging()
logger = logging.getLogger("app")


def get_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    logger.info("Starting MTD rotation scheduler...")
    await mtd_service.start_rotation_scheduler()
    
    yield
    
    # Shutdown actions
    logger.info("Stopping MTD rotation scheduler...")
    await mtd_service.stop_rotation_scheduler()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Adaptive Cyber Defense Framework - Backend Foundation with JWT Auth and Moving Target Defense (MTD)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# MTD path translation and honeypot interception middleware
@app.middleware("http")
async def mtd_middleware(request: Request, call_next):
    path = request.url.path
    
    # Bypass MTD interception for docs and schema
    if path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
        return await call_next(request)

    # 1. Decoy path honeypot trap
    if path in mtd_service.decoy_paths:
        client_host = get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")
        headers = dict(request.headers)
        
        mtd_service.log_honeypot_trigger(
            path=path,
            ip_address=client_host,
            user_agent=user_agent,
            headers=headers
        )
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Not Found"}
        )

    # 2. Dynamic path decoding/rewriting
    if path in mtd_service.active_routes:
        real_path = mtd_service.active_routes[path]
        logger.info(f"MTD Router: translating dynamic path {path} -> {real_path}")
        
        # Rewrite the ASGI scope path so FastAPI routers match the real endpoint
        request.scope["path"] = real_path
        # Mark request context to identify it went through dynamic translation
        request.state.is_dynamic_route = True
        
        response = await call_next(request)
        return response

    # 3. Direct access block for protected paths
    if path in mtd_service.protected_paths:
        if mtd_service.enabled:
            # Under MTD, direct calls to real endpoints are blocked and logged as decoy triggers
            client_host = get_client_ip(request)
            user_agent = request.headers.get("user-agent", "unknown")
            headers = dict(request.headers)
            
            logger.warning(f"Direct access attempt to protected path {path} blocked.")
            mtd_service.log_honeypot_trigger(
                path=path,
                ip_address=client_host,
                user_agent=user_agent,
                headers=headers
            )
            # Also feed into risk engine as direct_protected_path event
            try:
                from app.core.database import SessionLocal
                from app.services.threat_correlation import threat_correlation
                _db = SessionLocal()
                try:
                    threat_correlation.on_direct_protected_path(
                        db=_db, ip_address=client_host, path=path
                    )
                finally:
                    _db.close()
            except Exception as _e:
                logger.error(f"Risk engine error on direct path: {_e}")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Not Found"}
            )

    # Proceed normally for non-protected paths
    response = await call_next(request)
    return response


# Global IP Threat Blocker Middleware (runs BEFORE MTD middleware in request life-cycle)
@app.middleware("http")
async def threat_blocker_middleware(request: Request, call_next):
    path = request.url.path
    
    # Bypass blocking for documentation/schema
    if path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
        return await call_next(request)

    client_host = get_client_ip(request)
    
    from app.core.database import SessionLocal
    from app.services.threat_mitigation import threat_mitigation_service

    db = SessionLocal()
    try:
        if threat_mitigation_service.is_ip_blocked(db, client_host):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Forbidden"}
            )
    finally:
        db.close()

    response = await call_next(request)
    return response


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(mtd_router, prefix=settings.API_V1_STR)
app.include_router(video_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(security_analytics_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
