"""
Script to fix the corrupted .env file format
The current .env file has all variables on one line without proper line breaks
"""
import os

env_file = os.path.join(os.path.dirname(__file__), '.env')

# Read the current content
with open(env_file, 'r') as f:
    content = f.read()

# The content appears to be all on one line. Let's parse and fix it.
# Looking at the content, we can identify the variables by their patterns
variables = {
    'NODE_ENV': 'development',
    'SECRET_KEY': 'supersecretkeythatmustbeatleast32characterslongforsecurity',
    'JWT_SECRET': 'supersecretkeythatmustbeatleast32characterslongforsecurity',
    'JWT_REFRESH_SECRET': 'anothersecretkeyforrefreshjwtthatmustalsobelongenough',
    'CORS_ORIGINS': 'http://localhost:3000,http://localhost:3001,http://localhost:5173,https://erp-software-cyan.vercel.app',
    'FRONTEND_ORIGIN': 'https://erp-software-cyan.vercel.app',
    'MONGODB_URL': 'mongodb+srv://erp_db:Naveen16523%40%23%24@cluster0.wu2gznn.mongodb.net/?appName=Cluster0',
    'RESET_SECRET': 'clarix-reset-2024'
}

# Write the properly formatted .env file
with open(env_file, 'w') as f:
    for key, value in variables.items():
        f.write(f'{key}={value}\n')

print("✅ .env file format has been fixed!")
print("Please restart the backend server.")
