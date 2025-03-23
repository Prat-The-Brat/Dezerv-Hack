# Dezerv Hackathon Project

This project was built as part of the **Dezerv-Hackathon**. We developed **SmartInvest**, a gamified learning community fintech application that helps users learn about investing, practice, and compete with the community.

## Authors

- [@Pratham Bhonge](https://github.com/Prat-The-Brat)
- [@Aarohi Verma](https://github.com/aarohiverma)
- [@Syed Hamadan Ahmad](https://github.com/SyedHamadanAhmad)
- [@Pancy Single](https://github.com/pancysingla)
- [@Ujjwal Jajjoo](https://github.com/UJ911)

Special thanks to our mentor **Tauseef Perwez** from Dezerv.

## Prerequisites

- Python 3.x
- Node.js
- npm (Node Package Manager)

## Installation

### Backend Setup

#### 1. Django Backend (`Dezerv-backend`)

```bash
# Navigate to the Django project directory
cd Dezerv-backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Unix/macOS
# or
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver
```

The Django server will run on **http://127.0.0.1:8000/**

#### 2. WebSocket Server (`backend`)

```bash
# Navigate to the WebSocket server directory
cd backend

# Install dependencies
npm install

# Start the WebSocket server
npm start
```

The WebSocket server will run on **port 5001**.

#### 3. LLM API Server (`server.js`)

```bash
# From the project root directory
npm install
node server.js
```

The LLM API server will run on **port 3000**.

### Frontend Setup

```bash
# From the project root directory
npm install

# Start the development server
npm run dev
```

The frontend will run on **http://localhost:5173**

## Running All Components

1. Open four separate terminal windows.
2. In the first terminal, start the Django backend.
3. In the second terminal, start the WebSocket server.
4. In the third terminal, start the LLM API server.
5. In the fourth terminal, start the frontend development server.

## Environment Variables

Create a `.env` file in the project root and add the following:

```ini
GEMINI_API_KEY=your_gemini_api_key
```

## Project Structure

```
.
├── Dezerv-backend/     # Django backend
│   ├── requirements.txt
│   └── manage.py
├── backend/           # WebSocket server
│   ├── package.json
│   └── stockServer.js
├── server.js         # LLM API server
├── src/              # Frontend application
│   ├── components/
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Troubleshooting

- If you encounter **port conflicts**, ensure no other applications are using ports **8000, 5001, 3000, or 5173**.
- Ensure all **dependencies** are installed correctly for each component.
- When running the Django backend, ensure the **virtual environment is activated**.
- Verify that **environment variables** are properly set.
- If you see **CORS errors**, check that all backend servers are running and correctly configured.

## Development

- The frontend uses **Vite** for fast development and hot module replacement.
- The Django backend includes the **Django REST framework** for API endpoints.
- The WebSocket server handles **real-time stock data updates**.
- The LLM API server manages **language model interactions**.

**<h2 style="text-align:center;">made 💜 by mathGang</h2>** 



