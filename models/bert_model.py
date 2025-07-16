from transformers import BertTokenizer, BertModel
import torch
import torch.nn.functional as F

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
model = BertModel.from_pretrained("bert-base-uncased")

def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1)

def score_answer(answer, expected_keywords):
    user_emb = get_embedding(answer)
    expected_emb = get_embedding(" ".join(expected_keywords))
    similarity = F.cosine_similarity(user_emb, expected_emb).item()
    return round(similarity * 5, 2)  # out of 5

def generate_feedback(score):
    if score >= 4:
        return "Excellent answer. Very relevant and well-articulated."
    elif score >= 2.5:
        return "Fair answer. Try including more details or structure."
    else:
        return "The answer needs improvement. Focus on relevance and clarity."
