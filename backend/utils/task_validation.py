"""
Enhanced task validation and processing utilities
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import re
from enum import Enum
import logging

class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

class ValidationResult:
    def __init__(self):
        self.is_valid = True
        self.issues: List[Dict[str, Any]] = []
        self.suggestions: List[str] = []
        self.confidence_adjustments: List[Tuple[str, float]] = []

    def add_issue(self, field: str, message: str, severity: ValidationSeverity, suggestion: str = None):
        self.issues.append({
            "field": field,
            "message": message,
            "severity": severity.value,
            "suggestion": suggestion
        })
        
        if severity == ValidationSeverity.ERROR:
            self.is_valid = False

    def add_suggestion(self, suggestion: str):
        self.suggestions.append(suggestion)

    def adjust_confidence(self, reason: str, adjustment: float):
        self.confidence_adjustments.append((reason, adjustment))

class TaskValidator:
    """Comprehensive task validation with smart suggestions"""
    
    def __init__(self):
        self.common_verbs = {
            'create', 'make', 'build', 'develop', 'design', 'write', 'draft',
            'review', 'check', 'verify', 'validate', 'test', 'analyze',
            'call', 'contact', 'reach out', 'email', 'message', 'notify',
            'schedule', 'plan', 'organize', 'arrange', 'book', 'reserve',
            'finish', 'complete', 'finalize', 'submit', 'deliver', 'send',
            'research', 'study', 'learn', 'investigate', 'explore',
            'fix', 'repair', 'solve', 'resolve', 'troubleshoot',
            'update', 'modify', 'change', 'edit', 'revise', 'improve'
        }
        
        self.urgency_indicators = {
            'urgent': 0.9,
            'asap': 0.9,
            'immediately': 0.9,
            'critical': 0.8,
            'important': 0.7,
            'priority': 0.7,
            'soon': 0.6,
            'deadline': 0.8,
            'due': 0.6
        }
        
        self.time_indicators = {
            'today': 0.8,
            'tomorrow': 0.7,
            'this week': 0.6,
            'next week': 0.5,
            'monday': 0.7,
            'tuesday': 0.7,
            'wednesday': 0.7,
            'thursday': 0.7,
            'friday': 0.7,
            'weekend': 0.6
        }

    def validate_task(self, task_data: Dict[str, Any], transcript: str) -> ValidationResult:
        """Comprehensive task validation"""
        result = ValidationResult()
        
        # Validate title
        self._validate_title(task_data.get('title', ''), transcript, result)
        
        # Validate description
        self._validate_description(task_data.get('description', ''), transcript, result)
        
        # Validate priority
        self._validate_priority(task_data.get('priority', ''), transcript, result)
        
        # Validate category
        self._validate_category(task_data.get('category', ''), transcript, result)
        
        # Validate dates and times
        self._validate_temporal_data(task_data, transcript, result)
        
        # Validate duration
        self._validate_duration(task_data.get('estimated_duration'), transcript, result)
        
        # Validate tags
        self._validate_tags(task_data.get('tags', []), transcript, result)
        
        # Cross-field validation
        self._validate_consistency(task_data, transcript, result)
        
        # Calculate final confidence score
        self._calculate_final_confidence(task_data, transcript, result)
        
        return result

    def _validate_title(self, title: str, transcript: str, result: ValidationResult):
        """Validate and suggest improvements for task title"""
        if not title or len(title.strip()) < 3:
            result.add_issue(
                "title", 
                "Title is too short or missing", 
                ValidationSeverity.ERROR,
                "Extract the main action from the transcript"
            )
            return

        # Check if title starts with action verb
        title_words = title.lower().split()
        if title_words and title_words[0] not in self.common_verbs:
            result.add_suggestion(f"Consider starting the title with an action verb like 'Create', 'Review', or 'Call'")
            result.adjust_confidence("No action verb in title", -0.1)

        # Check title length
        if len(title) > 100:
            result.add_issue(
                "title",
                "Title is too long",
                ValidationSeverity.WARNING,
                "Keep titles under 100 characters for better readability"
            )

        # Check for vague language
        vague_words = ['something', 'stuff', 'things', 'it', 'that']
        if any(word in title.lower() for word in vague_words):
            result.add_suggestion("Make the title more specific by replacing vague terms")
            result.adjust_confidence("Vague language in title", -0.2)

    def _validate_description(self, description: str, transcript: str, result: ValidationResult):
        """Validate task description"""
        if description and len(description) > 1000:
            result.add_issue(
                "description",
                "Description is too long",
                ValidationSeverity.WARNING,
                "Keep descriptions under 1000 characters"
            )

        # Suggest adding description if transcript has details but description is empty
        if not description and len(transcript.split()) > 10:
            result.add_suggestion("Consider adding a description with the additional details from your voice input")

    def _validate_priority(self, priority: str, transcript: str, result: ValidationResult):
        """Validate priority assignment"""
        transcript_lower = transcript.lower()
        
        # Check if priority matches urgency indicators in transcript
        detected_urgency = 0.0
        for indicator, weight in self.urgency_indicators.items():
            if indicator in transcript_lower:
                detected_urgency = max(detected_urgency, weight)

        priority_scores = {
            'low': 0.2,
            'medium': 0.5,
            'high': 0.7,
            'urgent': 0.9
        }

        assigned_score = priority_scores.get(priority, 0.5)
        
        # Check for mismatched priority
        if detected_urgency > 0.7 and assigned_score < 0.6:
            result.add_suggestion("Consider increasing priority - your language suggests this is urgent")
            result.adjust_confidence("Priority mismatch", -0.1)
        elif detected_urgency < 0.3 and assigned_score > 0.7:
            result.add_suggestion("Consider lowering priority - no urgency indicators detected")
            result.adjust_confidence("Priority mismatch", -0.1)

    def _validate_category(self, category: str, transcript: str, result: ValidationResult):
        """Validate category classification"""
        transcript_lower = transcript.lower()
        
        # Category indicators
        category_keywords = {
            'work': ['meeting', 'project', 'client', 'presentation', 'report', 'email', 'colleague', 'boss', 'office'],
            'personal': ['family', 'friend', 'personal', 'home', 'myself', 'self'],
            'health': ['doctor', 'exercise', 'gym', 'medication', 'appointment', 'health', 'workout'],
            'learning': ['study', 'learn', 'course', 'read', 'research', 'tutorial', 'book', 'education'],
            'finance': ['budget', 'pay', 'bill', 'bank', 'money', 'investment', 'financial'],
            'social': ['party', 'dinner', 'call', 'visit', 'social', 'event', 'friends'],
            'household': ['clean', 'repair', 'maintenance', 'grocery', 'shopping', 'house', 'home'],
            'creative': ['write', 'design', 'create', 'art', 'music', 'photo', 'creative']
        }

        # Find best matching category
        best_match = None
        best_score = 0
        
        for cat, keywords in category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in transcript_lower)
            if score > best_score:
                best_score = score
                best_match = cat

        # Suggest category change if mismatch
        if best_match and best_match != category and best_score > 0:
            result.add_suggestion(f"Consider changing category to '{best_match}' based on the content")

    def _validate_temporal_data(self, task_data: Dict[str, Any], transcript: str, result: ValidationResult):
        """Validate dates, times, and temporal consistency"""
        due_date = task_data.get('due_date')
        due_time = task_data.get('due_time')
        transcript_lower = transcript.lower()

        # Check for time indicators in transcript
        time_mentioned = any(indicator in transcript_lower for indicator in self.time_indicators.keys())
        
        if time_mentioned and not due_date:
            result.add_suggestion("You mentioned timing in your request - consider setting a due date")
            result.adjust_confidence("Time mentioned but no due date", -0.1)

        # Validate due date format and logic
        if due_date:
            try:
                parsed_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                if parsed_date.date() < datetime.now().date():
                    result.add_issue(
                        "due_date",
                        "Due date is in the past",
                        ValidationSeverity.WARNING,
                        "Check if this date is correct"
                    )
            except ValueError:
                result.add_issue(
                    "due_date",
                    "Invalid date format",
                    ValidationSeverity.ERROR,
                    "Use ISO format (YYYY-MM-DD)"
                )

        # Validate due time
        if due_time:
            time_pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
            if not re.match(time_pattern, due_time):
                result.add_issue(
                    "due_time",
                    "Invalid time format",
                    ValidationSeverity.ERROR,
                    "Use HH:MM format (24-hour)"
                )

        # Check for time conflicts
        if due_date and due_time:
            try:
                due_datetime = datetime.combine(
                    datetime.fromisoformat(due_date).date(),
                    datetime.strptime(due_time, "%H:%M").time()
                )
                if due_datetime < datetime.now():
                    result.add_issue(
                        "due_datetime",
                        "Due date and time is in the past",
                        ValidationSeverity.WARNING,
                        "Verify the intended date and time"
                    )
            except:
                pass

    def _validate_duration(self, duration: Optional[int], transcript: str, result: ValidationResult):
        """Validate estimated duration"""
        if duration is not None:
            if duration < 1:
                result.add_issue(
                    "estimated_duration",
                    "Duration must be at least 1 minute",
                    ValidationSeverity.ERROR
                )
            elif duration > 480:  # 8 hours
                result.add_issue(
                    "estimated_duration",
                    "Duration seems very long (over 8 hours)",
                    ValidationSeverity.WARNING,
                    "Consider breaking this into smaller tasks"
                )

        # Suggest duration if not provided
        if duration is None:
            duration_indicators = ['quick', 'brief', 'long', 'detailed', 'thorough']
            if any(indicator in transcript.lower() for indicator in duration_indicators):
                result.add_suggestion("Consider adding an estimated duration to help with scheduling")

    def _validate_tags(self, tags: List[str], transcript: str, result: ValidationResult):
        """Validate and suggest tags"""
        if len(tags) > 10:
            result.add_issue(
                "tags",
                "Too many tags",
                ValidationSeverity.WARNING,
                "Limit to 10 most relevant tags"
            )

        # Check for empty or invalid tags
        valid_tags = []
        for tag in tags:
            if isinstance(tag, str) and tag.strip():
                valid_tags.append(tag.strip().lower())

        if len(valid_tags) != len(tags):
            result.add_suggestion("Remove empty or invalid tags")

        # Suggest additional tags based on transcript
        suggested_tags = self._extract_potential_tags(transcript)
        missing_tags = [tag for tag in suggested_tags if tag not in valid_tags]
        
        if missing_tags:
            result.add_suggestion(f"Consider adding tags: {', '.join(missing_tags[:3])}")

    def _validate_consistency(self, task_data: Dict[str, Any], transcript: str, result: ValidationResult):
        """Validate consistency across fields"""
        priority = task_data.get('priority', 'medium')
        category = task_data.get('category', 'work')
        due_date = task_data.get('due_date')
        
        # Check priority-deadline consistency
        if priority in ['urgent', 'high'] and not due_date:
            result.add_suggestion("High priority tasks should typically have deadlines")
        
        # Check category-content consistency
        if category == 'work' and any(word in transcript.lower() for word in ['personal', 'family', 'home']):
            result.add_suggestion("Double-check if this should be categorized as 'personal'")

    def _calculate_final_confidence(self, task_data: Dict[str, Any], transcript: str, result: ValidationResult):
        """Calculate final confidence score with adjustments"""
        base_confidence = task_data.get('confidence_score', 0.5)
        
        # Apply adjustments
        for reason, adjustment in result.confidence_adjustments:
            base_confidence += adjustment
            logging.info(f"Confidence adjustment: {reason} ({adjustment:+.2f})")

        # Bonus for completeness
        completeness_bonus = 0
        if task_data.get('title'): completeness_bonus += 0.1
        if task_data.get('description'): completeness_bonus += 0.05
        if task_data.get('due_date'): completeness_bonus += 0.05
        if task_data.get('estimated_duration'): completeness_bonus += 0.05
        if task_data.get('tags'): completeness_bonus += 0.05

        final_confidence = min(1.0, max(0.0, base_confidence + completeness_bonus))
        
        # Update task data
        task_data['confidence_score'] = final_confidence

    def _extract_potential_tags(self, transcript: str) -> List[str]:
        """Extract potential tags from transcript"""
        tags = []
        transcript_lower = transcript.lower()
        
        # Technology tags
        tech_keywords = ['api', 'database', 'frontend', 'backend', 'mobile', 'web', 'app']
        tags.extend([keyword for keyword in tech_keywords if keyword in transcript_lower])
        
        # Action tags
        action_keywords = ['urgent', 'follow-up', 'research', 'planning', 'review']
        tags.extend([keyword for keyword in action_keywords if keyword in transcript_lower])
        
        # Context tags
        if 'meeting' in transcript_lower: tags.append('meeting')
        if 'email' in transcript_lower: tags.append('communication')
        if 'presentation' in transcript_lower: tags.append('presentation')
        
        return list(set(tags))[:5]  # Return unique tags, max 5

class SmartTaskEnhancer:
    """Enhance tasks with smart defaults and suggestions"""
    
    def __init__(self):
        self.duration_patterns = {
            r'\b(\d+)\s*min': lambda m: int(m.group(1)),
            r'\b(\d+)\s*hour': lambda m: int(m.group(1)) * 60,
            r'\bhalf\s*hour': lambda m: 30,
            r'\bquarter\s*hour': lambda m: 15,
            r'\ball\s*day': lambda m: 480,
        }

    def enhance_task(self, task_data: Dict[str, Any], transcript: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Enhance task with smart defaults and inferences"""
        
        # Smart duration extraction
        if not task_data.get('estimated_duration'):
            duration = self._extract_duration_from_transcript(transcript)
            if duration:
                task_data['estimated_duration'] = duration

        # Smart reminder setting
        if not task_data.get('reminder_minutes'):
            reminder = self._suggest_reminder(task_data)
            if reminder:
                task_data['reminder_minutes'] = reminder

        # Smart location inference
        if not task_data.get('location') and context:
            location = self._infer_location(transcript, context)
            if location:
                task_data['location'] = location

        # Smart recurring pattern detection
        if not task_data.get('recurring'):
            recurring = self._detect_recurring_pattern(transcript)
            if recurring:
                task_data['recurring'] = recurring

        return task_data

    def _extract_duration_from_transcript(self, transcript: str) -> Optional[int]:
        """Extract duration from transcript using patterns"""
        for pattern, extractor in self.duration_patterns.items():
            match = re.search(pattern, transcript, re.IGNORECASE)
            if match:
                return extractor(match)
        return None

    def _suggest_reminder(self, task_data: Dict[str, Any]) -> Optional[int]:
        """Suggest appropriate reminder timing"""
        priority = task_data.get('priority', 'medium')
        due_date = task_data.get('due_date')
        
        if not due_date:
            return None
            
        # Calculate days until due
        try:
            due_datetime = datetime.fromisoformat(due_date)
            days_until = (due_datetime.date() - datetime.now().date()).days
            
            if priority == 'urgent':
                return 60 if days_until > 0 else 15  # 1 hour or 15 min
            elif priority == 'high':
                return 240 if days_until > 1 else 60  # 4 hours or 1 hour
            elif days_until > 7:
                return 1440  # 1 day
            elif days_until > 1:
                return 240  # 4 hours
            else:
                return 60  # 1 hour
        except:
            return None

    def _infer_location(self, transcript: str, context: Dict[str, Any]) -> Optional[str]:
        """Infer location from transcript and context"""
        transcript_lower = transcript.lower()
        
        # Explicit location mentions
        location_keywords = {
            'office': 'Office',
            'home': 'Home',
            'gym': 'Gym',
            'store': 'Store',
            'bank': 'Bank',
            'doctor': "Doctor's Office",
            'restaurant': 'Restaurant',
            'online': 'Online',
            'zoom': 'Video Call',
            'phone': 'Phone Call'
        }
        
        for keyword, location in location_keywords.items():
            if keyword in transcript_lower:
                return location
        
        # Context-based inference
        if context and context.get('page_context'):
            page_context = context['page_context'].lower()
            if 'calendar.google.com' in page_context:
                return 'Calendar Event'
            elif 'zoom.us' in page_context:
                return 'Video Call'
            elif 'github.com' in page_context:
                return 'Development Work'
        
        return None

    def _detect_recurring_pattern(self, transcript: str) -> Optional[str]:
        """Detect recurring patterns in transcript"""
        transcript_lower = transcript.lower()
        
        recurring_patterns = {
            'daily': ['daily', 'every day', 'each day'],
            'weekly': ['weekly', 'every week', 'each week'],
            'monthly': ['monthly', 'every month', 'each month'],
            'weekdays': ['weekdays', 'monday to friday', 'work days'],
            'weekends': ['weekends', 'saturday and sunday']
        }
        
        for pattern, keywords in recurring_patterns.items():
            if any(keyword in transcript_lower for keyword in keywords):
                return pattern
        
        return None
