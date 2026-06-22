import os
import re
import json
import urllib.request
from collections import Counter
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from core.response import api_success, api_error

# English stop words list for heuristic parsing
STOP_WORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
    'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
    'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
    'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
}

def clean_and_tokenize(text):
    words = re.findall(r'\b\w+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]

def extract_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 5]

def get_keywords(text, num_keywords=5):
    words = clean_and_tokenize(text)
    if not words:
        return []
    counter = Counter(words)
    return [item[0] for item in counter.most_common(num_keywords)]

def heuristic_summarize(text, format_type='bullet-points'):
    sentences = extract_sentences(text)
    
    if not sentences:
        clean_words = clean_and_tokenize(text)
        topic = clean_words[0].capitalize() if clean_words else text.strip().capitalize()
        if not topic:
            topic = "General Subject"
            
        # Check if the input is extremely short (e.g. just a keyword/topic)
        if len(text.strip().split()) < 15:
            return (
                f"# AI Summary Offline Fallback: {topic}\n\n"
                f"> **Note**: You entered a short keyword/topic: \"{text}\".\n\n"
                f"The application is currently running in **local fallback mode** because no Gemini API Key is configured.\n"
                f"In local fallback mode, the summarizer can only analyze and extract key sentences from a long lecture transcript and cannot generate summaries from a keyword alone.\n\n"
                f"### How to enable Gemini AI Summarization:\n"
                f"1. Get a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/).\n"
                f"2. Add it to your backend `.env` file:\n"
                f"   ```env\n"
                f"   GEMINI_API_KEY=your_api_key_here\n"
                f"   ```\n"
                f"3. Restart the backend server."
            )
            
        if format_type == 'detailed':
            return f"# Detailed Lecture Summary: {topic}\n\nThe lecture introduces and emphasizes the core concept of **{topic}**.\n\n* Key Concept: {text}\n* Discussion: Detailed content for this topic should be expanded in the lecture transcript."
        elif format_type == 'checklist':
            return f"# Study Guide Checklist: {topic}\n\nVerify your understanding of this topic:\n\n- [ ] **Core Concept**: Understand the definition and significance of **{topic}**.\n- [ ] **Applications**: Research and list primary applications of this topic."
        else:
            return f"# Key Lecture Points: {topic}\n\n* **Primary Subject**: Focuses on **{topic}**.\n* **Reference**: Input content: \"{text}\""
            
    words = clean_and_tokenize(text)
    word_freq = Counter(words)
    max_freq = max(word_freq.values()) if word_freq else 1
    
    word_weights = {w: freq / max_freq for w, freq in word_freq.items()}
    
    sentence_scores = []
    for s in sentences:
        s_words = clean_and_tokenize(s)
        score = sum(word_weights.get(w, 0) for w in s_words)
        if len(s_words) > 0:
            score = score / (len(s_words) ** 0.5)
        sentence_scores.append((s, score))
        
    sentence_scores.sort(key=lambda x: x[1], reverse=True)
    keywords = get_keywords(text, 4)
    keyword_str = ", ".join(f"**{kw.capitalize()}**" for kw in keywords) if keywords else "the main lecture topics"
    
    if format_type == 'detailed':
        top_sentences = sentence_scores[:3]
        top_sentences.sort(key=lambda x: sentences.index(x[0]))
        summary_paragraphs = "\n\n".join(s[0] for s in top_sentences)
        
        summary = (
            f"# Detailed Lecture Summary\n\n"
            f"### Overview\n"
            f"This lecture covers key discussions surrounding {keyword_str}. "
            f"Here is a structured narrative breakdown of the main concepts:\n\n"
            f"{summary_paragraphs}\n\n"
            f"### Conclusion\n"
            f"In summary, understanding these key segments is vital for mastering this lecture's core learning outcomes."
        )
    elif format_type == 'checklist':
        top_sentences = sentence_scores[:4]
        checklist_items = []
        
        if keywords:
            checklist_items.append(f"- [ ] **Fundamental Concepts**: Can you explain the main idea of **{keywords[0].capitalize()}**?")
        else:
            checklist_items.append(f"- [ ] **Fundamental Concepts**: Understand the primary terms introduced in the lecture.")
            
        for idx, (s, score) in enumerate(top_sentences[:3]):
            excerpt = s[:60] + "..." if len(s) > 60 else s
            checklist_items.append(f"- [ ] **Key Segment {idx+1}**: Review the context around: \"{excerpt}\"")
            
        checklist_items.append("- [ ] **Practical Application**: Identify how these concepts apply to practice problems or assignments.")
        
        checklist_items_str = "\n".join(checklist_items)
        summary = (
            f"# Study Guide Checklist\n\n"
            f"Verify your understanding of these core topics discussed in the lecture:\n\n"
            f"{checklist_items_str}"
        )
    else: # bullet-points
        top_sentences = sentence_scores[:4]
        top_sentences.sort(key=lambda x: sentences.index(x[0]))
        
        bullets = []
        for idx, (s, score) in enumerate(top_sentences):
            bullets.append(f"* **Key Point {idx+1}**: {s}")
            
        bullets_str = "\n".join(bullets)
        summary = (
            f"# Key Lecture Takeaways\n\n"
            f"Here are the high-level points extracted from the transcript:\n\n"
            f"{bullets_str}"
        )
        
    return summary

