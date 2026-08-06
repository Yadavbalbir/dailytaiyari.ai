"""AI doubt-solver services: prompt assembly, streaming, and session handling.

The actual model call is delegated to :mod:`chatbot.providers` via
:mod:`chatbot.resolver`, so the tenant's configured LLM (OpenAI, Azure, Gemini,
Claude, Groq/OpenRouter/Ollama open-source models…) is used transparently and
every call is metered for cost control.
"""
import json
import logging
import time

from . import resolver
from .course_context import course_context_for
from .providers import AIProviderError, Usage
from .tenancy import tenant_of_student

logger = logging.getLogger(__name__)


BASE_SYSTEM_PROMPT = """You are an expert tutor inside an online learning platform, helping a student with the course they are enrolled in.

Your role is to:
1. Answer doubts clearly and concisely
2. Explain concepts step-by-step with clear reasoning
3. Provide examples and real-world analogies
4. Give tips for remembering formulas and concepts
5. Point out what is important for the student's exams
6. Suggest related topics to study next
7. Be encouraging, patient, and supportive
8. Create practice quizzes when asked

Guidelines:
- Use simple language that a student can understand
- For math/physics, show step-by-step solutions with numbered steps
- For chemistry, explain reactions with proper equations
- For biology, describe diagrams when helpful
- For formulas, explain what each variable/symbol means
- If a question is unclear, ask for clarification
- Use markdown formatting for better readability:
  - **Bold** for important terms
  - Numbered lists for steps
  - Bullet points for key points
  - > blockquotes for important notes/tips

**IMPORTANT - Math Formatting:**
- For mathematical equations, use LaTeX with dollar signs:
  - Inline math: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$
  - Display math (own line): $$E = mc^2$$
- Always use $...$ for inline formulas and $$...$$ for block formulas

**IMPORTANT - Quiz Format:**
When a student asks for practice questions, a quiz, or says "quiz me", format the quiz EXACTLY like this:

Q1. [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter, e.g., B]
Explanation: [Brief explanation of why this is correct]

Q2. [Next question...]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]
Explanation: [Brief explanation]

(Continue for all questions)

Remember: you are helping a real student make progress. Be patient, helpful, and motivating. Every small concept matters!"""


NO_QUIZ_CLAUSE = (
    '\n\nQuiz generation is disabled on this platform. If the student asks for a quiz, '
    'politely explain that practice quizzes are available in the Practice Quiz section '
    'instead, and offer to explain the concept or give worked examples.'
)


def build_system_prompt(session, ai_settings=None):
    """Assemble the system prompt: base rules + tenant tweaks + course context."""
    prompt = BASE_SYSTEM_PROMPT

    if ai_settings is not None and not ai_settings.allow_quiz_generation:
        prompt += NO_QUIZ_CLAUSE

    context_parts = []
    if session.subject_id:
        context_parts.append(f'Subject: {session.subject.name}')
    if session.topic_id:
        context_parts.append(f'Topic: {session.topic.name}')
    if context_parts:
        prompt += (
            f"\n\nCurrent Context: {', '.join(context_parts)}. "
            'Focus your answers on this context.'
        )

    allow_course_context = ai_settings is None or ai_settings.allow_course_context
    if session.course_id and allow_course_context:
        try:
            course_block = course_context_for(session.student, session.course)
            if course_block:
                prompt += '\n\n' + course_block
        except Exception:  # noqa: BLE001 - context is an enhancement, never fatal
            logger.exception('Failed to build course context for session %s', session.id)

    if ai_settings is not None and ai_settings.custom_instructions:
        prompt += (
            '\n\n## Additional instructions from this institute\n'
            + ai_settings.custom_instructions.strip()
        )

    return prompt


def build_messages(session, history, ai_settings=None):
    """System prompt + the last 20 turns, in provider-neutral form."""
    messages = [{'role': 'system', 'content': build_system_prompt(session, ai_settings)}]
    for msg in history[-20:]:
        if msg['role'] in ('user', 'assistant'):
            messages.append({'role': msg['role'], 'content': msg['content']})
    return messages


UNAVAILABLE_TEMPLATE = """I can't answer right now.

{reason}

**In the meantime you can:**
- Review the topic's study notes and revision material
- Try a practice quiz on the topic
- Post your doubt in the Community for a peer or mentor to answer"""

PROVIDER_ERROR_REASON = (
    'The AI provider configured for your institute returned an error. '
    'Please try again in a moment.'
)


def unavailable_message(exc):
    return UNAVAILABLE_TEMPLATE.format(reason=exc.message)


