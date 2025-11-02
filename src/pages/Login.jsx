import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- START CHANGES ---
    if (email.trim() === '') {
      alert('Please enter an email.');
      return;
    }

    // Simulate a user
    const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const initial = name.charAt(0).toUpperCase() || 'A';

    const fakeUser = {
      email: email,
      name: name,
      initial: initial,
    };

    // Store this "session"
    localStorage.setItem('drive-user', JSON.stringify(fakeUser));
    // --- END CHANGES ---

    // Accept any credentials and redirect to dashboard
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-8">
        {/* Card Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-10 py-12">
          {/* Google Logo */}
          <div className="flex justify-center mb-6">
            <svg className="w-20 h-20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          </div>

          {/* Sign in title */}
          <h1 className="text-center text-2xl font-normal text-gray-800 mb-2">
            Sign in
          </h1>
          <p className="text-center text-sm text-gray-600 mb-6">
            to continue to Drive
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or phone"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Forgot password link */}
          <div>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </a>
          </div>

          {/* Guest mode info */}
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
            <p className="text-sm text-gray-700">
              Not your computer? Use Guest mode to sign in privately.
            </p>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Learn more
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded hover:bg-blue-50 transition-colors"
            >
              Create account
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </form>
        </div>

        {/* Language selector */}
        <div className="mt-8 flex justify-center">
          <select className="text-xs text-gray-600 bg-transparent border-none cursor-pointer">
            <option>English (United States)</option>
            <option>Español</option>
            <option>Français</option>
            <option>Deutsch</option>
          </select>
        </div>

        {/* Footer links */}
        <div className="mt-6 flex justify-center gap-6 text-xs text-gray-600">
          <a href="#" className="hover:text-gray-800">Help</a>
          <a href="#" className="hover:text-gray-800">Privacy</a>
          <a href="#" className="hover:text-gray-800">Terms</a>
        </div>
      </div>
    </div>
  );
}

export default Login;