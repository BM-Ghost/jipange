from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import os
from groq import Groq
from datetime import datetime, timedelta
import json
import re
from enum import Enum
import logging
import asyncpg
import asyncio
from contextlib import asynccontextmanager

router = APIRouter()

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")

# Enhanced data models
class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskCategory(str, Enum):
    WORK = "work"
    PERSONAL = "personal"
    HEALTH = "health"
    LEARNING = "learning"
    FINANCE = "finance"
    SOCIAL = "social"
    HOUSEHOLD = "household"
    CREATIVE = "creative"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ExtractedTask(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    priority: TaskPriority = TaskPriority.MEDIUM
    category: TaskCategory = TaskCategory.WORK
    estimated_duration: Optional[int] = Field(None, ge=1, le=480)  # 1 min to 8 hours
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    tags: List[str] = Field(default_factory=list, max_items=10)
    location: Optional[str] = None
    reminder_minutes: Optional[int] = Field(None, ge=1, le=10080)  # 1 min to 1 week
    recurring: Optional[str] = None  # daily, weekly, monthly
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    extraction_notes: Optional[str] = None

    @validator('due_date')
    def validate_due_date(cls, v):
        if v:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
                return v
            except ValueError:
                raise ValueError('Invalid date format')
        return v

    @validator('tags')
    def validate_tags(cls, v):
        return [tag.lower().strip() for tag in v if tag.strip()][:10]

class VoiceProcessingResult(BaseModel):
    transcript: str
    extracted_task: ExtractedTask
    confidence_score: float
    processing_time_ms: int
    suggestions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: str
    context_used: bool
    suggestions: List[str] = Field(default_factory=list)
    actions: List[Dict[str, str]] = Field(default_factory=list)

class VoiceRequest(BaseModel):
    audio_data: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

# Database functions
async def get_db_connection():
    """Get database connection"""
    try:
        return await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        return None

async def init_database():
    """Initialize database tables"""
    conn = await get_db_connection()
    if not conn:
        return
    
    try:
        # Create conversations table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(255) UNIQUE NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB DEFAULT '{}'
            )
        ''')
        
        # Create messages table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
            )
        ''')
        
        # Create user_context table for personalization
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS user_context (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                context_type VARCHAR(100) NOT NULL,
                context_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        logging.info("Database tables initialized successfully")
        
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
    finally:
        await conn.close()

async def save_conversation_message(conversation_id: str, role: str, content: str, metadata: Dict = None):
    """Save a message to the conversation history"""
    conn = await get_db_connection()
    if not conn:
        return
    
    try:
        await conn.execute('''
            INSERT INTO messages (conversation_id, role, content, metadata)
            VALUES ($1, $2, $3, $4)
        ''', conversation_id, role, content, json.dumps(metadata or {}))
        
        # Update conversation timestamp
        await conn.execute('''
            UPDATE conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE conversation_id = $1
        ''', conversation_id)
        
    except Exception as e:
        logging.error(f"Failed to save message: {e}")
    finally:
        await conn.close()

async def get_conversation_history(conversation_id: str, limit: int = 10) -> List[ConversationMessage]:
    """Get conversation history"""
    conn = await get_db_connection()
    if not conn:
        return []
    
    try:
        rows = await conn.fetch('''
            SELECT role, content, timestamp, metadata
            FROM messages 
            WHERE conversation_id = $1 
            ORDER BY timestamp DESC 
            LIMIT $2
        ''', conversation_id, limit)
        
        messages = []
        for row in reversed(rows):  # Reverse to get chronological order
            messages.append(ConversationMessage(
                role=row['role'],
                content=row['content'],
                timestamp=row['timestamp'],
                metadata=json.loads(row['metadata']) if row['metadata'] else None
            ))
        
        return messages
        
    except Exception as e:
        logging.error(f"Failed to get conversation history: {e}")
        return []
    finally:
        await conn.close()

async def create_or_get_conversation(user_id: str, conversation_id: str = None) -> str:
    """Create a new conversation or get existing one"""
    conn = await get_db_connection()
    if not conn:
        return f"conv_{user_id}_{int(datetime.now().timestamp())}"
    
    try:
        if conversation_id:
            # Check if conversation exists
            row = await conn.fetch('''
                SELECT conversation_id FROM conversations 
                WHERE conversation_id = $1 AND user_id = $2
            ''', conversation_id, user_id)
            
            if row:
                return conversation_id
        
        # Create new conversation
        new_conv_id = f"conv_{user_id}_{int(datetime.now().timestamp())}"
        await conn.execute('''
            INSERT INTO conversations (conversation_id, user_id)
            VALUES ($1, $2)
        ''', new_conv_id, user_id)
        
        return new_conv_id
        
    except Exception as e:
        logging.error(f"Failed to create conversation: {e}")
        return f"conv_{user_id}_{int(datetime.now().timestamp())}"
    finally:
        await conn.close()

async def get_user_context(user_id: str) -> Dict[str, Any]:
    """Get user context for personalization"""
    conn = await get_db_connection()
    if not conn:
        return {}
    
    try:
        rows = await conn.fetch('''
            SELECT context_type, context_data 
            FROM user_context 
            WHERE user_id = $1 
            ORDER BY updated_at DESC
        ''', user_id)
        
        context = {}
        for row in rows:
            context[row['context_type']] = json.loads(row['context_data'])
        
        return context
        
    except Exception as e:
        logging.error(f"Failed to get user context: {e}")
        return {}
    finally:
        await conn.close()

async def update_user_context(user_id: str, context_type: str, context_data: Dict):
    """Update user context"""
    conn = await get_db_connection()
    if not conn:
        return
    
    try:
        await conn.execute('''
            INSERT INTO user_context (user_id, context_type, context_data)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, context_type) 
            DO UPDATE SET 
                context_data = $3,
                updated_at = CURRENT_TIMESTAMP
        ''', user_id, context_type, json.dumps(context_data))
        
    except Exception as e:
        logging.error(f"Failed to update user context: {e}")
    finally:
        await conn.close()

# Enhanced AI system prompts
JIA_SYSTEM_PROMPT = """You are Jia, an advanced AI productivity assistant for the Jipange platform. You are helpful, intelligent, and personable.

CORE CAPABILITIES:
- Task management and prioritization
- Schedule optimization and time blocking
- Productivity insights and recommendations
- Goal tracking and progress analysis
- Meeting and deadline management
- Work-life balance guidance

PERSONALITY TRAITS:
- Friendly and approachable
- Proactive in offering help
- Detail-oriented but not overwhelming
- Encouraging and motivational
- Adaptable to user preferences

CONVERSATION GUIDELINES:
1. Always acknowledge the user's specific question or request
2. Provide actionable, specific advice
3. Ask clarifying questions when needed
4. Reference previous conversations when relevant
5. Offer concrete next steps
6. Be concise but thorough

RESPONSE FORMAT:
- Address the user's question directly
- Provide specific recommendations
- Suggest 2-3 actionable next steps
- Ask a follow-up question to continue the conversation

Remember: You have access to the user's conversation history, tasks, and context. Use this information to provide personalized responses."""

@router.post("/ask", response_model=ChatResponse)
async def ask_ai(request: ChatRequest):
    """
    Enhanced AI chat with Groq integration and conversation memory
    """
    try:
        # Initialize database if needed
        await init_database()
        
        # Create or get conversation
        conversation_id = await create_or_get_conversation(request.user_id, request.conversation_id)
        
        # Get conversation history
        conversation_history = await get_conversation_history(conversation_id, limit=10)
        
        # Get user context for personalization
        user_context = await get_user_context(request.user_id)
        
        # Build conversation context
        current_time = datetime.now().isoformat()
        context_info = f"""
CURRENT TIME: {current_time}
USER CONTEXT: {json.dumps(user_context, indent=2) if user_context else "No previous context"}
ADDITIONAL CONTEXT: {request.context or "None provided"}

CONVERSATION HISTORY:
{format_conversation_history(conversation_history)}
"""

        # Build messages for Groq
        messages = [
            {"role": "system", "content": JIA_SYSTEM_PROMPT},
            {"role": "system", "content": f"CONTEXT INFORMATION:\n{context_info}"}
        ]
        
        # Add conversation history
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        messages.append({
            "role": "user", 
            "content": request.message
        })
        
        # Call Groq API
        response = groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",  # Using Groq's fast model
            messages=messages,
            max_tokens=500,
            temperature=0.7,
            top_p=0.9
        )
        
        ai_response = response.choices[0].message.content
        
        # Generate suggestions and actions
        suggestions, actions = await generate_suggestions_and_actions(
            request.message, 
            ai_response, 
            user_context
        )
        
        # Save conversation messages
        await save_conversation_message(conversation_id, "user", request.message)
        await save_conversation_message(conversation_id, "assistant", ai_response)
        
        # Update user context based on conversation
        await update_user_context_from_conversation(request.user_id, request.message, ai_response)
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            timestamp=datetime.now().isoformat(),
            context_used=bool(conversation_history or user_context),
            suggestions=suggestions,
            actions=actions
        )
        
    except Exception as e:
        logging.error(f"AI chat error: {str(e)}")
        
        # Fallback response
        fallback_response = await generate_fallback_response(request.message)
        
        return ChatResponse(
            response=fallback_response,
            conversation_id=request.conversation_id or f"fallback_{request.user_id}",
            timestamp=datetime.now().isoformat(),
            context_used=False,
            suggestions=["Try asking about your tasks", "Ask for schedule optimization", "Request productivity tips"],
            actions=[]
        )

