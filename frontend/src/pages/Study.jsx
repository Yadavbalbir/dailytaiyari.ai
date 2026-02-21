import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { examService } from '../services/examService'
import { contentService } from '../services/contentService'
import { analyticsService } from '../services/analyticsService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import { Calendar, BookOpen, CheckCircle2 } from 'lucide-react'

const Study = () => {
  const navigate = useNavigate()
  const { subjectId } = useParams()
  const { profile } = useAuthStore()
  const [selectedSubject, setSelectedSubject] = useState(subjectId || null)

  const primaryExamId = profile?.primary_exam

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', primaryExamId],
    queryFn: () => examService.getSubjects(primaryExamId),
    enabled: !!primaryExamId,
  })

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics', selectedSubject],
    queryFn: () => examService.getTopics(selectedSubject),
    enabled: !!selectedSubject,
  })

  // Fetch topic mastery for progress tracking
  const { data: topicMastery } = useQuery({
    queryKey: ['topicMastery', selectedSubject],
    queryFn: () => analyticsService.getMasteryBySubject(selectedSubject),
    enabled: !!selectedSubject,
  })

  const { data: studyPlan } = useQuery({
    queryKey: ['todayStudyPlan'],
    queryFn: () => contentService.getTodayStudyPlan(),
  })

  // Merge topics with mastery data
  const topicsWithProgress = useMemo(() => {
    if (!topics) return []
    const masteryMap = new Map()
      ; (topicMastery || []).forEach(m => {
        masteryMap.set(m.topic, {
          level: m.mastery_level,
          score: m.mastery_score,
          accuracy: m.accuracy_percentage,
        })
      })
    return topics.map(topic => ({
      ...topic,
      progress: masteryMap.get(topic.id) || null,
    }))
  }, [topics, topicMastery])

  if (subjectsLoading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Study Materials</h1>
        <p className="text-surface-500 mt-1">Learn at your own pace with curated content</p>
      </div>

      {/* Today's Plan Quick View */}
      {studyPlan?.items?.length > 0 && (
        <div className="card p-5 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-primary-500" /> Today's Study Plan
            </h3>
            <span className="text-sm text-surface-500">
              {studyPlan.items.filter(i => i.status === 'completed').length}/{studyPlan.items.length} completed
            </span>
          </div>
          <div className="progress-bar h-2 mb-4">
            <div
              className="progress-bar-fill bg-gradient-to-r from-primary-500 to-accent-500"
              style={{
                width: `${(studyPlan.items.filter(i => i.status === 'completed').length / studyPlan.items.length) * 100}%`
              }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {studyPlan.items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 ${item.status === 'completed'
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-700'
                    : 'bg-white dark:bg-surface-800'
                  }`}
              >
                {item.status === 'completed' && <CheckCircle2 size={14} />}{item.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Subjects</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(subjects || []).map((subject) => (
            <motion.div
              key={subject.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSubject(subject.id)}
              className={`card p-5 cursor-pointer transition-all ${selectedSubject === subject.id
                  ? 'border-2 border-primary-500 shadow-lg'
                  : 'hover:border-primary-200'
                }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-500 mb-3"
                style={{ backgroundColor: `${subject.color}20` }}
              >
                <BookOpen size={24} />
              </div>
              <h3 className="font-semibold">{subject.name}</h3>
              <p className="text-sm text-surface-500 mt-1">
                {subject.topics_count || subject.total_topics} topics
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Topics List */}
      {selectedSubject && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Topics</h2>
          {topicsLoading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topicsWithProgress.map((topic) => {
                const progressPercent = topic.progress ? Math.round(topic.progress.score) : 0
                const masteryLevel = topic.progress?.level || 0

                return (
                  <motion.div
                    key={topic.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/topic/${topic.id}`)}
                    className="card p-4 cursor-pointer hover:border-primary-200 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{topic.name}</h4>
                        <p className="text-sm text-surface-500 mt-1">
                          {topic.total_content || 0} lessons • {topic.total_questions || 0} questions
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`badge ${topic.difficulty === 'easy' ? 'badge-success' :
                            topic.difficulty === 'hard' ? 'badge-error' : 'badge-warning'
                          }`}>
                          {topic.difficulty}
                        </span>
                        {masteryLevel > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${masteryLevel >= 4 ? 'bg-success-100 text-success-700' :
                              masteryLevel >= 3 ? 'bg-primary-100 text-primary-700' :
                                'bg-warning-100 text-warning-700'
                            }`}>
                            Level {masteryLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-surface-500">Mastery</span>
                        <span className="font-medium">{progressPercent}%</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className={`progress-bar-fill ${progressPercent >= 75 ? 'bg-success-500' :
                              progressPercent >= 50 ? 'bg-primary-500' :
                                progressPercent >= 25 ? 'bg-warning-500' : 'bg-surface-300'
                            }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Study

