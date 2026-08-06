/**
 * Detects a practice quiz inside an assistant message and converts it into the
 * structured shape <ChatQuiz /> renders.
 *
 * Models are asked (in the backend system prompt) to emit a fixed
 * "Q1. / A) / Answer: / Explanation:" layout, but they drift — different
 * providers bold things differently, number questions differently, or wrap the
 * quiz in a JSON block. This parser accepts all of those variants and returns
 * `null` when the message is ordinary prose.
 */
export const parseQuizFromMessage = (content) => {
  if (!content) return null

  // Preferred shape: an explicit ```json { "type": "quiz", ... } ``` block.
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?"type"\s*:\s*"quiz"[\s\S]*?\})\s*```/i)
  if (jsonMatch) {
    try {
      const quiz = JSON.parse(jsonMatch[1])
      if (quiz.type === 'quiz' && quiz.questions) {
        return {
          quiz,
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
        difficulty: 'medium',
      })
    }
    currentQuestion = null
    currentOptions = []
    currentExplanation = ''
    correctAnswer = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

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
          nextLine.match(/^\*{0,2}(?:Correct\s+)?Answer\*{0,2}[:\s]/i)
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
      quiz: { type: 'quiz', title: 'Practice Quiz', questions },
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
