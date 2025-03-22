import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase/config';
import './Login.css';
import googleLogo from '../assets/google-logo.svg';
import Footer from './Footer';

function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // User signed in successfully
      console.log('Signed in user:', result.user);
      // Redirect to dashboard or home page
      navigate('/personal_dash');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-logo">
            <h1>Hii!</h1>
          </div>

          <p className="login-description">
            Welcome to smartInvest
          </p>

          <button 
            className="google-signin-button"
            onClick={handleGoogleSignIn}
          >
            <img 
              src={googleLogo}
              alt="Google Logo"
              width="24"
              height="24"
            />
            Continue with Google
          </button>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