def format_conversation_history(history: List[ConversationMessage]) -> str:
    """Format conversation history for context"""
    if not history:
        return "No previous conversation"
    
    formatted = []
    for msg in history[-5:]:  # Last 5 messages
        role = "User" if msg.role == "user" else "Jia"
        formatted.append(f"{role}: {msg.content}")
    
    return "\n".join(formatted)

async def generate_suggestions_and_actions(
    user_message: str, 
    ai_response: str, 
    user_context: Dict[str, Any]
) -> tuple[List[str], List[Dict[str, str]]]:
    """Generate contextual suggestions and actions"""
    
    suggestions = []
    actions = []
    
    message_lower = user_message.lower()
    
    # Task-related suggestions
    if any(word in message_lower for word in ['task', 'todo', 'work', 'project']):
        suggestions.extend([
            "Would you like me to help prioritize your tasks?",
            "I can suggest optimal time blocks for your work",
            "Want to set up reminders for important deadlines?"
        ])
        actions.extend([
            {"type": "create_task", "label": "Create New Task"},
            {"type": "view_tasks", "label": "View All Tasks"},
            {"type": "prioritize", "label": "Prioritize Tasks"}
        ])
    
    # Schedule-related suggestions
    if any(word in message_lower for word in ['schedule', 'calendar', 'meeting', 'time']):
        suggestions.extend([
            "I can analyze your calendar for optimization opportunities",
            "Would you like me to suggest focus time blocks?",
            "I can help you prepare for upcoming meetings"
        ])
        actions.extend([
            {"type": "view_calendar", "label": "View Calendar"},
            {"type": "schedule_focus", "label": "Schedule Focus Time"},
            {"type": "optimize_schedule", "label": "Optimize Schedule"}
        ])
    
    # Productivity suggestions
    if any(word in message_lower for word in ['productivity', 'efficient', 'better', 'improve']):
        suggestions.extend([
            "I can analyze your work patterns for insights",
            "Would you like personalized productivity recommendations?",
            "I can suggest workflow improvements"
        ])
        actions.extend([
            {"type": "productivity_report", "label": "View Productivity Report"},
            {"type": "workflow_tips", "label": "Get Workflow Tips"},
            {"type": "set_goals", "label": "Set Productivity Goals"}
        ])
    
    # Tomorrow/planning suggestions
    if any(word in message_lower for word in ['tomorrow', 'next', 'plan', 'prepare']):
        suggestions.extend([
            "I can create an optimized schedule for tomorrow",
            "Would you like me to review your upcoming deadlines?",
            "I can suggest preparation tasks for tomorrow's meetings"
        ])
        actions.extend([
            {"type": "plan_tomorrow", "label": "Plan Tomorrow"},
            {"type": "review_deadlines", "label": "Review Deadlines"},
            {"type": "prep_meetings", "label": "Prepare for Meetings"}
        ])
    
    return suggestions[:3], actions[:3]  # Limit to 3 each

