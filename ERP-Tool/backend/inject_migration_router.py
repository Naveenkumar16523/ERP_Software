import os
import sys

def inject_router():
    file_path = "app/main.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "from app.routers.migration import router as migration_router" not in content:
        import_marker = "from app.routers.sustainability import router as sustainability_router"
        if import_marker in content:
            content = content.replace(
                import_marker, 
                f"{import_marker}\nfrom app.routers.migration import router as migration_router"
            )
            print("Injected migration_router import")
    
    if "app.include_router(migration_router" not in content:
        include_marker = 'app.include_router(sustainability_router, prefix="/api/v1")'
        if include_marker in content:
            content = content.replace(
                include_marker,
                f'{include_marker}\napp.include_router(migration_router, prefix="/api/v1/migration", tags=["Migration"])'
            )
            print("Injected migration_router inclusion")
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    inject_router()
