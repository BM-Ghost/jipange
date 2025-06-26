from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # high, medium, low
    status: str = "todo"  # todo, in-progress, completed
    due_date: Optional[str] = None
    estimated_duration: Optional[int] = None  # in minutes
    tags: List[str] = []
    user_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    estimated_duration: Optional[int] = None
    tags: Optional[List[str]] = None

# In-memory storage (replace with database)
tasks_db = {}

@router.post("/", response_model=Task)
async def create_task(task: Task):
    """Create a new task"""
    try:
        task.id = str(uuid.uuid4())
        task.created_at = datetime.now().isoformat()
        task.updated_at = task.created_at
        
        tasks_db[task.id] = task.dict()
        
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task creation failed: {str(e)}")

@router.get("/{user_id}", response_model=List[Task])
async def get_user_tasks(user_id: str):
    """Get all tasks for a user"""
    try:
        user_tasks = [
            Task(**task_data) 
            for task_data in tasks_db.values() 
            if task_data.get("user_id") == user_id
        ]
        return user_tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task retrieval failed: {str(e)}")

@router.put("/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: TaskUpdate):
    """Update an existing task"""
    try:
        if task_id not in tasks_db:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task_data = tasks_db[task_id]
        
        # Update fields
        for field, value in task_update.dict(exclude_unset=True).items():
            task_data[field] = value
        
        task_data["updated_at"] = datetime.now().isoformat()
        tasks_db[task_id] = task_data
        
        return Task(**task_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task update failed: {str(e)}")

@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    try:
        if task_id not in tasks_db:
            raise HTTPException(status_code=404, detail="Task not found")
        
        del tasks_db[task_id]
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task deletion failed: {str(e)}")
