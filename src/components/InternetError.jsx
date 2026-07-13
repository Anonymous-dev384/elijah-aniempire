import { Link } from 'react-router-dom'

export default function InternetError({ 
  onRetry, 
  title = "Connection Lost", 
  message = "It seems like you've wandered into a signal dead zone. Please check your connection and try again.",
  buttonText = "Try Again"
}) {
  return (
    <div className="error-container anim-fade-up">
      <div className="error-content">
        <img 
          src="/assets/internet_error_anime.png" 
          alt="Connection Error" 
          className="error-image"
        />
        <h1 className="error-title">{title}</h1>
        <p className="error-message">
          {message}
        </p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={onRetry}>
            {buttonText}
          </button>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
      </div>
    </div>
  </div>
  )
}
