"""Word-level transcripts with the local OpenAI Whisper (d:\Work\whisper-env). usage: python whisper_tx.py "<clip.mp4>" "<out.json>" [model]"""
import json, sys, torch, whisper
clip, out = sys.argv[1], sys.argv[2]
model = whisper.load_model(sys.argv[3] if len(sys.argv) > 3 else "medium", device="cuda" if torch.cuda.is_available() else "cpu")
r = model.transcribe(clip, language="en", word_timestamps=True, condition_on_previous_text=False, fp16=torch.cuda.is_available())
words = [{"text": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)} for s in r["segments"] for w in s["words"]]
json.dump(words, open(out, "w", encoding="utf-8"))
print(len(words), "words ->", out)
