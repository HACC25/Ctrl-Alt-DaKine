import { useEffect, useRef, useState } from 'react';
import './SignIn.css';
import cloudImg from '../assets/cloud.png';

interface SignInProps {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // staged animation states: curtain -> sun -> fade
  const [isAnimating, setIsAnimating] = useState(false); // curtain started
  const [sunRising, setSunRising] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [loginFaded, setLoginFaded] = useState(false);
  const timersRef = useRef<number[]>([]);

  const handleSignIn = () => {
    // Fake login: check if username is "nathan" and password is "chong"
    if (username.toLowerCase() === 'nathan' && password === 'chong') {
      // Fade out the login box first
      const loginFadeMs = 600;
      setLoginFaded(true);

      // Durations (ms)
      const curtainMs = 3000; // curtain slides up
      const sunMs = 3000; // sun rises after curtain finishes
      const fadeMs = 1000; // final overlay fade out

      // Start curtain after login box has faded
      const t0 = window.setTimeout(() => {
        setIsAnimating(true);
      }, loginFadeMs);

      // When curtain finishes, start the sun rising
      const t1 = window.setTimeout(() => {
        setSunRising(true);
      }, loginFadeMs + curtainMs);

      // When sun finishes, start fading the overlay
      const t2 = window.setTimeout(() => {
        setIsFading(true);
      }, loginFadeMs + curtainMs + sunMs);

      // After final fade completes, call onSignIn
      const t3 = window.setTimeout(() => {
        onSignIn();
      }, loginFadeMs + curtainMs + sunMs + fadeMs);

      timersRef.current.push(t0, t1, t2, t3);
    } else {
      alert('Invalid credentials! Try username: nathan, password: chong');
    }
  };

  // clear timers if component unmounts early
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className={`signin-overlay ${isFading ? 'fade-out' : ''}`}>
      <div className="scene">
        {/* CLOUDS */}
        <div className={`clouds ${isAnimating ? 'slide-up' : ''}`}>
          <div className="cloud" style={{ backgroundImage: `url(${cloudImg})` }}></div>
          <div className="cloud" style={{ backgroundImage: `url(${cloudImg})` }}></div>
          <div className="cloud" style={{ backgroundImage: `url(${cloudImg})` }}></div>
          <div className="cloud" style={{ backgroundImage: `url(${cloudImg})` }}></div>
        </div>

        {/* SUN */}
    <div className={`sun ${sunRising ? 'rise' : ''}`}></div>

    {/* FOG - appears while the sun is rising */}
    <div className={`fog ${sunRising ? 'show' : ''}`}></div>

    {/* LOGIN BOX */}
  <div className={`login-container ${loginFaded ? 'login-fade-out' : ''}`}>
          <img 
            src="https://raw.githubusercontent.com/HACC25/Ctrl-Alt-DaKine/main/20251031_1054_Rainbow%20Path%20Logo_simple_compose_01k8y0rm8aeseaywdp9cx3g0aw.png" 
            alt="Logo" 
            className="logo"
          />

          {!isSignUp ? (
            <div className="auth-form">
              <h2>Sign In</h2>
              <input 
                type="text" 
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <button onClick={handleSignIn}>Sign In</button>
              <div className="toggle-text">
                Don't have an account? <span onClick={toggleForm}>Sign Up</span>
              </div>
            </div>
          ) : (
            <div className="auth-form">
              <h2>Sign Up</h2>
              <input type="text" placeholder="Full Name" />
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <button onClick={() => alert('Sign up is not implemented yet!')}>Create Account</button>
              <div className="toggle-text">
                Already have an account? <span onClick={toggleForm}>Sign In</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}