'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Keyboard, Loader2, ScanLine, X } from 'lucide-react';

function extractCode(value: string) {
  const match = decodeURIComponent(value).toUpperCase().match(/GRC-\d{4}/);
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
    if (!/^GRC-\d{4}$/.test(normalized)) {
      setError('Enter a valid certificate code in the format GRC-1234.');
      return;
    }
    stopScanner();
    router.push(`/verify/certificate/${normalized}`);
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
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="certificate-code" className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          <Keyboard size={16} /> Certificate code
        </label>
        <input id="certificate-code" value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(''); }} placeholder="GRC-1234" autoComplete="off" maxLength={8} className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-center font-mono text-lg font-black uppercase tracking-[0.18em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <button type="submit" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#007AFF] text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600">
          <ScanLine size={19} /> Verify certificate
        </button>
      </form>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>

      {!scanning ? (
        <button type="button" onClick={startScanner} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600">
          <Camera size={19} /> Scan certificate QR code
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-slate-950">
          <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,.35)]" />
          <button type="button" onClick={stopScanner} className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white" aria-label="Stop QR scanner"><X size={18} /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white"><Loader2 size={14} className="animate-spin" /> Scanning</div>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-700">{error}</p>}
    </div>
  );
}
