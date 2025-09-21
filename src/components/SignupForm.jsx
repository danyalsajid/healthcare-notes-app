import { createSignal, Show } from 'solid-js';
import { signup, authLoading, authError } from '../auth';

function SignupForm(props) {
  const [formData, setFormData] = createSignal({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    role: 'clinician',
    adminPasscode: ''
  });
  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);
  const [validationErrors, setValidationErrors] = createSignal({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors()[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const data = formData();

    if (!data.username.trim()) {
      errors.username = 'Username is required';
    } else if (data.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!data.name.trim()) {
      errors.name = 'Full name is required';
    }

    // Admin passcode validation
    if (data.role === 'admin') {
      if (!data.adminPasscode.trim()) {
        errors.adminPasscode = 'Admin passcode is required for administrator accounts';
      } else if (data.adminPasscode !== '000000') {
        errors.adminPasscode = 'Invalid admin passcode';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const { confirmPassword, ...signupData } = formData();
      await signup(signupData);
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <div class="d-flex align-items-center justify-content-center min-vh-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="card shadow-lg" style="width: 100%; max-width: 450px; border-radius: 1rem;">
        <div class="card-body p-4">
          <div class="text-center mb-4">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" 
                 style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.5rem;">
              <i class="fas fa-user-plus"></i>
            </div>
            <h1 class="h3 fw-bold text-dark mb-2">Create Account</h1>
            <p class="text-muted small">Join Healthcare Notes to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-user me-2"></i>
                Username
              </label>
              <input
                type="text"
                class={`form-control ${validationErrors().username ? 'is-invalid' : ''}`}
                value={formData().username}
                onInput={(e) => updateField('username', e.target.value)}
                placeholder="Choose a username"
                disabled={authLoading()}
                required
              />
              {validationErrors().username && (
                <div class="invalid-feedback">{validationErrors().username}</div>
              )}
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-envelope me-2"></i>
                Email Address
              </label>
              <input
                type="email"
                class={`form-control ${validationErrors().email ? 'is-invalid' : ''}`}
                value={formData().email}
                onInput={(e) => updateField('email', e.target.value)}
                placeholder="Enter your email"
                disabled={authLoading()}
                required
              />
              {validationErrors().email && (
                <div class="invalid-feedback">{validationErrors().email}</div>
              )}
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-id-card me-2"></i>
                Full Name
              </label>
              <input
                type="text"
                class={`form-control ${validationErrors().name ? 'is-invalid' : ''}`}
                value={formData().name}
                onInput={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                disabled={authLoading()}
                required
              />
              {validationErrors().name && (
                <div class="invalid-feedback">{validationErrors().name}</div>
              )}
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-user-tag me-2"></i>
                Role
              </label>
              <select
                class="form-select"
                value={formData().role}
                onInput={(e) => updateField('role', e.target.value)}
                disabled={authLoading()}
              >
                <option value="clinician">Clinician</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <Show when={formData().role === 'admin'}>
              <div class="mb-3">
                <label class="form-label fw-medium text-dark">
                  <i class="fas fa-key me-2"></i>
                  Admin Passcode
                </label>
                <input
                  type="password"
                  class={`form-control ${validationErrors().adminPasscode ? 'is-invalid' : ''}`}
                  value={formData().adminPasscode}
                  onInput={(e) => updateField('adminPasscode', e.target.value)}
                  placeholder="Enter admin passcode"
                  disabled={authLoading()}
                />
                {validationErrors().adminPasscode && (
                  <div class="invalid-feedback">{validationErrors().adminPasscode}</div>
                )}
                <div class="form-text text-muted">
                  <i class="fas fa-info-circle me-1"></i>
                  Admin accounts require a special passcode from your approved email. For demo purposes, use: <strong>000000</strong>
                </div>
              </div>
            </Show>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-lock me-2"></i>
                Password
              </label>
              <div class="input-group">
                <input
                  type={showPassword() ? 'text' : 'password'}
                  class={`form-control ${validationErrors().password ? 'is-invalid' : ''}`}
                  value={formData().password}
                  onInput={(e) => updateField('password', e.target.value)}
                  placeholder="Create a password"
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
              {validationErrors().password && (
                <div class="invalid-feedback d-block">{validationErrors().password}</div>
              )}
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">
                <i class="fas fa-lock me-2"></i>
                Confirm Password
              </label>
              <div class="input-group">
                <input
                  type={showConfirmPassword() ? 'text' : 'password'}
                  class={`form-control ${validationErrors().confirmPassword ? 'is-invalid' : ''}`}
                  value={formData().confirmPassword}
                  onInput={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  disabled={authLoading()}
                  required
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary border"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword())}
                  disabled={authLoading()}
                >
                  <i class={showConfirmPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
              {validationErrors().confirmPassword && (
                <div class="invalid-feedback d-block">{validationErrors().confirmPassword}</div>
              )}
            </div>

            {authError() && (
              <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                <div>{authError()}</div>
              </div>
            )}

            <button
              type="submit"
              class="btn btn-primary w-100 py-2 fw-medium d-flex align-items-center justify-content-center"
              disabled={authLoading()}
            >
              {authLoading() ? (
                <>
                  <i class="fas fa-spinner fa-spin me-2"></i>
                  Creating Account...
                </>
              ) : (
                <>
                  <i class="fas fa-user-plus me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div class="mt-4 pt-3 border-top text-center">
            <p class="text-muted small mb-2">Already have an account?</p>
            <button
              type="button"
              class="btn btn-link p-0 fw-semibold"
              onClick={() => props.onSwitchToLogin()}
              disabled={authLoading()}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
