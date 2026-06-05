#!/usr/bin/env python3
lines = [
    'DATABASE_URL=mysql+pymysql://4SzBPjMpGha8uCz.root:PhLJKe4vCVloVnfK@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/erp_db',
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
