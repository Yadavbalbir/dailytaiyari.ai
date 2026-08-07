/**
 * Detects a practice quiz inside an assistant message and converts it into the
 * structured shape <ChatQuiz /> renders.
 *
 * Models are asked (in the backend system prompt) to emit a fixed
 * "Q1. / A) / Answer: / Topic: / Explanation:" layout, but they drift —
 * different providers bold things differently, number questions differently, or
 * wrap the quiz in a JSON block. This parser accepts all of those variants and
 * returns `null` when the message is ordinary prose.
 *
 * The `Topic:` lines matter beyond cosmetics: they are submitted with the
 * attempt and become the student's per-concept mastery breakdown, so a quiz
 * must never be filed away under a meaningless label like "Practice Quiz".
 */

/**
 * Matches "Topic: Kinematics", "**Quiz Topic:** Kinematics", "Concept - Optics".
 * Group 1 is set only for the quiz-level header, group 2 is the label.
 */
const TOPIC_LINE = /^\*{0,2}(Quiz\s+)?(?:Topic|Concept|Tests)\s*\*{0,2}\s*[:\-–]\s*\*{0,2}(.+)$/i

/** Labels that carry no diagnostic value — mirrored in chatbot/models.py. */const GENERIC_TOPIC_LABELS = new Set([
  'quiz', 'quizzes', 'practice', 'practice quiz', 'practice quizzes',
  'practice questions', 'ai quiz', 'ai generated quiz', 'ai-generated quiz',
  'general', 'general quiz', 'general knowledge', 'misc', 'miscellaneous',
  'mcq', 'mcqs', 'test', 'mock test', 'questions', 'revision', 'topic',
  'untitled', 'n/a', 'na', 'none', 'other', 'others',
])

