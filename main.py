from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pathlib import Path

app = FastAPI(title="Centralized Platform", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "fastapi-template/static"), name="static")

@app.get("/")
async def root():
    return RedirectResponse(url="/static/admin.html")

@app.get("/health")
async def health():
    return {"status": "ok"}
