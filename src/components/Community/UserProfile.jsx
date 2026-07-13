import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useUserStore from '../../store/userStore'
import useCommunityStore from '../../store/communityStore'
import OptimizedImage from '../OptimizedImage'

export default function UserProfile() {
  const { userId } = useParams()
  const { profile, stats, achievements, fetchProfile, fetchStats, fetchAchievements } = useUserStore()
  const { followers, fetchFollowers } = useCommunityStore()

  useEffect(() => {
    fetchProfile(userId)
    fetchStats(userId)
    fetchAchievements(userId)
    fetchFollowers(userId)
  }, [userId])

  if (!profile) return <div>Loading...</div>

  return (
    <div className="user-profile-page section">
      <div className="profile-header">
        <div className="profile-banner" />
        <div className="profile-card">
          <OptimizedImage
            src={profile.avatar_url}
            alt={profile.username}
            width={120}
            height={120}
            className="profile-avatar"
          />
          <div className="profile-info">
            <h1>{profile.username}</h1>
            <p className="profile-bio">{profile.bio}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{stats?.reviews_count || 0}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="stat">
                <span className="stat-value">{stats?.level || 1}</span>
                <span className="stat-label">Level</span>
              </div>
              <div className="stat">
                <span className="stat-value">{followers.length}</span>
                <span className="stat-label">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <section className="achievements-section">
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {achievements.map(ach => (
              <div key={ach.id} className="achievement-badge" title={ach.achievements?.title}>
                <div className="badge-icon">{ach.achievements?.icon}</div>
                <div className="badge-progress">Unlocked</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .user-profile-page {
          max-width: 1000px;
          margin: 0 auto;
        }
        .profile-header {
          position: relative;
          margin-bottom: 40px;
        }
        .profile-banner {
          width: 100%;
          height: 300px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          border-radius: var(--radius-lg);
          margin-bottom: -60px;
        }
        .profile-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 40px;
          display: flex;
          gap: 30px;
          align-items: flex-start;
        }
        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid var(--gold);
          flex-shrink: 0;
        }
        .profile-info {
          flex: 1;
        }
        .profile-info h1 {
          font-size: 2rem;
          margin-bottom: 8px;
        }
        .profile-bio {
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .profile-stats {
          display: flex;
          gap: 30px;
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gold);
        }
        .stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .achievements-section {
          margin-top: 40px;
        }
        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .achievement-badge {
          aspect-ratio: 1;
          background: var(--bg-card);
          border: 2px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .achievement-badge:hover {
          border-color: var(--gold);
          background: var(--gold-glow-soft);
        }
        .badge-icon {
          font-size: 2.5rem;
        }
        .badge-progress {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
