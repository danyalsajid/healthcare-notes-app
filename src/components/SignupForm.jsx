import { createSignal } from 'solid-js';
import { signup, authLoading, authError } from '../auth';

function SignupForm(props) {
  const [formData, setFormData] = createSignal({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    role: 'user'
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
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">
            <i class="fas fa-user-plus"></i>
          </div>
          <h1>Create Account</h1>
          <p>Join Healthcare Notes to get started</p>
        </div>

        <form onSubmit={handleSubmit} class="login-form">
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-user"></i>
              Username
            </label>
            <input
              type="text"
              class={`form-input ${validationErrors().username ? 'error' : ''}`}
              value={formData().username}
              onInput={(e) => updateField('username', e.target.value)}
              placeholder="Choose a username"
              disabled={authLoading()}
              required
            />
            {validationErrors().username && (
              <div class="field-error">{validationErrors().username}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-envelope"></i>
              Email Address
            </label>
            <input
              type="email"
              class={`form-input ${validationErrors().email ? 'error' : ''}`}
              value={formData().email}
              onInput={(e) => updateField('email', e.target.value)}
              placeholder="Enter your email"
              disabled={authLoading()}
              required
            />
            {validationErrors().email && (
              <div class="field-error">{validationErrors().email}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-id-card"></i>
              Full Name
            </label>
            <input
              type="text"
              class={`form-input ${validationErrors().name ? 'error' : ''}`}
              value={formData().name}
              onInput={(e) => updateField('name', e.target.value)}
              placeholder="Enter your full name"
              disabled={authLoading()}
              required
            />
            {validationErrors().name && (
              <div class="field-error">{validationErrors().name}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-user-tag"></i>
              Role
            </label>
            <select
              class="form-input"
              value={formData().role}
              onInput={(e) => updateField('role', e.target.value)}
              disabled={authLoading()}
            >
              <option value="user">General User</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i>
              Password
            </label>
            <div class="password-input-container">
              <input
                type={showPassword() ? 'text' : 'password'}
                class={`form-input ${validationErrors().password ? 'error' : ''}`}
                value={formData().password}
                onInput={(e) => updateField('password', e.target.value)}
                placeholder="Create a password"
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
            {validationErrors().password && (
              <div class="field-error">{validationErrors().password}</div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i>
              Confirm Password
            </label>
            <div class="password-input-container">
              <input
                type={showConfirmPassword() ? 'text' : 'password'}
                class={`form-input ${validationErrors().confirmPassword ? 'error' : ''}`}
                value={formData().confirmPassword}
                onInput={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                disabled={authLoading()}
                required
              />
              <button
                type="button"
                class="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword())}
                disabled={authLoading()}
              >
                <i class={showConfirmPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
            {validationErrors().confirmPassword && (
              <div class="field-error">{validationErrors().confirmPassword}</div>
            )}
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
            disabled={authLoading()}
          >
            {authLoading() ? (
              <>
                <i class="fas fa-spinner fa-spin"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i class="fas fa-user-plus"></i>
                Create Account
              </>
            )}
          </button>
        </form>

        <div class="login-footer">
          <div class="auth-switch">
            <p>Already have an account?</p>
            <button
              type="button"
              class="link-button"
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
