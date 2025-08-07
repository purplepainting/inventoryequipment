@echo off
echo Creating .env file for Supabase configuration...
echo.
echo Please enter your Supabase anon key:
set /p SUPABASE_KEY=

echo VITE_SUPABASE_URL=https://wzyzrmjalwfhspwfwjah.supabase.co > .env
echo VITE_SUPABASE_ANON_KEY=%SUPABASE_KEY% >> .env

echo.
echo .env file created successfully!
echo.
echo Next steps:
echo 1. Run the SQL schema in your Supabase dashboard
echo 2. Restart your development server: npm run dev
echo 3. Test the application at http://localhost:5173
pause 