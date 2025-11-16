# UH Pathfinder AI

**UH Pathfinder AI** is a web application built to help students navigate the many educational pathways across the 10 UH campuses. This project was created for the **Hawaii Annual Code Challenge 2025**.

---

## Problem Statement

UH Pathfinder AI aims to help students by:

- Collecting user inputs
- Running them through AI to provide tailored recommendations
- Presenting these recommendations in an interactive, easy-to-understand way

---

## Tech Stack

- **Frontend:** React + TypeScript  
- **Backend:** Python FastAPI
- **AI / API:** Gemini API  
- **Hosting / Deployment:** 

---

## Getting Started

### Prerequisites

- Node.js & npm (or yarn)  
- Python 3.x  
- (Optional) virtual environment (virtualenv or venv)  

### Installation

1. Clone the repository:

```bash
git clone <REPO_URL>
cd <REPO_FOLDER>
````

2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd ../backend
pip install -r requirements.txt
```

---

## Running the App

**Frontend**:

```bash
npm run dev
```

**Backend** (example with FastAPI):

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Then open the local host to view the app.

---

## Configuration

Create a `.env` file in your backend folder and add:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

You must create a GEMINI API Key. If you want to use our API key, contact [@hawaii-nc](https://github.com/hawaii-nc) for more info.
---

## How It Works

1. **User Input:** The user answers a series of questions like your skills, interests, etc.
2. **AI Processing:** These inputs are fed into the Gemini API to generate a educational pathway.
3. **Recommendations:** The app returns a ranked list of things like their best majors, campuses, and the pathway of it.
4. **Visualization:** A pathway UI is used to help the user see their potential journey clearly. The app is very easy and interactable for the user to go through. There are custom campus pages for each user to see the campuses most suitable.

---

## UH Campuses Covered

This app supports all **10 UH campuses** in the University of Hawaiʻi System

* UH Mānoa
* UH Hilo
* UH West Oʻahu
* Hawaiʻi Community College
* Honolulu Community College
* Kapiʻolani Community College
* Kauaʻi Community College
* Leeward Community College
* UH Maui College
* Windward Community College

---

## 📄 License

This project is open-sourced under the **MIT License**.

---

## Release: 
