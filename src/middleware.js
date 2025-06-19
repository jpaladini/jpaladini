import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabaseClient'; // Using supabase client directly for session check

// Define public paths that do not require authentication
const PUBLIC_PATHS = ['/', '/login', '/api/auth/callback', '/auth/callback']; // '/' is our login page

// Define the main dashboard/app path after login
const DASHBOARD_PATH = '/dashboard';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const currentPath = url.pathname;

  // Allow requests to public paths
  if (PUBLIC_PATHS.some(path => currentPath.startsWith(path))) {
    // If user is already logged in and tries to access login page, redirect to dashboard
    if (currentPath === '/' || currentPath === '/login') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return redirect(DASHBOARD_PATH, 307); // 307 Temporary Redirect
      }
    }
    return next();
  }

  // For all other paths, check for an active session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session in middleware:', error.message);
    // Optionally redirect to an error page or login with an error message
    return redirect('/?error=session_error', 307);
  }

  if (!session) {
    // No active session, redirect to the login page with a return_to parameter
    const loginUrl = new URL('/', url.origin);
    loginUrl.searchParams.set('unauthorized', 'true');
    // loginUrl.searchParams.set('return_to', currentPath); // Optional: redirect back after login
    return redirect(loginUrl.toString(), 307);
  }

  // User is authenticated, proceed to the requested page
  // You can pass user information to pages via locals if needed
  context.locals.user = session.user;
  context.locals.session = session;
  
  return next();
});
