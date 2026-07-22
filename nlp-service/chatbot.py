import os
import json
from llama_cpp import Llama

# Load model lazily
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "Phi-3-mini-4k-instruct-v0.3-Q4_K_M.gguf")
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model not found at {MODEL_PATH}")
        # n_ctx=2048 is usually enough for chat history
        _llm = Llama(model_path=MODEL_PATH, n_ctx=2048, verbose=False)
    return _llm

def get_response(user_input: str, history: list = None, user_name: str = "friend"):
    llm = get_llm()
    
    if history is None:
        history = []
        
    system_prompt = (
        f"You are DailyAid's compassionate, polite, and attentive health assistant. "
        f"You are talking to an elderly person named {user_name}. "
        "Keep your responses short, supportive, and clear. "
        "If they mention any critical health issue (like chest pain, falling, severe bleeding, or inability to breathe), "
        "you MUST set is_critical to true in your JSON output. Otherwise, set it to false. "
        "For sentiment, choose one of: POSITIVE, NEGATIVE, or NEUTRAL. "
        "CRITICAL INSTRUCTION: Your 'reply' field must ONLY contain the conversational response to the user. Do NOT include phrases like 'Let's set is_critical to false' or mention 'sentiment' in your reply."
    )
    
    # Construct Phi-3 prompt format
    prompt = f"<|system|>\n{system_prompt}<|end|>\n"
    
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "assistant":
            prompt += f"<|assistant|>\n{content}<|end|>\n"
        else:
            prompt += f"<|user|>\n{content}<|end|>\n"
            
    prompt += f"<|user|>\n{user_input}<|end|>\n<|assistant|>\n"
    
    # JSON schema for structured output
    schema = {
        "type": "object",
        "properties": {
            "reply": {"type": "string"},
            "sentiment": {"type": "string", "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL"]},
            "is_critical": {"type": "boolean"}
        },
        "required": ["reply", "sentiment", "is_critical"]
    }
    
    try:
        from llama_cpp.llama_grammar import LlamaGrammar
        grammar = LlamaGrammar.from_json_schema(json.dumps(schema))
        
        response = llm(
            prompt,
            max_tokens=256,
            temperature=0.3,
            grammar=grammar
        )
        content = response["choices"][0]["text"]
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return {
            "reply": "I'm here for you, but I'm having trouble processing that right now.",
            "sentiment": "NEUTRAL",
            "is_critical": False
        }
