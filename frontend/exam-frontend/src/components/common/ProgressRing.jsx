import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const ProgressRing = ({ 
  value, 
  maxValue = 100, 
  size = 100, 
  strokeWidth = 10,
  color = '#f97316',
  trailColor = '#e5e5e5',
  showPercentage = true,
  label,
  children 
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div style={{ width: size, height: size }} className="relative">
      <CircularProgressbar
        value={percentage}
        styles={buildStyles({
          pathColor: color,
          trailColor: trailColor,
          strokeLinecap: 'round',
          pathTransitionDuration: 0.5,
        })}
        strokeWidth={strokeWidth}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showPercentage && (
              <span className="text-lg font-bold">{Math.round(percentage)}%</span>
            )}
            {label && (
              <span className="text-xs text-surface-500 text-center px-2">{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProgressRing

