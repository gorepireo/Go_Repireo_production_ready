'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, X } from 'lucide-react';

const CERTIFICATE_IDENTIFIER = /GRC-\d{4}-\d+|GR\/INT\/\d{4}\/\d+|GR[IE]-[A-Z0-9]+/i;

function extractCode(value: string) {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Validate the original value. */ }
  const match = decoded.trim().toUpperCase().match(CERTIFICATE_IDENTIFIER);
  return match?.[0] || '';
}

export default function CertificateVerifier() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  const stopScanner = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopScanner, []);

  const verify = (value: string) => {
    const normalized = extractCode(value);
    if (!new RegExp(`^(?:${CERTIFICATE_IDENTIFIER.source})$`, 'i').test(normalized)) {
      setError('Enter a valid certificate ID or intern code.');
      return;
    }
    stopScanner();
    router.push(`/verify/certificate/${encodeURIComponent(normalized)}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    verify(code);
  };

  const startScanner = async () => {
    setError('');
    const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!Detector) {
      setError('QR scanning is not supported in this browser. Please enter the printed certificate code.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (!videoRef.current) return stopScanner();
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new Detector({ formats: ['qr_code'] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results[0]?.rawValue) return verify(results[0].rawValue);
        } catch { /* Keep scanning transient camera frames. */ }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      stopScanner();
      setError('Camera access was unavailable. Please enter the certificate code manually.');
    }
  };

  return (
    <div className="space-y-7">
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="certificate-code" className="block text-sm font-semibold text-slate-800">
          Certificate code
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="certificate-code" value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(''); }} placeholder="GRC-2026-00125" autoComplete="off" maxLength={64} className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 font-mono text-base font-semibold uppercase tracking-wider text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200" />
          <button type="submit" className="h-12 rounded-lg bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
            Verify certificate
          </button>
        </div>
        <p className="text-xs text-slate-500">Certificate ID, intern code, or employee code</p>
      </form>

      <div>
        {!scanning ? (
          <button type="button" onClick={startScanner} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-transparent px-4 text-sm font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300">
            <Camera size={18} /> Scan QR code
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-md bg-slate-950">
            <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
            <div className="pointer-events-none absolute inset-8 border-2 border-white/90" />
            <button type="button" onClick={stopScanner} className="absolute right-3 top-3 rounded-md bg-black/70 p-2 text-white" aria-label="Stop QR scanner"><X size={18} /></button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md bg-black/70 px-3 py-2 text-xs font-medium text-white"><Loader2 size={14} className="animate-spin" /> Scanning</div>
          </div>
        )}
      </div>

      {error && <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
    </div>
  );
}
