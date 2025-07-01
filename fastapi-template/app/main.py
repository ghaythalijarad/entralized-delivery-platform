from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from app.db import db
from app.schemas import Merchant, Driver, Customer, Order

app = FastAPI()

# serve all files in ../static as the root SPA
app.mount(
    "/", 
    StaticFiles(directory="../static", html=True),
    name="static"
)

def to_dict(doc):
    data = doc.to_dict()
    data["id"] = doc.id
    return data

# -- Merchants CRUD --
@app.post("/merchants", response_model=Merchant)
async def create_merchant(m: Merchant):
    ref = db.collection("merchants").add(m.dict(exclude={"id"}))
    m.id = ref[1].id
    return m

@app.get("/merchants/{mid}", response_model=Merchant)
async def get_merchant(mid: str):
    doc = db.collection("merchants").document(mid).get()
    if not doc.exists:
        raise HTTPException(404, "Merchant not found")
    return to_dict(doc)

@app.put("/merchants/{mid}", response_model=Merchant)
async def update_merchant(mid: str, m: Merchant):
    db.collection("merchants").document(mid).set(m.dict(exclude={"id"}), merge=True)
    m.id = mid
    return m

@app.delete("/merchants/{mid}")
async def delete_merchant(mid: str):
    db.collection("merchants").document(mid).delete()
    return {"deleted": True}

# -- Similar Drivers, Customers, Orders --
# ...CRUD for drivers, customers, orders with same pattern...
