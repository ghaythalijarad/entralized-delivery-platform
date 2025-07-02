# Mock database for development/testing
# This module provides a mock Firestore-like interface for development

class MockCollection:
    def __init__(self):
        self.data = {}
        self.counter = 0
    
    def add(self, document):
        doc_id = f"doc_{self.counter}"
        self.counter += 1
        self.data[doc_id] = document
        # Return tuple for compatibility with collection interface
        class MockDocRef:
            def __init__(self, doc_id):
                self.id = doc_id
        return (None, MockDocRef(doc_id))
    
    def document(self, doc_id):
        class MockDoc:
            def __init__(self, doc_id, data):
                self.id = doc_id
                self._data = data
                self.exists = doc_id in data
            
            def get(self):
                return self
            
            def to_dict(self):
                return self._data.get(self.id, {})
            
            def set(self, data, merge=False):
                if merge:
                    existing = self._data.get(self.id, {})
                    existing.update(data)
                    self._data[self.id] = existing
                else:
                    self._data[self.id] = data
            
            def delete(self):
                if self.id in self._data:
                    del self._data[self.id]
        
        return MockDoc(doc_id, self.data)
    
    def where(self, field, operator, value):
        # Simple mock where clause - returns self for chaining
        return self
    
    def stream(self):
        # Return mock documents
        class MockStreamDoc:
            def __init__(self, doc_id, data):
                self.id = doc_id
                self._data = data
            
            def to_dict(self):
                return self._data
        
        return [MockStreamDoc(doc_id, data) for doc_id, data in self.data.items()]

class MockFirestore:
    def __init__(self):
        self.collections = {
            "merchants": MockCollection(),
            "drivers": MockCollection(), 
            "customers": MockCollection(),
            "orders": MockCollection()
        }
    
    def collection(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection()
        return self.collections[name]

# Initialize mock database for development
print("🔧 Using mock database for development")
db = MockFirestore()