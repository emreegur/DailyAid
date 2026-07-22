import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import our customized chatbot logic
from chatbot import get_response

app = FastAPI(title="DailyAid NLP Service")

# CORS Settings (since the frontend makes requests directly if proxy is not used, 
# though we use a proxy via .NET, we still enable CORS explicitly for safety)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import List, Dict, Optional

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    reply: str
    sentiment: str
    is_critical: bool

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # Call the generative LLM logic from chatbot.py
    result = get_response(user_input=request.message, history=request.history, user_name="friend")
    
    return ChatResponse(
        reply=result.get("reply", "I understand."),
        sentiment=result.get("sentiment", "NEUTRAL"),
        is_critical=result.get("is_critical", False)
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "Local LLM (llama-cpp-python)"}
