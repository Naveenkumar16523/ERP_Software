from typing import Any, Generic, Type, TypeVar, List, Optional
from fastapi import APIRouter, Depends, Query, Path
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.utils.db import get_db
from app.utils.responses import success, paginated, error
from app.utils.pagination import get_pagination
from app.constants.error_codes import ErrorCode
from app.routers.rbac_auth import require_permission, get_current_user

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDUtility(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType], collection_name: str):
        self.model = model
        self.collection_name = collection_name

    async def get_multi(self, db, skip: int = 0, limit: int = 100):
        if db is None:
            error(ErrorCode.DB_ERROR, "Database connection is not available", 500)
        
        cursor = db[self.collection_name].find({"isActive": {"$ne": False}}).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)
        # Convert _id out if needed, but our items use "id"
        return [self.model(**item).model_dump() for item in items]
        
    async def get_total(self, db):
        if db is None:
            return 0
        return await db[self.collection_name].count_documents({"isActive": {"$ne": False}})

    async def get(self, db, id: str):
        if db is None:
            error(ErrorCode.DB_ERROR, "Database connection is not available", 500)
            
        obj = await db[self.collection_name].find_one({"id": id, "isActive": {"$ne": False}})
        if not obj:
            error(ErrorCode.NOT_FOUND, f"{self.model.__name__} not found", 404)
        return self.model(**obj).model_dump()

    async def create(self, db, obj_in: CreateSchemaType, current_user: dict):
        if db is None:
            error(ErrorCode.DB_ERROR, "Database connection is not available", 500)
            
        obj_in_data = obj_in.model_dump()
        obj_in_data["id"] = str(uuid.uuid4())
        obj_in_data["createdAt"] = datetime.utcnow()
        obj_in_data["updatedAt"] = datetime.utcnow()
        obj_in_data["isActive"] = True
        
        # Auto-set created_by if needed
        if hasattr(self.model, "created_by"):
            obj_in_data["created_by"] = current_user.get("username", "system")
            
        try:
            await db[self.collection_name].insert_one(obj_in_data)
            # Remove _id which is ObjectId before returning
            if "_id" in obj_in_data:
                del obj_in_data["_id"]
            return obj_in_data
        except Exception as e:
            error(ErrorCode.DB_ERROR, f"Failed to create record: {str(e)}", 500)

    async def update(self, db, id: str, obj_in: UpdateSchemaType):
        if db is None:
            error(ErrorCode.DB_ERROR, "Database connection is not available", 500)
            
        obj_data = obj_in.model_dump(exclude_unset=True)
        obj_data["updatedAt"] = datetime.utcnow()
        
        try:
            result = await db[self.collection_name].update_one(
                {"id": id}, 
                {"$set": obj_data}
            )
            if result.matched_count == 0:
                error(ErrorCode.NOT_FOUND, f"{self.model.__name__} not found", 404)
                
            updated_obj = await db[self.collection_name].find_one({"id": id})
            if "_id" in updated_obj:
                del updated_obj["_id"]
            return updated_obj
        except Exception as e:
            error(ErrorCode.DB_ERROR, f"Failed to update record: {str(e)}", 500)

    async def remove(self, db, id: str):
        if db is None:
            error(ErrorCode.DB_ERROR, "Database connection is not available", 500)
            
        obj = await db[self.collection_name].find_one({"id": id})
        if not obj:
            error(ErrorCode.NOT_FOUND, f"{self.model.__name__} not found", 404)
            
        try:
            # Soft delete
            await db[self.collection_name].update_one({"id": id}, {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}})
            return {"id": id}
        except Exception as e:
            error(ErrorCode.DB_ERROR, f"Failed to delete record: {str(e)}", 500)


def create_module_router(
    module_name: str, 
    model: Type[ModelType], 
    create_schema: Type[CreateSchemaType], 
    update_schema: Type[UpdateSchemaType],
    response_schema: Type[Any]
) -> APIRouter:
    """Generates a standardized CRUD APIRouter for a module."""
    
    router = APIRouter(prefix=f"/{module_name}", tags=[module_name.capitalize()])
    
    # Deriving the MongoDB collection name (e.g. Employee -> erp_employee)
    collection_name = f"erp_{model.__name__.lower()}"
    crud = CRUDUtility(model, collection_name)

    @router.get("/", response_model=dict)
    async def read_items(
        pagination: dict = Depends(get_pagination),
        db = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        skip = pagination["offset"]
        limit = pagination["limit"]
        items = await crud.get_multi(db, skip=skip, limit=limit)
        total = await crud.get_total(db)
        return paginated(items, total, pagination["page"], pagination["limit"])

    @router.get("/{id}", response_model=dict)
    async def read_item(
        id: str = Path(...),
        db = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        item = await crud.get(db, id)
        return success(item)

    @router.post("/", response_model=dict)
    async def create_item(
        item_in: create_schema,
        db = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        item = await crud.create(db, item_in, current_user)
        return success(item, message=f"{model.__name__} created successfully")

    @router.put("/{id}", response_model=dict)
    async def update_item(
        id: str = Path(...),
        item_in: update_schema = None,
        db = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        item = await crud.update(db, id, item_in)
        return success(item, message=f"{model.__name__} updated successfully")

    @router.delete("/{id}", response_model=dict)
    async def delete_item(
        id: str = Path(...),
        db = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        item = await crud.remove(db, id)
        return success({"id": id}, message=f"{model.__name__} deleted successfully")

    return router
