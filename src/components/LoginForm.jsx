import { createSignal } from 'solid-js';
import { login, authLoading, authError } from '../auth';

function LoginForm(props) {
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [showPassword, setShowPassword] = createSignal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username().trim() || !password().trim()) {
      return;
    }
    
    try {
      await login(username().trim(), password());
    } catch (error) {
      // Error is handled by the auth store
      console.error('Login failed:', error);
    }
  };


  return (
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">
            <i class="fas fa-user-md"></i>
          </div>
          <h1>Healthcare Notes</h1>
          <p>Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} class="login-form">
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-user"></i>
              Username
            </label>
            <input
              type="text"
              class="form-input"
              value={username()}
              onInput={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={authLoading()}
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i>
              Password
            </label>
            <div class="password-input-container">
              <input
                type={showPassword() ? 'text' : 'password'}
                class="form-input"
                value={password()}
                onInput={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={authLoading()}
                required
              />
              <button
                type="button"
                class="password-toggle"
                onClick={() => setShowPassword(!showPassword())}
                disabled={authLoading()}
              >
                <i class={showPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
          </div>

          {authError() && (
            <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {authError()}
            </div>
          )}

          <button
            type="submit"
            class="btn btn-primary btn-full"
            disabled={authLoading() || !username().trim() || !password().trim()}
          >
            {authLoading() ? (
              <>
                <i class="fas fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                <i class="fas fa-sign-in-alt"></i>
                Sign In
              </>
            )}
          </button>

        </form>

        <div class="login-footer">
          <div class="auth-switch">
            <p>Don't have an account?</p>
            <button
              type="button"
              class="link-button"
              onClick={() => props.onSwitchToSignup()}
              disabled={authLoading()}
            >
              Create Account
            </button>
          </div>
          
          <div class="demo-credentials">
            <h4>Demo Credentials:</h4>
            <div class="credential-item">
              <strong>Admin:</strong> admin / password
            </div>
            <div class="credential-item">
              <strong>Doctor:</strong> doctor / password
            </div>
            <div class="credential-item">
              <strong>Nurse:</strong> nurse / password
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
