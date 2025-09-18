# from openai import OpenAI
from app.core.config import settings

import os
import requests
from google import genai

client = genai.Client(
    api_key = settings.GEMINI_API_KEY
)
async def generate_summary(transcript: str) -> str:
    prompt = f"Generate a call summary for room: {transcript}."
    print("POOMPT=====>", prompt)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        print("=>>>>>RES", response)

        return response.text
        # return transcript
    except Exception as err:
        print("ERR===> summarize:", err)
        return "Summary generation failed. Please try again."


