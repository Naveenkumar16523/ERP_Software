from app.utils.db import SessionLocal
from app.models.models import ERPUser

db = SessionLocal()
users = db.query(ERPUser).all()

print('All Users:')
print('-' * 80)
for u in users:
    print(f'Username: {u.username}')
    print(f'Email: {u.email}')
    print(f'Full Name: {u.fullName}')
    print(f'Role ID: {u.roleId}')
    print(f'Is CEO: {u.isCEO}')
    print(f'Is Active: {u.isActive}')
    print('-' * 40)
