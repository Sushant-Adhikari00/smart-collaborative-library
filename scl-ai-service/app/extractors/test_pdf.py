from pdf_extractor import extract_text_from_pdf

file_path = "Chapter1-MobApp.pdf"

text = extract_text_from_pdf(file_path)

print("\n===== EXTRACTED TEXT =====\n")
print(text)