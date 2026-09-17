

https://github.com/user-attachments/assets/f4ed0c33-aba9-4fa8-991d-9faaf4859149



# DailyAid - AI-Powered Elderly Care Platform

DailyAid is a comprehensive solution designed to simplify elderly care with medication tracking, daily routine management, and an AI-powered health assistant.

This guide will help you set up and run the project in your local development environment.

## Project Structure

The project consists of 3 main components:
1. **`/web`**: User interface built with Next.js (Frontend).
2. **`/backend`**: Backend built with .NET 8 ASP.NET Core Web API.
3. **`/nlp-service`**: AI and Chatbot service built with Python FastAPI.

---

## Key Features & Architecture
- **Local Generative AI**: The NLP service runs a completely local, privacy-first generative LLM (Phi-3-mini) using `llama-cpp-python`.
- **Chat Context & Memory**: The .NET Backend maintains conversation history in the database and provides it to the NLP service to ensure the AI remembers past interactions.
- **Real-Time Emergency Alerts**: The AI dynamically detects critical health issues and returns an `is_critical` flag. The .NET Backend captures this and triggers a real-time SignalR WebSocket broadcast to instantly alert the caregiver.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
- **Node.js** (v18 or higher)
- **.NET 8.0 SDK** (or higher depending on your system. Make sure to check your system's required version.)
- **Python** (v3.8 or higher)

---

## Step-by-Step Installation & Run Guide

You will need to open 3 separate terminal windows to run all services concurrently.

### 1. NLP Service (AI Assistant)
This service handles the AI chat and sentiment analysis. *Note: The first run will download the Phi-3 model (~2.4 GB).*

1. Open a terminal and navigate to the `nlp-service` directory:
   ```bash
   cd nlp-service
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies (optimized for CPU):
   ```bash
   pip install -r requirements.txt --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
   ```
4. Download the LLM model:
   ```bash
   python download_model.py
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --port 8000
   ```
   *The NLP service will be running at `http://localhost:8000`.*

### 2. .NET Backend API
This is the core server handling data, authentication, and SignalR real-time notifications.

1. Open a new terminal and navigate to the backend API directory:
   ```bash
   cd backend/DailyAid.API
   ```
2. Restore NuGet packages and run the application:
   ```bash
   dotnet restore
   dotnet run
   ```
   *The Backend API will be running at `http://localhost:5116`.* (The SQLite database will be automatically created/used).

### 3. Next.js Frontend
This is the web application interface for both Elderly and Caregiver users.

1. Open a new terminal and navigate to the web directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The Frontend will be running at `http://localhost:3000`.*

---

## Accessing the Application
Once all three services are running successfully, open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

## Common Issues
- **Port Conflicts**: Ensure ports `3000`, `5116`, and `8000` are not being used by other applications.
- **Python Execution Error (Windows)**: If you get a policy error when running `.\venv\Scripts\activate`, open PowerShell as Administrator and run `Set-ExecutionPolicy Unrestricted -Scope CurrentUser`, then try again.

## Authors
- **Emre Gür**
- **Ergun Kaan Artan**