/** Cleans a model-supplied topic label, returning '' when it is useless. */
export const normalizeTopic = (value) => {
  if (!value || typeof value !== 'string') return ''
  const label = value
    .replace(/[*#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.:\-–—"']+|[.:\-–—"']+$/g, '')
    .trim()
  if (label.length < 2) return ''
  if (GENERIC_TOPIC_LABELS.has(label.toLowerCase())) return ''
  return label.slice(0, 200)
}

/**
 * Picks the label shown for the whole quiz: the model's own quiz topic when it
 * gave one, otherwise the concept most of the questions test.
 */
export const deriveQuizTitle = (questions = [], explicitTopic = '') => {
  const explicit = normalizeTopic(explicitTopic)
  if (explicit) return explicit

  const counts = new Map()
  questions.forEach((q) => {
    const topic = normalizeTopic(q?.topic)
    if (topic) counts.set(topic, (counts.get(topic) || 0) + 1)
  })
  if (counts.size === 0) return ''

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  if (ranked.length === 1) return ranked[0][0]
  // A mixed quiz is named after its dominant concept, with the rest counted.
  return `${ranked[0][0]} +${ranked.length - 1} more`
}

export const parseQuizFromMessage = (content) => {
  if (!content) return null

  // Preferred shape: an explicit ```json { "type": "quiz", ... } ``` block.
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?"type"\s*:\s*"quiz"[\s\S]*?\})\s*```/i)
  if (jsonMatch) {
    try {
      const quiz = JSON.parse(jsonMatch[1])
      if (quiz.type === 'quiz' && quiz.questions) {
        const questions = quiz.questions.map((q) => ({
          ...q,
          topic: normalizeTopic(q?.topic || q?.concept),
        }))
        return {
          quiz: {
            ...quiz,
            questions,
            title: deriveQuizTitle(questions, quiz.topic || quiz.title),
          },
          remainingContent: content.replace(jsonMatch[0], '').trim(),
        }
      }
    } catch {
      // Malformed JSON — fall through to the line-based parser.
    }
  }

  const lines = content.split('\n')
  const questions = []
  let currentQuestion = null
  let currentOptions = []
  let currentExplanation = ''
  let correctAnswer = null
  let currentTopic = ''
  let quizTopic = ''
  const introText = []
  let isInQuiz = false

  const saveCurrentQuestion = () => {
    if (currentQuestion && currentOptions.length >= 2) {
      let correctIndex = -1
      if (correctAnswer) {
        correctIndex = correctAnswer.toUpperCase().charCodeAt(0) - 65
      }
      if (correctIndex === -1 || correctIndex >= currentOptions.length) {
        correctIndex = currentOptions.findIndex((o) => o.isCorrect)
      }
      if (correctIndex === -1) correctIndex = 0

      questions.push({
        question: currentQuestion,
        options: currentOptions.map((o) => o.text),
        correct_option: correctIndex,
        explanation: currentExplanation.trim() || null,
        topic: currentTopic,
        difficulty: 'medium',
      })
    }
    currentQuestion = null
    currentOptions = []
    currentExplanation = ''
    correctAnswer = null
    currentTopic = ''
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const topicMatch = line.match(TOPIC_LINE)
    if (topicMatch) {
      const label = normalizeTopic(topicMatch[2])
      if (currentQuestion) {
        currentTopic = label
      } else if (!quizTopic) {
        quizTopic = label
      }
      isInQuiz = isInQuiz || Boolean(topicMatch[1])
      continue
    }

    const questionMatch =
      line.match(/^\*{0,2}Q(?:uestion)?\.?\s*(\d+)[.):\s]+\*{0,2}\s*(.+)/i) ||
      line.match(/^(\d+)[.)]\s+(.+)/)

    if (questionMatch && !line.match(/^[A-Da-d][.)]/)) {
      saveCurrentQuestion()
      isInQuiz = true
      currentQuestion = questionMatch[2].trim().replace(/\*+/g, '')
      continue
    }

    const optionMatch = line.match(/^\*{0,2}([A-Da-d])[.):\s]+\*{0,2}\s*(.+)/i)
    if (optionMatch && currentQuestion) {
      let optionText = optionMatch[2].trim()

      // Some models mark the answer inline instead of on an "Answer:" line.
      const isCorrect =
        optionText.includes('✓') ||
        optionText.toLowerCase().includes('(correct)') ||
        optionText.includes('✔') ||
        /\*{2}correct\*{2}/i.test(optionText)

      optionText = optionText
        .replace(/[✓✔]/g, '')
        .replace(/\*{0,2}\(correct\)\*{0,2}/gi, '')
        .replace(/\*{2}correct\*{2}/gi, '')
        .trim()

      currentOptions.push({ letter: optionMatch[1].toUpperCase(), text: optionText, isCorrect })
      continue
    }

    const answerMatch = line.match(/^\*{0,2}(?:Correct\s+)?Answer\*{0,2}[:\s]+\*{0,2}([A-Da-d])\)?/i)
    if (answerMatch && currentQuestion) {
      correctAnswer = answerMatch[1].toUpperCase()
      continue
    }

    const explanationMatch = line.match(/^\*{0,2}(?:Explanation|Solution|Reason)\*{0,2}[:\s]+(.+)/i)
    if (explanationMatch && currentQuestion) {
      currentExplanation = explanationMatch[1].trim()
      // Explanations often wrap over several lines until the next question.
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        if (
          !nextLine ||
          nextLine.match(/^\*{0,2}Q(?:uestion)?\.?\s*\d+/i) ||
          nextLine.match(/^\d+[.)]\s+/) ||
          nextLine.match(/^\*{0,2}(?:Correct\s+)?Answer\*{0,2}[:\s]/i) ||
          TOPIC_LINE.test(nextLine)
        ) {
          break
        }
        i++
        currentExplanation += ` ${nextLine}`
      }
      continue
    }

    if (!isInQuiz) introText.push(line)
  }

  saveCurrentQuestion()

  if (questions.length >= 1) {
    return {
      quiz: {
        type: 'quiz',
        title: deriveQuizTitle(questions, quizTopic),
        questions,
      },
      remainingContent: introText.join('\n').trim(),
    }
  }

  return null
}

/** Cheap check used mid-stream so answers aren't revealed while typing out. */
export const looksLikeQuiz = (content) =>
  /^\*{0,2}Q(?:uestion)?\.?\s*\d+/im.test(content) ||
  /^\d+[.)]\s+.+\n.*[A-D][.)]/m.test(content)

export default parseQuizFromMessage
