@echo off
echo Installing with Python 3.11...
py -3.11 -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
cd backend
pip install -r requirements_simple.txt
echo.
echo Setup complete! Run: uvicorn main:app --reload
pause
