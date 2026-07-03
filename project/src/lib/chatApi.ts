import type { ChatRequest, ChatResponse, RouteResponse, StudentVerifyResponse } from '../core/types';
import * as pdfjs from 'pdfjs-dist';
import { authHeaders } from './authApi';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const API = '/api/v1';

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'AUTH_REQUIRED') throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'SG16 AI is temporarily unavailable');
  }
  return data;
}

export async function verifyStudentId(imageUrl: string): Promise<StudentVerifyResponse> {
  const res = await fetch(`${API}/student/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ imageUrl }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'AUTH_REQUIRED') throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'SG16 AI verification is temporarily unavailable');
  }
  return data;
}

export async function routeIntent(query: string): Promise<RouteResponse> {
  const res = await fetch(`${API}/route`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'AUTH_REQUIRED') throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'SG16 AI routing unavailable');
  }
  return data;
}

const MAX_DOC_CHARS = 400_000;

export async function readTextFile(file: File): Promise<string> {
  const text = await file.text();
  if (text.length > MAX_DOC_CHARS) {
    throw new Error('Document too large. Please use a file under 400KB of text.');
  }
  return text;
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const parts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 50);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(
      content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' '),
    );
  }

  const text = parts.join('\n\n').trim();
  if (!text) {
    throw new Error('No readable text found in this PDF. Try a text-based PDF or paste the content.');
  }
  if (text.length > MAX_DOC_CHARS) {
    throw new Error('PDF text is too large. Please use a shorter document.');
  }
  return text;
}

export async function readDocumentFile(file: File): Promise<string> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) return extractPdfText(file);
  return readTextFile(file);
}

function compressImage(dataUrl: string, maxDim = 1536, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to process image'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export async function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Image must be under 8MB.');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
  return compressImage(dataUrl);
}
