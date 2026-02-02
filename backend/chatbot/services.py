"""
AI Chatbot service using OpenAI/LLM with streaming support.
"""
import time
import json
import logging
from django.conf import settings
from django.http import StreamingHttpResponse

logger = logging.getLogger(__name__)


class AIDoubtSolver:
    """
    AI-powered doubt solver using LLM with streaming support.
    """
    
    SYSTEM_PROMPT = """You are an expert tutor for Indian competitive exams including NEET, IIT JEE, CBSE, NDA, and other government exams.

Your role is to:
1. Answer doubts clearly and concisely
2. Explain concepts step-by-step with clear reasoning
3. Provide examples and real-world analogies
4. Give tips for remembering formulas and concepts
5. Mention if a concept is frequently asked in exams (PYQ)
6. Suggest related topics to study
7. Be encouraging, patient, and supportive

Guidelines:
- Use simple language that a student can understand
- For math/physics, show step-by-step solutions with numbered steps
- For chemistry, explain reactions with proper equations
- For biology, use diagrams descriptions when helpful
- For formulas, explain what each variable/symbol means
- Mention the importance of the topic for specific exams (NEET/JEE/CBSE)
- If a question is unclear, ask for clarification
- Use markdown formatting for better readability:
  - **Bold** for important terms
  - `inline code` for formulas
  - Numbered lists for steps
  - Bullet points for key points
  - > blockquotes for important notes/tips

Remember: You're helping students prepare for competitive exams. Be patient, helpful, and motivating. Every small concept matters! 💪"""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4o-mini"
        self._client = None
        
    def _get_client(self):
        """Get OpenAI client (singleton)."""
        if self._client:
            return self._client
            
        if not self.api_key:
            logger.error("OpenAI API key not configured")
            return None
        
        try:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key)
            return self._client
        except ImportError:
            logger.error("OpenAI package not installed")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None
    
    def _build_messages(self, messages, topic=None, subject=None):
        """Build the message list for the API."""
        # Build context-aware system prompt
        system_prompt = self.SYSTEM_PROMPT
        if topic or subject:
            context_parts = []
            if subject:
                context_parts.append(f"Subject: {subject}")
            if topic:
                context_parts.append(f"Topic: {topic}")
            system_prompt += f"\n\nCurrent Context: {', '.join(context_parts)}. Focus your answers on this context."
        
        # Prepare messages for API
        api_messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (limit to last 20 messages for context)
        for msg in messages[-20:]:
            api_messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        return api_messages
    
    def get_response(self, messages, topic=None, subject=None):
        """
        Get AI response for a conversation (non-streaming).
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            topic: Optional topic context
            subject: Optional subject context
        
        Returns:
            dict with response content and metadata
        """
        client = self._get_client()
        
        if not client:
            return self._get_fallback_response(messages[-1]['content'] if messages else '')
        
        api_messages = self._build_messages(messages, topic, subject)
        start_time = time.time()
        
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                max_tokens=2000,
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
            return self._get_fallback_response(messages[-1]['content'] if messages else '')
    
    def get_streaming_response(self, messages, topic=None, subject=None):
        """
        Get AI response as a stream for real-time updates.
        
        Yields:
            str: JSON encoded chunks with 'content' or 'done' flag
        """
        client = self._get_client()
        
        if not client:
            fallback = self._get_fallback_response(messages[-1]['content'] if messages else '')
            yield json.dumps({'content': fallback['content'], 'done': True, 'success': False}) + '\n'
            return
        
        api_messages = self._build_messages(messages, topic, subject)
        
        try:
            stream = client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                max_tokens=2000,
                temperature=0.7,
                stream=True,
            )
            
            full_content = ""
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content += content
                    yield json.dumps({'content': content, 'done': False}) + '\n'
            
            # Send final chunk
            yield json.dumps({
                'content': '',
                'done': True,
                'success': True,
                'full_content': full_content,
                'model': self.model
            }) + '\n'
            
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            fallback = self._get_fallback_response(messages[-1]['content'] if messages else '')
            yield json.dumps({'content': fallback['content'], 'done': True, 'success': False, 'error': str(e)}) + '\n'
    
    def _get_fallback_response(self, question):
        """
        Provide a fallback response when API is not available.
        """
        return {
            'content': """I apologize, but I'm currently unable to process your question due to a technical issue.

**Here's what you can do:**

1. **Try again in a few moments** - The issue might be temporary
2. **Check our FAQ section** - Your question might already be answered
3. **Use the revision notes** - The topic notes might have the answer

**If you're stuck on a specific problem:**
- Review the relevant chapter in your textbook
- Check solved examples for similar problems
- Discuss with your teachers or peers

> 💡 **Tip:** Make sure to note down your doubt and revisit it later!

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
        Process a user question and get AI response (non-streaming).
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
    
    @staticmethod
    def process_question_streaming(session, question, image=None):
        """
        Process a user question with streaming response.
        Returns a generator that yields response chunks.
        """
        # Add user message
        user_message = ChatService.add_message(session, 'user', question)
        if image:
            user_message.image = image
            user_message.save()
        
        # Get conversation history
        history = ChatService.get_session_history(session)
        
        # Get AI streaming response
        solver = AIDoubtSolver()
        
        full_response = ""
        
        def stream_generator():
            nonlocal full_response
            
            for chunk in solver.get_streaming_response(
                history,
                topic=session.topic.name if session.topic else None,
                subject=session.subject.name if session.subject else None
            ):
                data = json.loads(chunk)
                
                if not data.get('done'):
                    full_response += data.get('content', '')
                else:
                    # Save the complete message when done
                    ai_message = ChatService.add_message(
                        session,
                        'assistant',
                        data.get('full_content', full_response),
                        model_used=data.get('model', 'gpt-4o-mini'),
                        tokens_used=0,  # Tokens not available in streaming
                        response_time_ms=0
                    )
                    # Add message ID to final chunk
                    data['message_id'] = str(ai_message.id)
                    yield json.dumps(data) + '\n'
                    return
                
                yield chunk
        
        return stream_generator()
