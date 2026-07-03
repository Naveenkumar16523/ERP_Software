from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.mobile_sql_models import MobileAppConfig

router = APIRouter(prefix="/mobile", tags=["Mobile App"])

@router.get("/config")
async def get_mobile_config(current_user: RBACUser = Depends(require_module_access("mobile_app")), db: Session = Depends(get_db)):
    configs = db.query(MobileAppConfig).all()
    if not configs:
        # Seed default configs if empty
        default_configs = [
            MobileAppConfig(featureName="Responsive Layout", description="Adapts to any screen size automatically", status="Active"),
            MobileAppConfig(featureName="Touch Gestures", description="Swipe navigation and pull-to-refresh", status="Active"),
            MobileAppConfig(featureName="PWA Support", description="Installable as a Progressive Web App", status="Planned"),
            MobileAppConfig(featureName="Push Notifications", description="Web push notification integration", status="Planned")
        ]
        for c in default_configs:
            db.add(c)
        db.commit()
        configs = db.query(MobileAppConfig).all()
        
    return configs
