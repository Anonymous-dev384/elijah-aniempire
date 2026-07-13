import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SCHEDULE_DATA as MOCK_SCHEDULE } from '../data/mockData'
import { getSchedule, generateDetailUrl, encodeId, slugify } from '../services/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function generateNextDays() {
  const dates = []
  const today = new Date()

  // Start from 2 days ago to show some past schedule
  for (let i = -2; i < 5; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push({
      dateObj: d,
      dayIndex: d.getDay(),
      dayName: DAYS[d.getDay()],
      formattedDate: `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
    })
  }
  return dates
}

export default function EstimatedSchedule() {
  const [timeStr, setTimeStr] = useState('')
  const [days] = useState(generateNextDays())
  const [activeDayIdx, setActiveDayIdx] = useState(() => {
    // Dynamically find today's index in the generated days
    const todayStr = new Date().toDateString()
    const idx = days.findIndex(d => d.dateObj.toDateString() === todayStr)
    return idx >= 0 ? idx : 2 // Fallback to 2 if not found
  })
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [timezoneMode, setTimezoneMode] = useState(() => localStorage.getItem('aniempire-timezone') || 'local')

  useEffect(() => {
    localStorage.setItem('aniempire-timezone', timezoneMode)
  }, [timezoneMode])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const options = {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
        timeZone: timezoneMode === 'universal' ? 'UTC' : undefined
      }
      setTimeStr(now.toLocaleString('en-US', options) + (timezoneMode === 'universal' ? ' (UTC)' : ''))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [timezoneMode])

  useEffect(() => {
    async function loadSchedule() {
      setLoading(true)
      const dayName = DAY_NAMES[days[activeDayIdx].dayIndex]
      try {
        const data = await getSchedule(dayName)
        if (data && data.length > 0) {
          setSchedule(data)
        } else {
          // Fallback to mock data if API returns empty
          setSchedule(MOCK_SCHEDULE[days[activeDayIdx].dayIndex] || [])
        }
      } catch (err) {
        setSchedule(MOCK_SCHEDULE[days[activeDayIdx].dayIndex] || [])
      } finally {
        setLoading(false)
      }
    }
    loadSchedule()
  }, [activeDayIdx, days])

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2 className="schedule-title">Estimated Schedule</h2>
        <div className="schedule-header-right">
          <div className="schedule-clock">{timeStr}</div>
          <div className="timezone-toggle-wrap">
            <select 
              className="timezone-select"
              value={timezoneMode}
              onChange={(e) => setTimezoneMode(e.target.value)}
            >
              <option value="local">Local Time</option>
              <option value="universal">Universal (UTC)</option>
            </select>
            <div className="timezone-select-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="schedule-tabs-container">
        {days.map((dayObj, index) => {
          const isActive = index === activeDayIdx
          return (
            <button
              key={index}
              className={`schedule-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveDayIdx(index)}
            >
              <div className="tab-day">{dayObj.dayName}</div>
              <div className="tab-date">{dayObj.formattedDate}</div>
            </button>
          )
        })}
      </div>

      <div className="schedule-list">
        {loading ? (
          <div className="schedule-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="schedule-item schedule-item-skeleton">
                <div className="skeleton-time" />
                <div className="skeleton-title" />
                <div className="skeleton-ep-btn" />
              </div>
            ))}
          </div>
        ) : schedule.length > 0 ? (
          schedule.map((item, i) => {
            const now = new Date()
            let hasAired = false
            
            if (item.timestamp) {
              // Precise check using absolute timestamp
              hasAired = now >= new Date(item.timestamp * 1000)
            } else {
              // Fallback to local time parsing
              const airDate = new Date(days[activeDayIdx].dateObj)
              const [hours, minutes] = item.time.split(':').map(Number)
              airDate.setHours(hours, minutes, 0, 0)
              hasAired = now >= airDate
            }

            return (
              <div key={i} className="schedule-item">
                <span className="sched-time">
                  {item.timestamp 
                    ? new Date(item.timestamp * 1000).toLocaleTimeString(
                        timezoneMode === 'universal' ? 'en-GB' : [], 
                        { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          hour12: false,
                          timeZone: timezoneMode === 'universal' ? 'UTC' : undefined
                        }
                      )
                    : item.time
                  }
                </span>
                <Link to={generateDetailUrl('anime', item.title, item.id)} className="sched-title-link">
                  <span className="sched-title">{item.title}</span>
                </Link>
                {hasAired ? (
                  <Link 
                    to={`/watch/${slugify(item.title)}.${encodeId(item.id)}?ep=${item.episode}`}
                    className="sched-ep-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    Episode {item.episode}
                  </Link>
                ) : (
                  <span className="sched-ep-btn disabled" title="Not aired yet">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Ep {item.episode} (Pending)
                  </span>
                )}
              </div>
            )
          })
        ) : (
          <div className="schedule-empty">No episodes scheduled for this date.</div>
        )}
      </div>

      <style>{`
        .schedule-container {
          background: transparent;
          width: 100%;
        }
        .schedule-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .schedule-header-right {
          display: flex; align-items: center; gap: 12px;
        }
        .timezone-toggle-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .timezone-select {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          padding: 6px 34px 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s;
        }
        .timezone-select-icon {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .timezone-select:hover {
          border-color: var(--gold);
          color: var(--text-primary);
        }
        .timezone-select:hover + .timezone-select-icon {
          color: var(--gold);
        }
        .timezone-select:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--gold-glow-soft);
        }
        .schedule-title {
          font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-primary); margin: 0;
        }
        .schedule-clock {
          background: var(--bg-elevated); padding: 6px 14px; border-radius: var(--radius-full);
          font-size: 0.8rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;
          border: 1px solid var(--border-subtle);
        }
        
        .schedule-tabs-container {
          display: flex; gap: 10px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 16px;
          scrollbar-width: none;
        }
        .schedule-tabs-container::-webkit-scrollbar { display: none; }
        
        .schedule-tab {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); padding: 12px 20px; cursor: pointer;
          min-width: 90px; flex-shrink: 0; transition: all 0.2s ease;
        }
        .schedule-tab:hover {
          background: var(--bg-elevated); border-color: var(--border-hover);
        }
        .schedule-tab.active {
          background: var(--gold); border-color: var(--gold); color: #000;
          box-shadow: 0 4px 12px var(--gold-glow); transform: translateY(-2px);
        }
        .tab-day { font-size: 1rem; font-family: var(--font-heading); font-weight: 700; margin-bottom: 4px; }
        .schedule-tab.active .tab-day { color: #050403; }
        .schedule-tab:not(.active) .tab-day { color: var(--text-primary); }
        
        .tab-date { font-size: 0.75rem; font-weight: 600; opacity: 0.7; }
        .schedule-tab.active .tab-date { color: rgba(0,0,0,0.8); }
        .schedule-tab:not(.active) .tab-date { color: var(--text-muted); }

        .schedule-list {
          display: flex; flex-direction: column;
        }
        .schedule-item {
          display: flex; align-items: center; padding: 16px 14px;
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.2s;
        }
        .schedule-item:hover { background: var(--bg-hover); }
        .schedule-item:last-child { border-bottom: none; }
        
        .sched-time {
          font-size: 0.9rem; font-weight: 700; color: var(--text-muted); width: 60px; flex-shrink: 0;
        }
        .sched-title-link {
          flex: 1; display: flex; align-items: center; min-width: 0; text-decoration: none;
        }
        .sched-title {
          font-size: 0.95rem; font-weight: 700; color: var(--text-primary); padding: 0 16px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.2s;
        }
        .sched-title-link:hover .sched-title {
          color: var(--gold);
        }
        .sched-ep-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary);
          padding: 8px 14px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700;
          transition: all 0.2s; cursor: pointer; flex-shrink: 0;
        }
        .sched-ep-btn:hover {
          background: var(--gold-glow-soft); border-color: var(--gold); color: var(--gold);
        }
        .sched-ep-btn.disabled {
          background: rgba(255,255,255,0.03); border-color: var(--border-subtle); color: var(--text-muted);
          cursor: not-allowed; opacity: 0.7;
        }
        .sched-ep-btn.disabled svg { opacity: 0.5; }

        .schedule-loading, .schedule-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 20px; color: var(--text-muted); font-size: 0.9rem;
        }

        .schedule-item-skeleton { gap: 16px; }
        .skeleton-time { width: 50px; height: 16px; background: var(--bg-elevated); border-radius: 4px; }
        .skeleton-title { flex: 1; height: 18px; background: var(--bg-elevated); border-radius: 4px; }
        .skeleton-ep-btn { width: 80px; height: 28px; background: var(--bg-elevated); border-radius: 4px; }

        @media (max-width: 768px) {
          .schedule-header { margin-bottom: 16px; }
          .schedule-title { font-size: 1.1rem; }
          .schedule-clock { font-size: 0.7rem; padding: 4px 10px; }
          .timezone-select { font-size: 0.7rem; padding: 4px 24px 4px 10px; }
          .schedule-tab { min-width: 75px; padding: 10px 12px; }
          .tab-day { font-size: 0.85rem; }
          .tab-date { font-size: 0.65rem; }
          .schedule-item { padding: 12px 10px; }
          .sched-time { font-size: 0.8rem; width: 45px; }
          .sched-title { font-size: 0.9rem; }
          .sched-title-link { padding: 0 10px; }
          .sched-ep-btn { padding: 5px 8px; font-size: 0.7rem; gap: 4px; }
        }

        @media (max-width: 480px) {
          .schedule-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .schedule-header-right { width: 100%; justify-content: space-between; }
          .schedule-tab { min-width: 65px; }
          .sched-time { font-size: 0.75rem; width: 40px; }
          .sched-ep-btn span { display: none; }
          .sched-ep-btn { min-width: 40px; justify-content: center; }
        }
      `}</style>
    </div>
  )
}
