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
    <div class="d-flex align-items-center justify-content-center min-vh-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="card shadow-lg" style="width: 100%; max-width: 400px; border-radius: 1rem;">
        <div class="card-body p-4">
          <div class="text-center mb-4">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" 
                 style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.5rem;">
              <i class="fas fa-user-md"></i>
            </div>
            <h1 class="h3 fw-bold text-dark mb-2">Healthcare Notes</h1>
            <p class="text-muted small">Please sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-user me-2"></i>
                Username
              </label>
              <input
                type="text"
                class="form-control"
                value={username()}
                onInput={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={authLoading()}
                required
              />
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-lock me-2"></i>
                Password
              </label>
              <div class="input-group">
                <input
                  type={showPassword() ? 'text' : 'password'}
                  class="form-control"
                  value={password()}
                  onInput={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={authLoading()}
                  required
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary border"
                  onClick={() => setShowPassword(!showPassword())}
                  disabled={authLoading()}
                >
                  <i class={showPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            {authError() && (
              <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                <div>{authError()}</div>
              </div>
            )}

            <button
              type="submit"
              class="btn btn-primary w-50 py-2 fw-medium d-block mx-auto" 
              disabled={authLoading() || !username().trim() || !password().trim()}
            >
              {authLoading() ? (
                <>
                  <i class="fas fa-spinner fa-spin me-2"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i class="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </>
              )}
            </button>

          </form>

          <div class="mt-4 pt-3 border-top">
            <div class="text-center mb-3">
              <p class="text-muted small mb-2">Don't have an account?</p>
              <button
                type="button"
                class="btn btn-link p-0 fw-semibold"
                onClick={() => props.onSwitchToSignup()}
                disabled={authLoading()}
              >
                Create Account
              </button>
            </div>
            
            <div class="text-center">
              <h6 class="text-dark fw-semibold mb-2 small">Demo Credentials:</h6>
              <div class="small text-muted">
                <div class="mb-1">
                  <strong class="text-dark">Admin:</strong> admin / Test@123
                </div>
                <div>
                  <strong class="text-dark">Clinician:</strong> clinician / Test@123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
