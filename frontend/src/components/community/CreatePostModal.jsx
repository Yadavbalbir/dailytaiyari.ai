import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, HelpCircle, BarChart3, Zap } from 'lucide-react'
import { communityService } from '../../services/communityService'
import toast from 'react-hot-toast'

const CreatePostModal = ({ isOpen, onClose, postType = 'question' }) => {
    const queryClient = useQueryClient()
    const [type, setType] = useState(postType)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')

    // Poll state
    const [pollOptions, setPollOptions] = useState(['', ''])

    // Quiz state
    const [quizQuestion, setQuizQuestion] = useState('')
    const [quizOptions, setQuizOptions] = useState(['', '', '', ''])
    const [correctAnswer, setCorrectAnswer] = useState(0)
    const [explanation, setExplanation] = useState('')

    const createMutation = useMutation({
        mutationFn: (data) => communityService.createPost(data),
        onSuccess: () => {
            toast.success('Post created successfully! +XP earned 🎉')
            queryClient.invalidateQueries(['communityPosts'])
            queryClient.invalidateQueries(['communityStats'])
            resetForm()
            onClose()
        },
        onError: (error) => {
            const message = error.response?.data?.content?.[0] ||
                error.response?.data?.title?.[0] ||
                error.response?.data?.detail ||
                'Failed to create post'
            toast.error(message)
        }
    })

    const resetForm = () => {
        setTitle('')
        setContent('')
        setTags([])
        setTagInput('')
        setPollOptions(['', ''])
        setQuizQuestion('')
        setQuizOptions(['', '', '', ''])
        setCorrectAnswer(0)
        setExplanation('')
    }

    const handleAddTag = () => {
        if (tagInput.trim() && tags.length < 5) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (index) => {
        setTags(tags.filter((_, i) => i !== index))
    }

    const handleAddPollOption = () => {
        if (pollOptions.length < 6) {
            setPollOptions([...pollOptions, ''])
        }
    }

    const handleRemovePollOption = (index) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!title.trim() || title.length < 10) {
            toast.error('Title must be at least 10 characters')
            return
        }

        if (!content.trim() || content.length < 20) {
            toast.error('Content must be at least 20 characters')
            return
        }

        const data = {
            post_type: type,
            title: title.trim(),
            content: content.trim(),
            tags
        }

        if (type === 'poll') {
            const validOptions = pollOptions.filter(o => o.trim())
            if (validOptions.length < 2) {
                toast.error('Poll must have at least 2 options')
                return
            }
            data.poll_options = validOptions
        }

        if (type === 'quiz') {
            const validOptions = quizOptions.filter(o => o.trim())
            if (!quizQuestion.trim()) {
                toast.error('Quiz question is required')
                return
            }
            if (validOptions.length < 2) {
                toast.error('Quiz must have at least 2 options')
                return
            }
            data.quiz_data = {
                question: quizQuestion.trim(),
                options: validOptions,
                correct_answer: correctAnswer,
                explanation: explanation.trim()
            }
        }

        createMutation.mutate(data)
    }

    const typeOptions = [
        { id: 'question', label: 'Question', icon: HelpCircle, color: 'blue' },
        { id: 'poll', label: 'Poll', icon: BarChart3, color: 'purple' },
        { id: 'quiz', label: 'Quiz', icon: Zap, color: 'amber' },
    ]

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                        <h2 className="text-xl font-bold">Create New Post</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Post Type Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Post Type</label>
                            <div className="flex gap-2">
                                {typeOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setType(option.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${type === option.id
                                                ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20 text-${option.color}-600`
                                                : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                                            }`}
                                    >
                                        <option.icon size={18} />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={
                                    type === 'question' ? 'What would you like to ask?' :
                                        type === 'poll' ? 'What do you want to poll about?' :
                                            'Quiz title'
                                }
                                className="input w-full"
                                maxLength={300}
                            />
                            <p className="text-xs text-surface-500 mt-1">{title.length}/300 characters</p>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {type === 'question' ? 'Details' : 'Description'}
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Provide more details..."
                                className="input w-full h-32 resize-none"
                            />
                        </div>

                        {/* Poll Options */}
                        {type === 'poll' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Poll Options</label>
                                <div className="space-y-2">
                                    {pollOptions.map((option, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const newOptions = [...pollOptions]
                                                    newOptions[index] = e.target.value
                                                    setPollOptions(newOptions)
                                                }}
                                                placeholder={`Option ${index + 1}`}
                                                className="input flex-1"
                                            />
                                            {pollOptions.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePollOption(index)}
                                                    className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {pollOptions.length < 6 && (
                                        <button
                                            type="button"
                                            onClick={handleAddPollOption}
                                            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                                        >
                                            <Plus size={16} />
                                            Add Option
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quiz Options */}
                        {type === 'quiz' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Quiz Question</label>
                                    <textarea
                                        value={quizQuestion}
                                        onChange={(e) => setQuizQuestion(e.target.value)}
                                        placeholder="Enter your quiz question..."
                                        className="input w-full h-20 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Answer Options</label>
                                    <div className="space-y-2">
                                        {quizOptions.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={correctAnswer === index}
                                                    onChange={() => setCorrectAnswer(index)}
                                                    className="w-4 h-4 text-success-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...quizOptions]
                                                        newOptions[index] = e.target.value
                                                        setQuizOptions(newOptions)
                                                    }}
                                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                    className={`input flex-1 ${correctAnswer === index
                                                            ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                                                            : ''
                                                        }`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-surface-500 mt-2">
                                        Select the correct answer by clicking the radio button
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Explanation (optional)</label>
                                    <textarea
                                        value={explanation}
                                        onChange={(e) => setExplanation(e.target.value)}
                                        placeholder="Explain why this answer is correct..."
                                        className="input w-full h-20 resize-none"
                                    />
                                </div>
                            </>
                        )}

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Tags (optional)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full text-sm"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(index)}
                                            className="hover:text-error-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            {tags.length < 5 && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        placeholder="Add a tag..."
                                        className="input flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="btn-secondary"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={createMutation.isPending}
                                className="btn-primary"
                            >
                                {createMutation.isPending ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default CreatePostModal
