import sys

script_code = '''
with open('src/utils/docxExport.ts', 'r', encoding='utf-8') as f:
    orig = f.read()

# Verify header/footer replacement
# We want createDocFooter to take formCode: string = 'BM.02A/TĐTS'
'''
print("Generator script template ready")
