import { createSignal } from 'solid-js';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

function AuthContainer() {
  const [isSignup, setIsSignup] = createSignal(false);

  const switchToSignup = () => setIsSignup(true);
  const switchToLogin = () => setIsSignup(false);

  return (
    <>
      {isSignup() ? (
        <SignupForm onSwitchToLogin={switchToLogin} />
      ) : (
        <LoginForm onSwitchToSignup={switchToSignup} />
      )}
    </>
  );
}

export default AuthContainer;
