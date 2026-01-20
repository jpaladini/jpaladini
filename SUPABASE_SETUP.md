# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for your portfolio website.

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - Project name: `jpaladini-portfolio` (or your preferred name)
   - Database password: Choose a strong password
   - Region: Select the closest region to your users
5. Click "Create new project"

## 2. Get Your API Credentials

1. Once your project is created, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public** key (under "Project API keys")

## 3. Configure Environment Variables

1. Open the `.env` file in the root of your project
2. Replace the placeholder values with your actual credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Enable Authentication Providers

### Email/Password Authentication
Email/password authentication is enabled by default.

### Magic Link (OTP)
Magic link authentication is enabled by default.

### GitHub OAuth

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find **GitHub** and click to configure
3. Go to [GitHub Developer Settings](https://github.com/settings/developers)
4. Click **New OAuth App**
5. Fill in the details:
   - Application name: `jpaladini.com`
   - Homepage URL: `https://jpaladini.com` (or your domain)
   - Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
6. Click **Register application**
7. Copy the **Client ID** and generate a **Client Secret**
8. Return to Supabase and paste these values
9. Enable the GitHub provider

### Google OAuth

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to configure
3. Go to [Google Cloud Console](https://console.cloud.google.com)
4. Create a new project or select an existing one
5. Enable the Google+ API
6. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
7. Configure the OAuth consent screen if prompted
8. Select **Web application** as the application type
9. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
10. Copy the **Client ID** and **Client Secret**
11. Return to Supabase and paste these values
12. Enable the Google provider

## 5. Configure Email Settings (Optional)

By default, Supabase uses their email service for testing. For production, you should configure your own SMTP settings:

1. Go to **Authentication** > **Email Templates**
2. Configure the following templates as needed:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

## 6. Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Try each authentication method:
   - Sign up with email/password
   - Sign in with email/password
   - Request a magic link
   - Sign in with GitHub
   - Sign in with Google

## 7. Deploy

When deploying your site, make sure to set the environment variables in your hosting platform:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### For Netlify:
1. Go to **Site settings** > **Environment variables**
2. Add both variables

### For Vercel:
1. Go to **Settings** > **Environment Variables**
2. Add both variables

## 8. Update Redirect URLs for Production

After deploying, update the OAuth callback URLs:

1. In your Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Add your production domain to **Site URL**
3. Add your production domain to **Redirect URLs**

For GitHub and Google OAuth:
- Update the callback URLs in GitHub/Google settings to use your production domain

## Troubleshooting

### Email confirmation not working
- Check your email spam folder
- Verify email templates are configured correctly
- For production, configure custom SMTP settings

### OAuth not redirecting correctly
- Verify callback URLs match exactly in both Supabase and the OAuth provider settings
- Ensure your site URL is configured correctly in Supabase

### Authentication state not persisting
- Check browser console for errors
- Verify environment variables are loaded correctly
- Clear browser cache and localStorage

## Security Notes

- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Use Row Level Security (RLS) in Supabase for any database tables you create
- Regularly rotate your API keys if they become exposed
- For production, consider rate limiting on authentication endpoints