class ChatService:
    """Service for managing chat sessions and messages."""

    @staticmethod
    def create_session(student, topic=None, subject=None, title=None, course=None, tenant=None):
        """Create a new chat session."""
        from .models import ChatSession

        return ChatSession.objects.create(
            student=student,
            tenant=tenant,
            topic=topic,
            subject=subject,
            course=course,
            title=title or 'New Chat',
        )

    @staticmethod
    def add_message(session, role, content, **kwargs):
        """Add a message to a session."""
        from .models import ChatMessage

        message = ChatMessage.objects.create(
            session=session, tenant=session.tenant, role=role, content=content, **kwargs
        )

        session.message_count += 1
        if role == 'user' and (not session.title or session.title == 'New Chat'):
            session.title = content[:100]
        session.save()
        return message

    @staticmethod
    def get_session_history(session, limit=50):
        """Get message history for a session."""
        messages = session.messages.order_by('created_at')[:limit]
        return [
            {'role': msg.role, 'content': msg.content, 'id': str(msg.id)} for msg in messages
        ]

    @staticmethod
    def _tenant_of(session):
        """Whose AI key/budget this conversation spends.

        The student's own account is the authority here — never the stored
        ``session.tenant``, which originated from a client-supplied header and
        would otherwise let a user bill a tenant they don't belong to.
        """
        return (
            tenant_of_student(session.student)
            or session.tenant
            or getattr(session.course, 'tenant', None)
        )

    @staticmethod
    def process_question(session, question, image=None):
        """Answer a question without streaming (used by the simple endpoint)."""
        from .providers import complete

        user_message = ChatService.add_message(session, 'user', question)
        if image:
            user_message.image = image
            user_message.save()

        tenant = ChatService._tenant_of(session)
        try:
            resolution = resolver.resolve(tenant, session.student)
        except resolver.AIUnavailable as exc:
            return {
                'message': ChatService.add_message(
                    session, 'assistant', unavailable_message(exc), model_used='unavailable'
                ),
                'success': False,
                'reason': exc.reason,
            }

        history = ChatService.get_session_history(session)
        messages = build_messages(session, history, resolution.settings_obj)

        try:
            content, usage, elapsed = complete(resolution.provider, messages)
        except AIProviderError as exc:
            resolver.record_usage(
                tenant=tenant,
                student=session.student,
                session=session,
                resolved=resolution.provider,
                usage=Usage(),
                was_successful=False,
                error_message=str(exc),
            )
            return {
                'message': ChatService.add_message(
                    session,
                    'assistant',
                    UNAVAILABLE_TEMPLATE.format(reason=PROVIDER_ERROR_REASON),
                    model_used='error',
                ),
                'success': False,
                'reason': 'provider_error',
            }

        resolver.record_usage(
            tenant=tenant,
            student=session.student,
            session=session,
            resolved=resolution.provider,
            usage=usage,
            response_time_ms=elapsed,
        )

        ai_message = ChatService.add_message(
            session,
            'assistant',
            content,
            model_used=resolution.provider.model[:50],
            tokens_used=usage.total_tokens,
            response_time_ms=elapsed,
        )
        return {'message': ai_message, 'success': True}

    @staticmethod
    def process_question_streaming(session, question, image=None):
        """Answer a question as a newline-delimited JSON stream.

        Yields ``{'content': delta, 'done': False}`` chunks and a terminal
        ``{'done': True, ...}`` object carrying the saved message id.
        """
        from .providers import stream

        user_message = ChatService.add_message(session, 'user', question)
        if image:
            user_message.image = image
            user_message.save()

        tenant = ChatService._tenant_of(session)

        def generator():
            try:
                resolution = resolver.resolve(tenant, session.student)
            except resolver.AIUnavailable as exc:
                text = unavailable_message(exc)
                message = ChatService.add_message(
                    session, 'assistant', text, model_used='unavailable'
                )
                yield json.dumps(
                    {
                        'content': text,
                        'done': True,
                        'success': False,
                        'full_content': text,
                        'reason': exc.reason,
                        'message_id': str(message.id),
                    }
                ) + '\n'
                return

            history = ChatService.get_session_history(session)
            messages = build_messages(session, history, resolution.settings_obj)

            started = time.time()
            full_content = ''
            usage = Usage()

            try:
                for delta, chunk_usage in stream(resolution.provider, messages):
                    if chunk_usage is not None:
                        usage = chunk_usage
                    if delta:
                        full_content += delta
                        yield json.dumps({'content': delta, 'done': False}) + '\n'
            except AIProviderError as exc:
                resolver.record_usage(
                    tenant=tenant,
                    student=session.student,
                    session=session,
                    resolved=resolution.provider,
                    usage=Usage(),
                    was_successful=False,
                    error_message=str(exc),
                )
                if not full_content:
                    text = UNAVAILABLE_TEMPLATE.format(reason=PROVIDER_ERROR_REASON)
                    message = ChatService.add_message(
                        session, 'assistant', text, model_used='error'
                    )
                    yield json.dumps(
                        {
                            'content': text,
                            'done': True,
                            'success': False,
                            'full_content': text,
                            'reason': 'provider_error',
                            'message_id': str(message.id),
                        }
                    ) + '\n'
                    return

            elapsed = int((time.time() - started) * 1000)

            # Streaming APIs often omit usage; approximate so budgets still move.
            if not usage.total_tokens and full_content:
                approx_out = max(1, len(full_content) // 4)
                approx_in = max(1, sum(len(m['content']) for m in messages) // 4)
                usage = Usage(
                    prompt_tokens=approx_in,
                    completion_tokens=approx_out,
                    total_tokens=approx_in + approx_out,
                )

            resolver.record_usage(
                tenant=tenant,
                student=session.student,
                session=session,
                resolved=resolution.provider,
                usage=usage,
                response_time_ms=elapsed,
            )

            ai_message = ChatService.add_message(
                session,
                'assistant',
                full_content,
                model_used=resolution.provider.model[:50],
                tokens_used=usage.total_tokens,
                response_time_ms=elapsed,
            )
            yield json.dumps(
                {
                    'content': '',
                    'done': True,
                    'success': True,
                    'full_content': full_content,
                    'model': resolution.provider.model,
                    'message_id': str(ai_message.id),
                }
            ) + '\n'

        return generator()
