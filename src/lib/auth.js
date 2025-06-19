import { supabase } from './supabaseClient';
import { writable } from 'svelte/store';

// Create a writable store for the auth state
// It will hold the user object, session, and a loading state
export const authStore = writable({
  user: null,
  session: null,
  loading: true,
  error: null
});

// Function to initialize authentication state and listen for changes
export const initAuth = async () => {
  try {
    // Attempt to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError.message);
      authStore.set({ user: null, session: null, loading: false, error: sessionError.message });
      return;
    }

    if (session) {
      authStore.set({ user: session.user, session: session, loading: false, error: null });
    } else {
      authStore.set({ user: null, session: null, loading: false, error: null });
    }
  } catch (e) {
    console.error('Exception in initAuth getSession:', e.message);
    authStore.set({ user: null, session: null, loading: false, error: e.message });
  }

  // Listen for changes in authentication state (login, logout, token refresh)
  supabase.auth.onAuthStateChange((event, session) => {
    authStore.set({ 
      user: session?.user ?? null, 
      session: session, 
      loading: false,
      error: null
    });
    
    // Handle specific events if needed
    // if (event === 'SIGNED_IN') console.log('User signed in:', session.user.email);
    // if (event === 'SIGNED_OUT') console.log('User signed out');
  });
};

// Helper function to check if the user is authenticated
// This is a reactive helper that can be used in Svelte components or Astro client scripts
export const isAuthenticated = () => {
  let authenticated = false;
  const unsubscribe = authStore.subscribe(value => {
    authenticated = !!value.user && !value.loading;
  });
  unsubscribe(); // Immediately unsubscribe as we only need the current value
  return authenticated;
};

// Call initAuth automatically when this module is imported on the client-side
// This ensures auth state is checked as soon as possible.
// Note: This will only run in a client-side context.
if (typeof window !== 'undefined') {
  initAuth();
}
