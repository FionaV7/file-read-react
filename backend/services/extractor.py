import os
import io
from pypdf import PdfReader
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation
from PIL import Image
import zipfile
import json
import csv

class FileExtractor:
    def __init__(self):
        self.supported_formats = {
            '.pdf': self.extract_pdf,
            '.docx': self.extract_docx,
            '.xlsx': self.extract_xlsx,
            '.xls': self.extract_xls,
            '.csv': self.extract_csv,
            '.txt': self.extract_txt,
            '.json': self.extract_json,
            '.xml': self.extract_xml,
            '.png': self.extract_image,
            '.jpg': self.extract_image,
            '.jpeg': self.extract_image,
            '.bmp': self.extract_image,
            '.tiff': self.extract_image,
            '.webp': self.extract_image,
            '.zip': self.extract_zip,
            '.pptx': self.extract_pptx,
            '.ppt': self.extract_ppt,
            '.md': self.extract_markdown,
            '.html': self.extract_html,
        }

    def extract_file(self, file_path: str) -> str:
        """Extract content from various file formats"""
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        if ext not in self.supported_formats:
            return f"Unsupported file format: {ext}"
        
        try:
            return self.supported_formats[ext](file_path)
        except Exception as e:
            return f"Error extracting {ext} file: {str(e)}"

    def extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF using pypdf"""
        text = ""
        with open(file_path, 'rb') as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()
        return text

    def extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text

    def extract_xlsx(self, file_path: str) -> str:
        """Extract text from XLSX without pandas"""
        wb = load_workbook(file_path, data_only=True)
        text = ""
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            text += f"\n--- Sheet: {sheet_name} ---\n"
            for row in sheet.iter_rows(values_only=True):
                text += " | ".join([str(cell) if cell is not None else "" for cell in row]) + "\n"
        return text

    def extract_xls(self, file_path: str) -> str:
        """Extract text from XLS"""
        return self.extract_xlsx(file_path)

    def extract_csv(self, file_path: str) -> str:
        """Extract text from CSV without pandas"""
        text = ""
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                text += " | ".join(row) + "\n"
        return text

    def extract_txt(self, file_path: str) -> str:
        """Extract text from TXT"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def extract_json(self, file_path: str) -> str:
        """Extract text from JSON"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return json.dumps(data, indent=2)

    def extract_xml(self, file_path: str) -> str:
        """Extract text from XML"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def extract_image(self, file_path: str) -> str:
        """Extract metadata from image"""
        try:
            img = Image.open(file_path)
            return f"Image: {img.format} {img.size}"
        except:
            return "Failed to extract image metadata"

    def extract_zip(self, file_path: str) -> str:
        """Extract text from ZIP archive"""
        text = ""
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            for file_info in zip_ref.filelist:
                if not file_info.filename.endswith('/'):
                    with zip_ref.open(file_info.filename) as f:
                        try:
                            content = f.read().decode('utf-8')
                            text += f"--- {file_info.filename} ---\n{content}\n"
                        except:
                            pass
        return text

    def extract_pptx(self, file_path: str) -> str:
        """Extract text from PPTX (PowerPoint)"""
        prs = Presentation(file_path)
        text = ""
        for slide_num, slide in enumerate(prs.slides, 1):
            text += f"\n--- Slide {slide_num} ---\n"
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
                elif hasattr(shape, "table"):
                    # Extract table data
                    table = shape.table
                    for row in table.rows:
                        row_data = [cell.text for cell in row.cells]
                        text += " | ".join(row_data) + "\n"
        return text

    def extract_ppt(self, file_path: str) -> str:
        """Extract text from PPT (older PowerPoint format)"""
        try:
            # Older .ppt files need conversion or special handling
            # Attempt to extract using python-pptx which may support some older formats
            return self.extract_pptx(file_path)
        except Exception as e:
            return f"Note: .ppt files have limited support. Consider converting to .pptx. Error: {str(e)}"

    def extract_markdown(self, file_path: str) -> str:
        """Extract text from Markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def extract_html(self, file_path: str) -> str:
        """Extract text from HTML file"""
        try:
            from html.parser import HTMLParser
            
            class HTMLTextExtractor(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.text = []
                
                def handle_data(self, data):
                    text = data.strip()
                    if text:
                        self.text.append(text)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            extractor = HTMLTextExtractor()
            extractor.feed(html_content)
            return "\n".join(extractor.text)
        except Exception as e:
            # Fallback: return raw HTML content
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks"""
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
    return chunks
