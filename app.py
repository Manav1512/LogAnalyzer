
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import google.generativeai as genai

app = Flask(__name__)

GEMINI_API_KEY = 'AIzaSyCpvFHTfMjZeZO3Ucj6MoXP3JcrUOCfAXY' 
genai.configure(api_key=GEMINI_API_KEY)

generation_config = {
    "temperature": 0.7, 
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
)

def clean_and_parse_response(response_text):
    """Clean and parse the response text to valid JSON."""
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rindex('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            raise ValueError("Could not parse response into valid JSON")

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and file.filename.endswith('.xml'):
            try:
                
                xml_content = file.read().decode('utf-8')
                
                prompt = """
                Analyze this XML log file and provide a JSON response. The response MUST be valid JSON without any additional text or explanation.
                Include the following information:
                {
                    "suspicious_logs": [{"log": "log_entry", "ip": "ip_address", "reason": "reason"}],
                    "severity_breakdown": {"high": N, "medium": N, "low": N},
                    "total_logs": N,
                    "unique_users": N,
                    "unique_ips": N,
                    "unique_events": N,
                    "peak_hours": [{"hour": N, "count": N}]
                }
                
                XML log file:
                """
                
                response = model.generate_content([prompt, xml_content])
                
                try:
                    
                    analysis_result = clean_and_parse_response(response.text)
                    return jsonify(analysis_result)
                except ValueError as e:
                   
                    print("Raw Gemini response:", response.text)
                    return jsonify({
                        'error': 'Failed to parse Gemini response',
                        'details': str(e)
                    }), 500
                
            except Exception as e:
                return jsonify({
                    'error': 'Error processing XML file',
                    'details': str(e)
                }), 400
        
        return jsonify({'error': 'Invalid file format. Please upload an XML file'}), 400
    
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

if __name__ == '__main__':
    app.run(debug=True)