async def update_user_context_from_conversation(user_id: str, user_message: str, ai_response: str):
    """Update user context based on conversation patterns"""
    
    # Extract preferences and patterns
    context_updates = {}
    
    message_lower = user_message.lower()
    
    # Work patterns
    if any(word in message_lower for word in ['morning', 'afternoon', 'evening']):
        time_preference = None
        if 'morning' in message_lower:
            time_preference = 'morning'
        elif 'afternoon' in message_lower:
            time_preference = 'afternoon'
        elif 'evening' in message_lower:
            time_preference = 'evening'
        
        if time_preference:
            context_updates['time_preferences'] = {
                'preferred_work_time': time_preference,
                'last_updated': datetime.now().isoformat()
            }
    
    # Task preferences
    if any(word in message_lower for word in ['urgent', 'important', 'priority']):
        context_updates['task_preferences'] = {
            'priority_focused': True,
            'last_updated': datetime.now().isoformat()
        }
    
    # Communication style
    if len(user_message.split()) > 20:
        style = 'detailed'
    elif len(user_message.split()) < 5:
        style = 'brief'
    else:
        style = 'moderate'
    
    context_updates['communication_style'] = {
        'preferred_style': style,
        'last_updated': datetime.now().isoformat()
    }
    
    # Save context updates
    for context_type, context_data in context_updates.items():
        await update_user_context(user_id, context_type, context_data)

