import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, HelpCircle, BarChart3, Zap, Image as ImageIcon, Camera, Users, BookOpen } from 'lucide-react'

import { communityService } from '../../services/communityService'
import SearchableSelect from '../common/SearchableSelect'
import toast from 'react-hot-toast'

const CreatePostModal = ({ isOpen, onClose, postType = 'question' }) => {
    const queryClient = useQueryClient()
    const [type, setType] = useState(postType)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedCourses, setSelectedCourses] = useState([])

    // Courses the current user can post into (enrolled courses for students;
    // all tenant courses for admins/instructors).
    const { data: filterOptions } = useQuery({
        queryKey: ['communityFilterOptions'],
        queryFn: () => communityService.getFilterOptions(),
        enabled: isOpen,
    })
    const availableCourses = filterOptions?.courses || []


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
            console.error('Post creation error:', error.response?.data)
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
        setImageFile(null)
        setImagePreview(null)
        setSelectedCourses([])
    }

    const toggleCourse = (courseId) => {
        setSelectedCourses((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId]
        )
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB')
                return
            }
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
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

        const submitData = new FormData()
        submitData.append('post_type', type)
        submitData.append('title', title.trim())
        submitData.append('content', content.trim())
        if (imageFile) {
            submitData.append('image', imageFile)
        }
        tags.forEach(tag => submitData.append('tags', tag))
        selectedCourses.forEach(courseId => submitData.append('courses', courseId))

        if (type === 'poll') {
            const validOptions = pollOptions.filter(o => o.trim())
            if (validOptions.length < 2) {
                toast.error('Poll must have at least 2 options')
                return
            }
            validOptions.forEach(opt => submitData.append('poll_options', opt))
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
            submitData.append('quiz_data', JSON.stringify({
                question: quizQuestion.trim(),
                options: validOptions,
                correct_answer: correctAnswer,
                explanation: explanation.trim()
            }))
        }

        createMutation.mutate(submitData)
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
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    transition={{ duration: 0.15 }}
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

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Attach Image (optional)</label>
                            <div className="flex items-center gap-4">
                                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-pointer transition-all">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <ImageIcon className="text-surface-400 mb-1" />
                                    <span className="text-xs text-surface-500">Add Photo</span>
                                </label>

                                {imagePreview && (
                                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null)
                                                setImagePreview(null)
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Course Visibility */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <BookOpen size={16} />
                                Post to Course(s)
                            </label>
                            {availableCourses.length > 0 ? (
                                <>
                                    <SearchableSelect
                                        multiple
                                        options={availableCourses.map((c) => ({ value: c.id, label: c.name }))}
                                        value={selectedCourses}
                                        onChange={setSelectedCourses}
                                        placeholder="Select course(s)"
                                        searchPlaceholder="Search courses..."
                                        buttonClassName="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-sm border border-surface-200 dark:border-surface-700 text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                        renderTriggerLabel={(vals) =>
                                            vals.length ? `${vals.length} course${vals.length > 1 ? 's' : ''} selected` : 'Select course(s) — leave empty for everyone'
                                        }
                                    />
                                    {selectedCourses.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedCourses.map((id) => {
                                                const course = availableCourses.find((c) => c.id === id)
                                                if (!course) return null
                                                return (
                                                    <span
                                                        key={id}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 border border-primary-200 dark:border-primary-800"
                                                    >
                                                        {course.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCourse(id)}
                                                            className="hover:text-error-500"
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    )}
                                    <p className="text-xs text-surface-500 mt-2 flex items-center gap-1">
                                        <Users size={12} />
                                        {selectedCourses.length === 0
                                            ? 'No course selected — visible to everyone in the community.'
                                            : 'Only students enrolled in the selected course(s) will see this post.'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-surface-500">
                                    You are not enrolled in any course yet. This post will be visible to everyone.
                                </p>
                            )}
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
