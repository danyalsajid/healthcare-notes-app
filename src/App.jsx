import { Show, createEffect, createSignal, onMount } from 'solid-js';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import AuthContainer from './components/AuthContainer';
import SearchBar from './components/SearchBar';
import TagFilter from './components/TagFilter';
import { selectedItem, selectedType, loadData, loading, error } from './store';
import { isAuthenticated, user, logout } from './auth';

const [isMobile, setIsMobile] = createSignal(false);

// Load initial data when authenticated
createEffect(() => {
  if (isAuthenticated()) {
    loadData().catch(error => {
      console.error('Failed to load data:', error);
    });
  }
});

onMount(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
});

function App() {
  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    const currentUser = user();
    if (!currentUser?.name) return 'U';
    return currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase(); // e.g., "John Doe" -> "JD"
  };

  return (
    <Show 
      when={isAuthenticated()} 
      fallback={<AuthContainer />}
    >
      <div class="app-layout">
        <Sidebar />
        <div class="main-content">
          <div class="header">
             {/* {isMobile() ? 'mobile-sidebar' : 'desktop-sidebar'} */}
            <div class="d-flex align-items-center gap-4">
              <div>
                <h1>Healthcare Notes</h1>
                <p class="text-gray-600 mb-0">Organize notes across your healthcare hierarchy</p>
              </div>
              <div class={`${isMobile() ? 'w-100' : 'flex-grow-1'}`}>
                <SearchBar />
              </div>
            </div>
            <div class="header-user">
              <div class="user-info">
                <div class="user-avatar">
                  {getUserInitials()}
                </div>
                <div>
                  <div style="font-weight: 500;">{user()?.name}</div>
                  <div style="font-size: 0.75rem; color: #9ca3af;">{user()?.role}</div>
                </div>
              </div>
              <button class="logout-btn" onClick={handleLogout}>
                <i class="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
          
          <div class="mb-3">
            <TagFilter />
          </div>
          <Show when={loading()}>
            <div class="text-sm text-gray-500">Loading...</div>
          </Show>
          <Show when={error()}>
            <div class="text-sm" style="color: #dc2626;">Error: {error()}</div>
          </Show>
          <Show 
            when={selectedItem() && selectedType()} 
            fallback={
              <div class="card">
                <h2 class="card-title">Welcome to Healthcare Notes</h2>
                <p class="text-gray-600">
                  Select an item from the sidebar to view and manage notes. You can attach notes 
                  at any level of your organization hierarchy.
                </p>
                <Show when={loading()}>
                  <p class="text-sm text-gray-500 mt-2">Loading data from server...</p>
                </Show>
              </div>
            }
          >
            <MainContent />
          </Show>
        </div>
      </div>
    </Show>
  );
}

export default App;
