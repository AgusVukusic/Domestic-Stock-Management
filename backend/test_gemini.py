import os
import json
import urllib.request
from urllib.error import HTTPError

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    # Get it from .env
    try:
        with open(".env") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY"):
                    api_key = line.split("=")[1].strip()
    except:
        pass

print("Testing Gemini API...")
try:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        models = [m['name'] for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
        print("Available models:", models)
except HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.read()}")
except Exception as e:
    print(f"Error: {e}")
