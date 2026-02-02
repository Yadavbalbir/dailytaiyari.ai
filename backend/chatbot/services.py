"""
AI Chatbot service using OpenAI/LLM.
"""
import time
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class AIDoubtSolver:
    """
    AI-powered doubt solver using LLM.
    """
    
    SYSTEM_PROMPT = """You are an expert tutor for Indian competitive exams including NEET, IIT JEE, CBSE, NDA, and other government exams.

Your role is to:
1. Answer doubts clearly and concisely
2. Explain concepts step-by-step
3. Provide examples and analogies
4. Give tips for remembering formulas and concepts
5. Suggest related topics to study
6. Be encouraging and supportive

Guidelines:
- Use simple language that a student can understand
- For math/science, show step-by-step solutions
- For formulas, explain what each variable means
- Mention if a concept is frequently asked in exams
- If a question is unclear, ask for clarification
- Keep responses focused and not too long
- Use markdown formatting for better readability

Remember: You're helping students prepare for competitive exams. Be patient, helpful, and motivating."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4o-mini"  # Can be configured
        
    def _get_client(self):
        """Get OpenAI client."""
        if not self.api_key:
            return None
        
        try:
            from openai import OpenAI
            return OpenAI(api_key=self.api_key)
        except ImportError:
            logger.error("OpenAI package not installed")
            return None
    
    def get_response(self, messages, topic=None, subject=None):
        """
        Get AI response for a conversation.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            topic: Optional topic context
            subject: Optional subject context
        
        Returns:
            dict with response content and metadata
        """
        client = self._get_client()
        
        if not client:
            return self._get_fallback_response(messages[-1]['content'])
        
        # Build context-aware system prompt
        system_prompt = self.SYSTEM_PROMPT
        if topic or subject:
            context = []
            if subject:
                context.append(f"Subject: {subject}")
            if topic:
                context.append(f"Topic: {topic}")
            system_prompt += f"\n\nContext: {', '.join(context)}"
        
        # Prepare messages for API
        api_messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (limit to last 10 messages)
        for msg in messages[-10:]:
            api_messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        start_time = time.time()
        
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                max_tokens=1000,
                temperature=0.7,
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            return {
                'content': response.choices[0].message.content,
                'model': self.model,
                'tokens': response.usage.total_tokens,
                'response_time_ms': response_time,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self._get_fallback_response(messages[-1]['content'])
    
    def _get_fallback_response(self, question):
        """
        Provide a fallback response when API is not available.
        """
        return {
            'content': """I apologize, but I'm currently unable to process your question due to a technical issue.

Here's what you can do:
1. **Try again in a few moments** - The issue might be temporary
2. **Check our FAQ section** - Your question might already be answered
3. **Use the revision notes** - The topic notes might have the answer

If you're stuck on a specific problem:
- Review the relevant chapter in your textbook
- Check solved examples for similar problems
- Discuss with your teachers or peers

We're working to resolve this issue. Thank you for your patience! 📚""",
            'model': 'fallback',
            'tokens': 0,
            'response_time_ms': 0,
            'success': False
        }
    
    def suggest_related_questions(self, topic):
        """
        Suggest related questions for a topic.
        """
        # This could be enhanced with AI or pulled from FAQ database
        from .models import FrequentQuestion
        
        faqs = FrequentQuestion.objects.filter(
            topic=topic,
            is_active=True
        ).order_by('-views_count')[:5]
        
        return [{'question': faq.question, 'id': str(faq.id)} for faq in faqs]


class ChatService:
    """
    Service for managing chat sessions and messages.
    """
    
    @staticmethod
    def create_session(student, topic=None, subject=None, title=None):
        """Create a new chat session."""
        from .models import ChatSession
        
        session = ChatSession.objects.create(
            student=student,
            topic=topic,
            subject=subject,
            title=title or "New Chat"
        )
        return session
    
    @staticmethod
    def add_message(session, role, content, **kwargs):
        """Add a message to a session."""
        from .models import ChatMessage
        
        message = ChatMessage.objects.create(
            session=session,
            role=role,
            content=content,
            **kwargs
        )
        
        # Update session
        session.message_count += 1
        if not session.title or session.title == "New Chat":
            # Set title from first user message
            if role == 'user':
                session.title = content[:100]
        session.save()
        
        return message
    
    @staticmethod
    def get_session_history(session, limit=50):
        """Get message history for a session."""
        messages = session.messages.order_by('created_at')[:limit]
        return [
            {'role': msg.role, 'content': msg.content, 'id': str(msg.id)}
            for msg in messages
        ]
    
    @staticmethod
    def process_question(session, question, image=None):
        """
        Process a user question and get AI response.
        """
        # Add user message
        user_message = ChatService.add_message(session, 'user', question)
        if image:
            user_message.image = image
            user_message.save()
        
        # Get conversation history
        history = ChatService.get_session_history(session)
        
        # Get AI response
        solver = AIDoubtSolver()
        response = solver.get_response(
            history,
            topic=session.topic.name if session.topic else None,
            subject=session.subject.name if session.subject else None
        )
        
        # Add AI response
        ai_message = ChatService.add_message(
            session,
            'assistant',
            response['content'],
            model_used=response['model'],
            tokens_used=response['tokens'],
            response_time_ms=response['response_time_ms']
        )
        
        return {
            'message': ai_message,
            'success': response['success']
        }

