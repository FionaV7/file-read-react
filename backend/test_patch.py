"""Test script: check how Python 3.14 stores annotations"""
import sys
print(f"Python: {sys.version}")

from typing import Optional

class MyClass:
    x: Optional[int] = None
    y: str = "hello"

# Check where annotations are stored
print("__annotations__:", getattr(MyClass, '__annotations__', 'NOT FOUND'))
print("__annotate__:", getattr(MyClass, '__annotate__', 'NOT FOUND'))

# In Python 3.14, test if __annotations__ still works as property
import typing
print("get_type_hints:", typing.get_type_hints(MyClass))

# Now test: what does the namespace dict look like during class creation?
class MetaTest(type):
    def __new__(mcs, name, bases, namespace):
        print(f"\n=== Creating class {name} ===")
        print(f"  __annotations__ in namespace: {'__annotations__' in namespace}")
        print(f"  __annotate__ in namespace: {'__annotate__' in namespace}")
        if '__annotate__' in namespace:
            ann_fn = namespace['__annotate__']
            print(f"  __annotate__ type: {type(ann_fn)}")
            try:
                result = ann_fn(1)  # FORMAT_VALUE
                print(f"  __annotate__(1) result: {result}")
            except Exception as e:
                print(f"  __annotate__(1) error: {e}")
        if '__annotations__' in namespace:
            print(f"  __annotations__: {namespace['__annotations__']}")
        return super().__new__(mcs, name, bases, namespace)

class TestClass(metaclass=MetaTest):
    field1: Optional[int] = None
    field2: str = "test"
