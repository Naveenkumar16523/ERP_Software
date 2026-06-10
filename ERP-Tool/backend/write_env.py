#!/usr/bin/env python3
lines = [
    'DATABASE_URL=postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    'JWT_SECRET=supersecretkeythatmustbeatleast32characterslongforsecurity',
    'JWT_REFRESH_SECRET=anothersecretkeyforrefreshjwtthatmustalsobelongenough',
    'SECRET_KEY=your-secret-key-here-change-in-production',
    'REDIS_URL=redis://localhost:6379',
    'MONGODB_URL=mongodb://localhost:27017',
    'NODE_ENV=development',
    'CORS_ORIGINS=http://localhost:3000,http://localhost:5173'
]
with open('.env', 'w') as f:
    f.write('\n'.join(lines))
print('.env file created successfully')
