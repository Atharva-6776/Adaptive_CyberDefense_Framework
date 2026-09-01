from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.reports import (
    ReportSummary,
    ReportItem,
    ReportGenerateRequest,
    ReportGenerateResponse,
    AuditLogOut,
)
from app.services.report_service import report_service
from app.utils.deps import get_db, get_current_user, require_admin

router = APIRouter(prefix="/reports", tags=["Compliance & Security Reports"])


def get_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("", response_model=List[ReportItem])
def list_available_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve list of available automated security & compliance reports.
    Requires authenticated user.
    """
    return report_service.list_available_reports(db)


@router.get("/summary", response_model=ReportSummary)
def get_report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve aggregate framework telemetry summary for report dashboard headers.
    Requires authenticated user.
    """
    return report_service.get_telemetry_summary(db)


@router.post("/generate", response_model=ReportGenerateResponse)
def generate_report(
    request: ReportGenerateRequest,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a full framework telemetry report compiled from live database records.
    Audits the generation action. Requires authenticated user.
    """
    client_ip = get_client_ip(req)
    return report_service.generate_report(
        db=db,
        user=current_user,
        request=request,
        ip_address=client_ip,
    )


@router.get("/export/{report_type}")
def export_report(
    report_type: str,
    req: Request,
    format: Optional[str] = "JSON",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export/download a report in JSON or CSV format.
    Audits the export action. Requires authenticated user.
    """
    client_ip = get_client_ip(req)
    gen_req = ReportGenerateRequest(report_type=report_type, format=format or "JSON")
    report_res = report_service.generate_report(db, current_user, gen_req, client_ip)

    # Audit export explicitly
    report_service.create_audit_log(
        db=db,
        user=current_user,
        action="REPORT_EXPORTED",
        resource=f"reports:{report_type}",
        details=f"Exported report '{report_type}' in {format} format by {current_user.email}",
        ip_address=client_ip,
    )

    if (format or "").upper() == "CSV":
        # Generate simple CSV content
        lines = ["Category,Key,Value"]
        for item in report_res.data:
            cat = item.get("category", report_type)
            for k, v in item.items():
                if k != "category":
                    lines.append(f'"{cat}","{k}","{str(v).replace(chr(34), chr(39))}"')
        csv_content = "\n".join(lines)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"},
        )

    # Default JSON return
    return report_res


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve administrative audit logs.
    Requires authenticated user.
    """
    return report_service.get_audit_logs(db)
