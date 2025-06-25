from langchain_google_genai import ChatGoogleGenerativeAI  # Correct import for Gemini
from langchain_core.runnables import RunnableSequence
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import os

from langchain.prompts import PromptTemplate
import os

def build_feedback_agent():
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.7,
        google_api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
    )

    prompt = PromptTemplate(
        input_variables=["resume_text"],
        template="""
You are an expert hiring manager. Given the following resume, analyze it and 
provide feedback on the following:

1. A brief summary  
2. Key strengths  
3. Areas for improvement  
4. Recommended roles based on the candidate's profile  

Resume:
{resume_text}
"""
    )

    chain = prompt | llm  # RunnableSequence under the hood
    return chain
