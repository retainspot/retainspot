
from transformers import pipeline

_sent = None

def get_model():
    global _sent
    if _sent is None:
        _sent = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            truncation=True
        )
    return _sent

def predict_sentiment(text: str):
    if not text or str(text).strip() == "":
        return (None, None, None)

    model = get_model()
    res = model(str(text))[0]
    
    raw_label = res["label"].lower() 
    label_map = {"negative": 0, "neutral": 1, "positive": 2}
    
    return (res["label"], float(res["score"]), label_map.get(raw_label, 1))

def predict_sentiment_batch(texts, batch_size: int = 64):
    """
    texts: list of strings
    returns: list of (label, score, num)
    """
    model = get_model()
    label_map = {"negative": 0, "neutral": 1, "positive": 2}

    cleaned = []
    keep_idx = []
    results = [(None, None, None)] * len(texts)

    for i, t in enumerate(texts):
        if t is None or str(t).strip() == "":
            continue
        cleaned.append(str(t))
        keep_idx.append(i)

    out = []
    for i in range(0, len(cleaned), batch_size):
        out.extend(model(cleaned[i:i+batch_size]))

    for j, o in enumerate(out):
        idx = keep_idx[j]
        results[idx] = (o["label"], float(o["score"]), label_map[o["label"]])

    return results
