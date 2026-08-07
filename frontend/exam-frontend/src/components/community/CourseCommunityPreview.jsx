import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  MessageSquare, MessageCircle, BarChart3, Zap, Calendar, Users,
  CheckCircle2, ThumbsUp, Sparkles, ArrowRight, Lock, Maximize2, Flame,
} from 'lucide-react'
import { communityService } from '../../services/communityService'
import { useTenantStore } from '../../context/tenantStore'

const TYPE_META = {
  question: { icon: MessageCircle, label: 'Question', cls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/25' },
  poll: { icon: BarChart3, label: 'Poll', cls: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/25' },
  quiz: { icon: Zap, label: 'Quiz', cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/25' },
  event: { icon: Calendar, label: 'Event', cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25' },
}

const timeAgo = (value) => {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString()
}

const Avatar = ({ person, size = 28 }) => (
  <span
    className="rounded-full ring-2 ring-white dark:ring-surface-900 bg-gradient-to-br from-primary-400 to-accent-500 text-white flex items-center justify-center text-[11px] font-semibold overflow-hidden shrink-0"
    style={{ width: size, height: size }}
    title={person?.full_name}
  >
    {person?.avatar ? (
      <img src={person.avatar} alt={person.full_name || ''} className="w-full h-full object-cover" />
    ) : (
      (person?.first_name || person?.full_name || 'U').charAt(0).toUpperCase()
    )}
  </span>
)

const StatPill = ({ icon: Icon, value, label, accent }) => (
  <div className="flex-1 min-w-[76px] rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-3 py-2">
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={accent || 'text-white/70'} />
      <span className="text-base font-bold leading-none">{value}</span>
    </div>
    <p className="text-[11px] text-white/70 mt-1">{label}</p>
  </div>
)

/**
 * Course-scoped community teaser.
 *
 * Renders a compact, attention-grabbing snapshot of a course's discussions and
 * links through to the full forum pre-filtered to that course. Non-enrolled
 * visitors get a blurred/locked variant that advertises the activity without
 * revealing discussion content.
 *
 * @param {string}  courseId    Course UUID
 * @param {string}  courseName  Used for the empty/locked copy
 * @param {string}  variant     'panel' (wide, course landing) | 'compact' (sidebar)
 * @param {string}  accentColor Optional course brand colour for the header
 */
const CourseCommunityPreview = ({
  courseId,
  courseName,
  variant = 'panel',
  accentColor,
  className = '',
}) => {
  const navigate = useNavigate()
  const isFeatureEnabled = useTenantStore((s) => s.isFeatureEnabled)
  const communityEnabled = isFeatureEnabled('community')
  const compact = variant === 'compact'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courseCommunityPreview', courseId, compact ? 3 : 4],
    queryFn: () => communityService.getCoursePreview(courseId, compact ? 3 : 4),
    enabled: !!courseId && communityEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const stats = data?.stats || {}
  const posts = data?.posts || []
  const people = data?.contributors_preview || []
  const canParticipate = !!data?.can_participate
  const hasActivity = (stats.posts || 0) > 0

  const headerStyle = useMemo(
    () => (accentColor ? { backgroundImage: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` } : undefined),
    [accentColor]
  )

  const openForum = () => navigate(`/community?course=${courseId}`)
  const openPost = (post) => {
    if (canParticipate) navigate(`/community/${post.id}`)
    else openForum()
  }

  if (!communityEnabled || isError) return null

  if (isLoading) {
    return (
      <div className={`card overflow-hidden animate-pulse ${className}`}>
        <div className="h-28 bg-surface-200 dark:bg-surface-800" />
        <div className="p-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-surface-100 dark:bg-surface-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`card overflow-hidden ${className}`}
    >
      {/* Header band */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-600 to-accent-600 text-white"
        style={headerStyle}
      >
        <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-black/10" />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 ring-1 ring-white/20 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-wide">
                  <Users size={12} /> Course community
                </span>
                {stats.new_this_week > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 ring-1 ring-emerald-200/40 text-[11px] font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-100" />
                    </span>
                    {stats.new_this_week} new this week
                  </span>
                )}
              </div>
              <h2 className={`mt-2.5 font-display font-bold leading-tight ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                {hasActivity ? 'Learners are talking right now' : 'Start the conversation'}
              </h2>
              <p className="text-white/80 text-sm mt-1 max-w-lg">
                {hasActivity
                  ? 'Questions, answers, polls and live events — all scoped to this course.'
                  : `Be the first to ask a question in ${courseName || 'this course'} and help others get unstuck.`}
              </p>
            </div>

            {!compact && (
              <button
                onClick={openForum}
                className="hidden sm:inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 ring-1 ring-white/25 backdrop-blur-sm transition-colors"
                title="Open the full community forum for this course"
              >
                <Maximize2 size={15} /> Full screen
              </button>
            )}
          </div>

          {/* Stats */}
          <div className={`mt-4 flex flex-wrap gap-2 ${compact ? '' : 'sm:gap-3'}`}>
            <StatPill icon={MessageSquare} value={stats.posts || 0} label="Discussions" />
            <StatPill icon={MessageCircle} value={stats.answers || 0} label="Replies" />
            {!compact && <StatPill icon={CheckCircle2} value={stats.solved || 0} label="Solved" accent="text-emerald-200" />}
            <StatPill icon={Users} value={stats.members || 0} label="Members" />
          </div>

          {/* Avatar stack */}
          {people.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {people.map((p, i) => (
                  <Avatar key={i} person={p} size={compact ? 24 : 28} />
                ))}
              </div>
              <p className="text-xs text-white/80">
                {people[0]?.first_name || people[0]?.full_name}
                {stats.contributors > 1 && ` and ${stats.contributors - 1} other${stats.contributors - 1 === 1 ? '' : 's'}`}
                {' are active here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Post teasers */}
      <div className="relative">
        {posts.length > 0 ? (
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {posts.map((post, index) => {
              const meta = TYPE_META[post.post_type] || TYPE_META.question
              const TypeIcon = meta.icon
              return (
                <motion.li
                  key={post.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <button
                    type="button"
                    onClick={() => openPost(post)}
                    className="group w-full text-left px-5 py-3.5 flex gap-3 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
                      <TypeIcon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {post.title}
                        </span>
                        {post.is_solved && (
                          <CheckCircle2 size={14} className="text-success-500 shrink-0 mt-0.5" />
                        )}
                      </span>
                      {!compact && post.excerpt && (
                        <span className="block text-xs text-surface-500 line-clamp-1 mt-0.5">{post.excerpt}</span>
                      )}
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-surface-400">
                        <span className="inline-flex items-center gap-1">
                          <Avatar person={post.author} size={16} />
                          {post.author?.first_name || post.author?.full_name || 'Member'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle size={11} /> {post.comments_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp size={11} /> {post.likes_count || 0}
                        </span>
                        <span>{timeAgo(post.created_at)}</span>
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 self-center text-surface-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all"
                    />
                  </button>
                </motion.li>
              )
            })}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center">
            <span className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/25 text-primary-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={22} />
            </span>
            <p className="font-semibold text-sm">No discussions yet</p>
            <p className="text-xs text-surface-500 mt-1 max-w-xs mx-auto">
              {canParticipate
                ? 'Ask the first question — early contributors earn the most community XP.'
                : 'Join this course to start the very first discussion.'}
            </p>
          </div>
        )}

        {/* Locked overlay for people who are not part of the course yet */}
        {!canParticipate && posts.length > 0 && (
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-white via-white/92 to-white/25 dark:from-surface-900 dark:via-surface-900/92 dark:to-surface-900/25 backdrop-blur-[2px]">
            <div className="w-full px-5 py-4 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 dark:text-surface-300">
                <Lock size={13} /> Enroll to read and join these discussions
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40">
        <button
          onClick={openForum}
          className="btn-primary w-full group/cta"
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        >
          {canParticipate ? (
            <>
              <MessageSquare size={16} />
              Open community
              <ArrowRight size={16} className="transition-transform group-hover/cta:translate-x-0.5" />
            </>
          ) : (
            <>
              <Flame size={16} />
              Explore the community
              <ArrowRight size={16} className="transition-transform group-hover/cta:translate-x-0.5" />
            </>
          )}
        </button>
        {!compact && (
          <p className="text-[11px] text-center text-surface-400 mt-2">
            Opens the full forum filtered to {courseName || 'this course'}.
          </p>
        )}
      </div>
    </motion.section>
  )
}

export default CourseCommunityPreview