async def generate_fallback_response(user_message: str) -> str:
    """Generate a helpful fallback response when AI is unavailable"""
    
    message_lower = user_message.lower()
    
    # Name-related responses
    if any(word in message_lower for word in ['name', 'who are you', 'what are you']):
        return """Hi! I'm Jia, your AI productivity assistant. I help you manage tasks, optimize your schedule, and boost your productivity. I'm currently running in offline mode, but I can still help you with basic task management. What would you like to work on?"""
    
    # Tomorrow/planning responses
    if any(word in message_lower for word in ['tomorrow', 'next day', 'plan']):
        return """For tomorrow, I'd suggest:

1. **Review your task list** - Check what's due and prioritize
2. **Block focus time** - Schedule 2-3 hour blocks for deep work
3. **Prepare for meetings** - Review agendas and materials
4. **Set 3 key goals** - Choose your most important outcomes

Would you like me to help you create a specific plan for tomorrow? I can assist with task prioritization and time blocking."""
    
    # Task-related responses
    if any(word in message_lower for word in ['task', 'todo', 'work']):
        return """I can help you with task management! Here are some things I can do:

• **Create and organize tasks** with priorities and deadlines
• **Suggest optimal scheduling** based on your energy levels
• **Break down large projects** into manageable steps
• **Set up reminders** for important deadlines

What specific task would you like help with? You can also use the voice input feature to quickly add tasks."""
    
    # Schedule-related responses
    if any(word in message_lower for word in ['schedule', 'calendar', 'time']):
        return """I can help optimize your schedule! Here's what I recommend:

• **Time blocking** - Group similar tasks together
• **Energy mapping** - Schedule demanding work during your peak hours
• **Buffer time** - Add 15-minute buffers between meetings
• **Focus sessions** - Block 2+ hours for deep work

Would you like me to analyze your current schedule and suggest improvements?"""
    
    # General greeting or unclear input
    return """Hi! I'm Jia, your AI productivity assistant. I'm here to help you:

• **Manage tasks** - Create, prioritize, and organize your work
• **Optimize your schedule** - Find the best times for different activities
• **Boost productivity** - Get personalized tips and insights
• **Plan ahead** - Prepare for meetings and deadlines

What would you like to work on today? You can ask me about your tasks, schedule, or any productivity challenges you're facing."""

@router.post("/voice-to-task")
async def voice_to_task(request: VoiceRequest):
    """
    Enhanced voice-to-task conversion with Groq integration
    """
    start_time = datetime.now()
    
    try:
        # Stage 1: Audio transcription (keeping Whisper for now as it's specialized for audio)
        transcript = await transcribe_audio(request.audio_data)
        
        if not transcript or len(transcript.strip()) < 3:
            raise HTTPException(status_code=400, detail="Audio transcription failed or too short")
        
        # Stage 2: Task extraction using Groq
        extracted_task = await extract_task_with_groq(
            transcript, 
            request.user_id, 
            request.context
        )
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return {
            "transcript": transcript,
            "extracted_task": extracted_task,
            "confidence_score": extracted_task.get("confidence_score", 0.7),
            "processing_time_ms": processing_time,
            "suggestions": extracted_task.get("suggestions", []),
            "warnings": extracted_task.get("warnings", [])
        }
        
    except Exception as e:
        logging.error(f"Voice processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

async def extract_task_with_groq(
    transcript: str, 
    user_id: str, 
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Extract task using Groq instead of OpenAI"""
    
    current_time = datetime.now().isoformat()
    user_context = await get_user_context(user_id)
    
    system_prompt = """You are an expert task extraction AI. Convert natural language voice input into structured task data.

EXTRACTION RULES:
1. Create clear, actionable task titles starting with verbs
2. Determine priority: urgent (ASAP, critical), high (important, soon), medium (should, need), low (sometime, maybe)
3. Classify category: work, personal, health, learning, finance, social, household, creative
4. Parse time references: "today", "tomorrow", "next week", specific dates/times
5. Estimate duration: quick (15min), call (30min), meeting (60min), project (120min+)
6. Extract location if mentioned
7. Generate relevant tags
8. Assign confidence score (0.0-1.0)

OUTPUT FORMAT: Return ONLY valid JSON with these fields:
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high|urgent",
  "category": "work|personal|health|learning|finance|social|household|creative",
  "estimated_duration": number_in_minutes,
  "due_date": "YYYY-MM-DD",
  "due_time": "HH:MM",
  "tags": ["tag1", "tag2"],
  "location": "string",
  "confidence_score": 0.0-1.0,
  "suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1", "warning2"]
}"""

    user_prompt = f"""
