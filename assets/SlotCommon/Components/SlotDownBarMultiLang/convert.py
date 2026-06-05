import pandas as pd
import json
import os

file_name = 'GameTextDictionary'
# Load the Excel file
excel_file_path = 'GameTextDictionary.xls'  # Replace with your Excel file path
df = pd.read_excel(excel_file_path)

# Assuming the first column is the key and the rest are languages
keys = df.iloc[:, 2]  # First column is the key
languages = df.columns[3:]  # Rest of the columns are languages

# Create a JSON file for each language
for lang in languages:
    os.makedirs(f'./{lang}', exist_ok=True)
    # Create a dictionary for the current language
    lang_dict = {}
    for key, text in zip(keys, df[lang]):
        if not isinstance(text, str) or not text.strip():  # Check if text is a non-empty string
            continue
        lang_dict[key] = text#.replace('"',"\"")
    
    # Write the dictionary to a JSON file
    json_file_path = f'./{lang}/{file_name}.json'  # JSON file name based on language
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(lang_dict, json_file, ensure_ascii=False, indent=4)
    
    print(f'Created {json_file_path}')

print('All JSON files created successfully!')
