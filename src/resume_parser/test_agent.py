import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

def build_feedback_agent():
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
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

    # Runnable pipeline
    return prompt | llm


if __name__ == "__main__":
    dummy_resume = """
John Doe
Email: john.doe@email.com | Phone: (123) 456-7890
Software Engineer with 3 years of experience in full-stack web development.
Skilled in React, Node.js, and MongoDB.
Worked at TechCorp Inc. building scalable applications.
Looking for backend engineering roles.
    """

    agent = build_feedback_agent()
    result = agent.invoke({"resume_text": dummy_resume})
    print("\n🧠 FEEDBACK:\n")
    print(result)
