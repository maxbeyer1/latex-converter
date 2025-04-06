# 📄 getLa.TeCH

## 🚀 Elevator Pitch
**getLa.TeCH** is a web app that takes the chaos out of handwritten or typed math homework and turns it into beautiful, editable, and exportable LaTeX documents. Upload your notes, get clean LaTeX, preview in real-time, edit on the fly, and download polished PDFs — all in one place.

---

## 📚 About the Project
Tired of submitting messy scans or spending hours formatting math in LaTeX? We were too. That's why we built **getLa.TeCH** — an intelligent note-to-LaTeX converter tailored for students, researchers, and educators.

With a drag-and-drop interface, real-time rendering, and an interactive editor, getLa.TeCH simplifies the workflow from raw handwritten or typed math content to a clean LaTeX document. Whether you're preparing problem sets, study guides, or research notes, getLa.TeCH helps you save time and stay organized.

### 🌟 Features
- 🖼️ Upload handwritten or typed notes (PDF/image)
- 🔁 Gemini-powered LaTeX conversion
- 📝 LaTeX code editor with real-time preview
- 📤 Export to polished PDF format
- ✨ Intuitive UI with drag-and-drop file support

---

## 💻 Installation
### Prerequisites
- Python
- Node.js
- Google Generative AI API key, with billing enabled
- pdflatex installed on your system
    - For Windows, install MikTeX using Chocolatey or download from the official site
    - For Mac, install MacTeX using Homebrew or download from the official site
        - Do NOT use BasicTeX, it does not include many packages that our app expects
    - For Linux, install TeX Live using your package manager

### Setup

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Run the dev server (automatically installs backend dependencies):
   ```bash
   npm run dev
   ```
   This will start both the frontend and backend servers with hot reloading.

## 🛠️ Built With
### Frontend
- [Next.js](https://nextjs.org/) – React framework for SSR and frontend routing
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS styling
- [TypeScript](https://www.typescriptlang.org/) – Static typing for JS
- [React](https://reactjs.org/) – Component-based UI library
- [CodeMirror](https://codemirror.net/) – LaTeX code editor with syntax highlighting

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) – Python web framework for API endpoints
- [Python](https://www.python.org/) – Core backend language
- [Google Generative AI SDK](https://pypi.org/project/google-generativeai/) – Gemini Pro model for LaTeX generation
- [pdflatex](https://www.tug.org/applications/pdftex/) – Converts LaTeX to PDF on the fly

### Dev Tools
- [Postman](https://www.postman.com/) – API testing
- [WSL](https://learn.microsoft.com/en-us/windows/wsl/) – Linux environment on Windows
- [VS Code](https://code.visualstudio.com/) – Code editor of choice
- [concurrently](https://www.npmjs.com/package/concurrently) – Runs frontend and backend dev servers together

---

## 📹 Video Demo
🎥 [Watch the demo](https://your-demo-link-here.com)

---

## 🏁 Submission Track
**Productivity / Wellness**  
getLa.TeCH helps students and researchers stay productive by reducing the friction of note formatting and documentation.

---

## ✍️ Authors
- Max Beyer
- Caroline Guerra
- Ian Slater
- Emre Ersahin

---

## 📜 Credits
We used the following open-source tools and libraries in our project:
- **FastAPI**, **Uvicorn** – Web server and routing
- **Google Generative AI SDK** – PDF-to-LaTeX conversion using Gemini
- **pdflatex** – Local LaTeX-to-PDF compiler
- **Next.js** & **React** – Frontend framework
- **Tailwind CSS** – UI styling
- **concurrently** – Dev tool for managing multiple processes

All Gemini prompts and PDF parsing logic were written by us. The LaTeX editor, live preview integration, and PDF export logic were also fully implemented by our team.

---