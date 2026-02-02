import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { examService } from '../services/examService'
import { contentService } from '../services/contentService'
import Loading from '../components/common/Loading'

const TopicView = () => {
  const { topicId } = useParams()
  const navigate = useNavigate()

  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => examService.getTopicDetails(topicId),
  })

  const { data: contents, isLoading: contentsLoading } = useQuery({
    queryKey: ['topicContent', topicId],
    queryFn: () => contentService.getContentByTopic(topicId),
  })

  if (topicLoading) return <Loading fullScreen />

  const contentTypes = {
    notes: { icon: '📝', label: 'Notes', color: 'bg-blue-100 text-blue-700' },
    video: { icon: '🎬', label: 'Video', color: 'bg-red-100 text-red-700' },
    pdf: { icon: '📄', label: 'PDF', color: 'bg-green-100 text-green-700' },
    revision: { icon: '🔄', label: 'Revision', color: 'bg-purple-100 text-purple-700' },
    formula: { icon: '📐', label: 'Formula Sheet', color: 'bg-yellow-100 text-yellow-700' },
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/study')} className="text-surface-500 hover:text-primary-600">
          Study
        </button>
        <span className="text-surface-400">/</span>
        <span className="text-surface-500">{topic?.subject_name}</span>
        <span className="text-surface-400">/</span>
        <span className="font-medium">{topic?.name}</span>
      </div>

      {/* Topic Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">{topic?.name}</h1>
            <p className="text-surface-500 mt-1">{topic?.description || 'Master this topic through videos and practice'}</p>
          </div>
          <span className={`badge ${
            topic?.difficulty === 'easy' ? 'badge-success' :
            topic?.difficulty === 'hard' ? 'badge-error' : 'badge-warning'
          }`}>
            {topic?.difficulty}
          </span>
        </div>
        
        <div className="flex items-center gap-6 mt-4 text-sm text-surface-500">
          <span>📚 {topic?.total_content || contents?.length || 0} materials</span>
          <span>❓ {topic?.total_questions || 0} questions</span>
          <span>⏱️ Est. {topic?.estimated_study_hours || 2}h study time</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate(`/quiz?topic=${topicId}`)}
          className="card p-4 text-center hover:border-primary-300 transition-colors"
        >
          <span className="text-2xl">✍️</span>
          <p className="font-medium mt-2">Practice Quiz</p>
        </button>
        <button 
          onClick={() => navigate('/doubt-solver')}
          className="card p-4 text-center hover:border-primary-300 transition-colors"
        >
          <span className="text-2xl">🤖</span>
          <p className="font-medium mt-2">Ask AI Doubt</p>
        </button>
        <button className="card p-4 text-center hover:border-primary-300 transition-colors">
          <span className="text-2xl">📑</span>
          <p className="font-medium mt-2">Flashcards</p>
        </button>
        <button className="card p-4 text-center hover:border-primary-300 transition-colors">
          <span className="text-2xl">📊</span>
          <p className="font-medium mt-2">My Progress</p>
        </button>
      </div>

      {/* Content List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Study Materials</h2>
        {contentsLoading ? (
          <Loading />
        ) : contents?.length > 0 ? (
          <div className="space-y-3">
            {contents.map((content, index) => {
              const typeConfig = contentTypes[content.content_type] || contentTypes.notes
              
              return (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/content/${content.id}`)}
                  className="card p-4 cursor-pointer hover:border-primary-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${typeConfig.color}`}>
                      {typeConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{content.title}</h4>
                        {content.is_free && <span className="badge-success text-[10px]">Free</span>}
                      </div>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {content.estimated_time_minutes} min • {typeConfig.label}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-surface-500">
            <span className="text-4xl mb-4 block">📚</span>
            <p>No content available for this topic yet</p>
            <button 
              onClick={() => navigate('/doubt-solver')}
              className="btn-primary mt-4"
            >
              Ask AI Tutor
            </button>
          </div>
        )}
      </div>

      {/* Subtopics if any */}
      {topic?.subtopics?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Subtopics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topic.subtopics.map((subtopic) => (
              <div
                key={subtopic.id}
                onClick={() => navigate(`/topic/${subtopic.id}`)}
                className="card p-4 cursor-pointer hover:border-primary-200"
              >
                <h4 className="font-medium">{subtopic.name}</h4>
                <p className="text-sm text-surface-500">
                  {subtopic.total_questions} questions
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TopicView

