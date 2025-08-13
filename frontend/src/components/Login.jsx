import { useState } from 'react';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Login successful:', formData);
      
      // You would typically make an API call here
      // const response = await loginAPI(formData);
      
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    // Here you would typically make an API call to authenticate
    console.log('Login attempted with:', formData);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="brand">
          <div className="logo">🚀</div>
          <h2>Login Portal</h2>
        </div>
        <div className="login-header">
          <h1>Welcome Back!</h1>
          <p>Enter your credentials to continue your journey</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <span>Username</span>
              {formData.username && <span className="check">✓</span>}
            </label>
            <div className="input-with-icon">
              <i className="icon user-icon">👤</i>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                className={formData.username ? 'filled' : ''}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <span>Password</span>
              {formData.password && <span className="check">✓</span>}
            </label>
            <div className="input-with-icon">
              <i className="icon password-icon">🔒</i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className={formData.password ? 'filled' : ''}
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span className="checkbox-text">Keep me signed in</span>
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-text">Signing in...</span>
            ) : (
              <span className="button-text">Sign In</span>
            )}
          </button>
        </form>
        <div className="register-link">
          <p>New to our platform? <a href="#">Create an account</a></p>
        </div>
        <div className="secure-note">
          <span className="secure-icon">🔒</span>
          <p>Your data is protected with end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
