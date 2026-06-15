from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String

Base = declarative_base()

class DummyMeta(type(Base)):
    def __getattr__(cls, name):
        if name.startswith("_"):
            raise AttributeError(name)
        col = Column(String)
        setattr(cls, name, col)
        return col

def __getattr__(name):
    if name == "DummyMeta":
        raise AttributeError(name)
    print(f"Dynamically generating model {name}")
    new_class = DummyMeta(name, (Base,), {"__tablename__": name, "id": Column(String, primary_key=True)})
    globals()[name] = new_class
    return new_class

if __name__ == "__main__":
    Emp = __getattr__("Employee")
    print(Emp.isActive)
    print(Emp.__tablename__)