TRANSCRIPT: "{transcript}"
CURRENT_TIME: {current_time}
USER_CONTEXT: {json.dumps(user_context) if user_context else "None"}
PAGE_CONTEXT: {context.get('page_context', 'None') if context else 'None'}

Extract task information and return as JSON."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=800,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        extracted_json = response.choices[0].message.content
        task_data = json.loads(extracted_json)
        
        # Validate and enhance
        task_data = enhance_extracted_task(task_data, transcript, context)
        
        return task_data
        
    except Exception as e:
        logging.error(f"Groq task extraction failed: {e}")
        # Fallback to basic extraction
        return create_fallback_task(transcript)

async def transcribe_audio(audio_data: str) -> str:
    """Audio transcription - keeping existing implementation"""
    try:
        import base64
        import tempfile
        import os
        from openai import OpenAI
        
        # Use OpenAI for Whisper (specialized for audio)
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        audio_bytes = base64.b64decode(audio_data)
        
        if len(audio_bytes) < 1000:
            raise ValueError("Audio data too small")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        try:
            with open(temp_audio_path, "rb") as audio_file:
                transcript_response = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en",
                    prompt="This is a task or reminder request. Please transcribe accurately.",
                    temperature=0.0
                )
            
            return transcript_response.text.strip()
            
        finally:
            os.unlink(temp_audio_path)
            
    except Exception as e:
        logging.error(f"Audio transcription failed: {str(e)}")
        raise ValueError(f"Audio transcription failed: {str(e)}")

def enhance_extracted_task(task_data: Dict[str, Any], transcript: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Enhance extracted task with smart defaults"""
    
    # Ensure required fields
    if not task_data.get("title"):
        task_data["title"] = transcript[:100] if len(transcript) > 100 else transcript
    
    # Smart date processing
    if task_data.get("due_date"):
        task_data["due_date"] = normalize_date(task_data["due_date"])
    
    # Add context tags
    if context and context.get("page_context"):
        page_tags = extract_tags_from_context(context["page_context"])
        existing_tags = task_data.get("tags", [])
        task_data["tags"] = list(set(existing_tags + page_tags))[:10]
    
    # Ensure confidence score
    if not task_data.get("confidence_score"):
        task_data["confidence_score"] = calculate_confidence_score(task_data, transcript)
    
    return task_data

def normalize_date(date_str: str) -> str:
    """Normalize date string to ISO format"""
    try:
        if 'today' in date_str.lower():
            return datetime.now().date().isoformat()
        elif 'tomorrow' in date_str.lower():
            return (datetime.now() + timedelta(days=1)).date().isoformat()
        elif 'next week' in date_str.lower():
            return (datetime.now() + timedelta(weeks=1)).date().isoformat()
        else:
            parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return parsed_date.date().isoformat()
    except:
        return date_str

def extract_tags_from_context(context: str) -> List[str]:
    """Extract relevant tags from page context"""
    tags = []
    
    if 'github.com' in context:
        tags.append('development')
    elif 'docs.google.com' in context:
        tags.append('documentation')
    elif 'calendar.google.com' in context:
        tags.append('scheduling')
    elif 'slack.com' in context:
        tags.append('communication')
    
    return tags[:3]

def calculate_confidence_score(task_data: Dict[str, Any], transcript: str) -> float:
    """Calculate confidence score based on task completeness"""
    score = 0.5
    
    if task_data.get("title") and len(task_data["title"]) > 10:
        score += 0.2
    if task_data.get("description"):
        score += 0.1
    if task_data.get("due_date"):
        score += 0.1
    if task_data.get("estimated_duration"):
        score += 0.1
    
    return min(1.0, score)

def create_fallback_task(transcript: str) -> Dict[str, Any]:
    """Create basic task when AI extraction fails"""
    return {
        "title": transcript[:100] if len(transcript) > 100 else transcript,
        "description": "Task created from voice input (fallback mode)",
        "priority": "medium",
        "category": "work",
        "confidence_score": 0.3,
        "suggestions": ["Review and edit this task for better organization"],
        "warnings": ["Task created in fallback mode - please verify details"]
    }

# Initialize database on startup
@router.on_event("startup")
async def startup_event():
    await init_database()