def call_gemini_api(prompt):
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            text_out = res_data['candidates'][0]['content']['parts'][0]['text']
            return text_out
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

def generate_summary(text, format_type):
    prompt_templates = {
        'detailed': f"Please generate a detailed, structured narrative lecture summary in markdown format from the following transcript. Keep the output clean and professional. Transcript:\n\n{text}",
        'checklist': f"Please generate a study guide checklist in markdown format with '- [ ]' checkboxes from the following lecture transcript. Keep the items relevant to the text content. Transcript:\n\n{text}",
        'bullet-points': f"Please generate a clean bullet-point summary of the key takeaways from the following lecture transcript. Use markdown bullet points. Transcript:\n\n{text}"
    }
    
    prompt = prompt_templates.get(format_type, prompt_templates['bullet-points'])
    
    gemini_summary = call_gemini_api(prompt)
    if gemini_summary:
        return gemini_summary
        
    return heuristic_summarize(text, format_type)

class AILectureSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()
        format_type = request.data.get('format', 'bullet-points')

        if not text:
            return api_error("Text content is required.", status=400)

        summary = generate_summary(text, format_type)
        return api_success(data={"summary": summary}, message="AI lecture summary generated successfully.")


class AILectureSummaryFileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        format_type = request.data.get('format', 'bullet-points')

        if not file_obj:
            return api_error("Transcript file is required.", status=400)

        try:
            content = file_obj.read().decode('utf-8', errors='ignore')[:50000]
        except Exception:
            content = "[Binary/Unreadable File Content]"

        prompt_templates = {
            'detailed': f"Please generate a detailed structured document analysis in markdown format for the file '{file_obj.name}' using this content:\n\n{content}",
            'checklist': f"Please generate a study guide checklist in markdown format with '- [ ]' checkboxes from the uploaded file '{file_obj.name}' using this content:\n\n{content}",
            'bullet-points': f"Please generate a bullet-point summary of the key takeaways from the uploaded file '{file_obj.name}' using this content:\n\n{content}"
        }
        prompt = prompt_templates.get(format_type, prompt_templates['bullet-points'])
        
        gemini_summary = call_gemini_api(prompt)
        if gemini_summary:
            return api_success(data={"summary": gemini_summary}, message="AI summary generated from file successfully.")
            
        heuristic_out = heuristic_summarize(content, format_type)
        prefix = f"# Document Analysis: {file_obj.name}\n\n*File Size: {file_obj.size} bytes*\n\n"
        return api_success(data={"summary": prefix + heuristic_out}, message="AI summary generated from file successfully.")

