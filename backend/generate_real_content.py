import os
import django
import sys
from time import sleep

# Setup Django environment
sys.path.append('/Users/balbiryadav/Desktop/learn/DailyTaiyari/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dailytaiyari.settings')
django.setup()

from content.models import Content
from openai import OpenAI
from decouple import config

# Initialize OpenAI client
client = OpenAI(api_key=config('OPENAI_API_KEY'))

def generate_content(topic_name, content_type_suffix, subject_name):
    prompt = f"""
    Create highly accurate, comprehensive educational content for a student preparing for competitive exams (like JEE, NEET, or similar high-level exams).
    
    Topic: {topic_name}
    Subject: {subject_name}
    Content Type: {content_type_suffix}
    
    Guidelines:
    - If the content type is 'Complete Notes': Provide detailed notes, dividing them into logical sub-topics with clear headings. Explain core concepts thoroughly.
    - If the content type is 'Formula Sheet': List all relevant formulas clearly with their variables explained.
    - If the content type is 'Quick Revision': Provide a bulleted summary of the most important points to remember.
    - Use Markdown formatting.
    - Use LaTeX for math/physics/chemistry formulas. Use `$ ... $` for inline formulas and `$$ ... $$` for block formulas.
    - Ensure the content is entirely accurate, professional, and ready for students to consume. No placeholder text whatsoever.
    - Only output the markdown content, no conversational intro or outro.
    """
    
    print(f"Generating for: {topic_name} - {content_type_suffix}...")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Use a fast/cheap model for bulk generation
            messages=[
                {"role": "system", "content": "You are an expert educator producing high-quality study materials for competitive exams."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2, # Keep it factual and consistent
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating content: {e}")
        return None

def run():
    # Find all content items that have the placeholder text
    items_to_update = Content.objects.filter(
        content_html__icontains='Study material for this topic is being prepared.'
    )
    
    total = items_to_update.count()
    print(f"Found {total} items to update.")
    
    # Process all remaining items
    for i, item in enumerate(items_to_update):
        print(f"[{i+1}/{total}] Processing: {item.title}")
        
        topic_name = item.topic.name if item.topic_id else item.title.split(' - ')[0]
        subject_name = item.subject.name if item.subject_id else "General"
        
        # Determine the suffix from the title (e.g., "Complete Notes", etc.)
        suffix = "Complete Notes"
        if "Formula Sheet" in item.title:
            suffix = "Formula Sheet"
        elif "Quick Revision" in item.title:
            suffix = "Quick Revision"
        elif "Video Lecture" in item.title:
            # We don't generate video lecture text via AI usually, but we could provide a summary
            suffix = "Video Lecture Summary"
            
        generated_markdown = generate_content(topic_name, suffix, subject_name)
        
        if generated_markdown:
            item.content_html = generated_markdown
            item.save(update_fields=['content_html'])
            print(f"  -> Successfully updated.")
        else:
            print(f"  -> Failed to generate content.")
            
        # Sleep slightly to avoid hitting rate limits too hard if using a free tier
        sleep(1)
        
    print("\nBatch complete! Check the updated content.")

if __name__ == '__main__':
    run()
