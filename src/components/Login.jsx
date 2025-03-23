import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase/config';
import './Login.css';
import googleLogo from '../assets/google-logo.svg';
import Footer from './Footer';
import axios from 'axios';

function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // User signed in successfully
      console.log('Signed in user:', result.user);

      // Create or get user in backend
      try {
        const response = await axios.post('http://127.0.0.1:8000/game/create_user/', {
          user_id: result.user.uid,
          name: result.user.displayName || result.user.email
        });

        if (response.data.success) {
          // Store user ID in localStorage for future use
          localStorage.setItem('userId', result.user.uid);
          // Redirect to dashboard
          navigate('/learn');
        } else {
          setError('Failed to create user in backend. Please try again.');
        }
      } catch (backendError) {
        console.error('Error creating user in backend:', backendError);
        setError('Failed to create user in backend. Please try again.');
      }
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
