import { AlertTriangle, ClipboardList, FileImage, Pill, RotateCcw, ScanText, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

type VisionResult = {
  transcription?: string;
  summary?: string;
  medicines?: string[];
  warnings?: string[];
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const parseVisionResult = (value: string): VisionResult | null => {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as VisionResult;
  } catch {
    return null;
  }
};

export const VisionPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const parsedResult = useMemo(() => parseVisionResult(result), [result]);
  const medicinesFound = parsedResult?.medicines?.length ?? 0;
  const warningsFound = parsedResult?.warnings?.length ?? 0;

  const resetSelection = () => {
    setFile(null);
    setFileName('');
    setResult('');
    setError('');
    setCopied(false);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const copyResult = async () => {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setError('Unable to copy the result.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.upload<{ result: string }>('/vision/transcribe', formData);
      setResult(response.result);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel accent-panel">
      <div className="panel-heading" style={{ justifyContent: 'flex-end' }}>
        <ScanText size={28} />
      </div>

      <div className="vision-layout">
        <div className="vision-column">
          <div className="token-card" style={{ margin: 0 }}>
            <span className="token-label">Prescription scan</span>
            <strong>{file ? 'Image ready for transcription' : 'Upload a clear prescription photo'}</strong>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Use a well-lit image with the full note visible. The scan stays private and is only used for Gemini extraction.
            </p>
            <div className="action-row" style={{ marginTop: '0.2rem' }}>
              <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>
                <FileImage size={16} />
                {file ? 'Replace image' : 'Choose image'}
              </button>
              <button type="button" onClick={handleUpload} disabled={!file || loading}>
                {loading ? 'Analyzing...' : 'Transcribe Photo'}
              </button>
              <button type="button" className="secondary-button" onClick={resetSelection} disabled={loading || (!file && !result)}>
                <RotateCcw size={16} />
                Clear
              </button>
              <button type="button" className="secondary-button" onClick={() => void copyResult()} disabled={!result}>
                <ClipboardList size={16} />
                {copied ? 'Copied' : 'Copy Result'}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setFileName(nextFile?.name ?? '');
                setResult('');
                setError('');
                setCopied(false);
              }}
            />
          </div>

          <div className="vision-meta-grid">
            <article className="vision-stat-card">
              <span className="vision-stat-label">Selected file</span>
              <strong>{fileName || 'No image selected'}</strong>
            </article>
            <article className="vision-stat-card">
              <span className="vision-stat-label">File size</span>
              <strong>{file ? formatBytes(file.size) : 'Waiting for upload'}</strong>
            </article>
            <article className="vision-stat-card">
              <span className="vision-stat-label">Scan status</span>
              <strong>{loading ? 'Gemini analyzing' : result ? 'Ready' : 'Idle'}</strong>
            </article>
          </div>

          {previewUrl ? (
            <div className="vision-preview-card">
              <div className="card-head">
                <div>
                  <strong>Image preview</strong>
                  <p>Check readability before starting the scan.</p>
                </div>
                <FileImage size={18} />
              </div>
              <img className="vision-preview" src={previewUrl} alt="Prescription preview" />
            </div>
          ) : (
            <div className="empty-state">
              <strong>No image loaded yet.</strong>
              <p>Choose a prescription, lab note, or handwritten medicine sheet to start.</p>
            </div>
          )}

          <div className="vision-tips">
            <div className="card-head">
              <div>
                <strong>Scan tips</strong>
                <p>Cleaner input usually gives more reliable extraction.</p>
              </div>
              <Sparkles size={18} />
            </div>
            <p>Keep the full document inside the frame and avoid shadows over medicine names.</p>
            <p>Use a sharp photo with readable handwriting and visible dose or timing details.</p>
          </div>
        </div>

        <div className="vision-column">
          {fileName ? <p className="helper-text">Selected image: {fileName}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          {parsedResult ? (
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <article className="token-card" style={{ margin: 0 }}>
                <span className="token-label">Scan complete</span>
                <strong>Prescription summary ready</strong>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Review the extracted transcription, detected medicines, and any warnings below.
                </p>
                <div className="action-row" style={{ marginTop: '0.35rem' }}>
                  <span className="badge">Transcription {parsedResult.transcription ? 'ready' : 'missing'}</span>
                  <span className="badge">Medicines {medicinesFound}</span>
                  <span className="badge">Warnings {warningsFound}</span>
                </div>
              </article>

              <div className="vision-result-grid">
              <article className="vision-result-card">
                <div className="card-head">
                  <div>
                    <strong>Summary</strong>
                    <p>Gemini overview of the uploaded note.</p>
                  </div>
                  <Sparkles size={18} />
                </div>
                <p>{parsedResult.summary || 'No summary returned.'}</p>
              </article>

              <article className="vision-result-card">
                <div className="card-head">
                  <div>
                    <strong>Transcription</strong>
                    <p>Extracted text from the image.</p>
                  </div>
                  <ScanText size={18} />
                </div>
                <p>{parsedResult.transcription || 'No transcription returned.'}</p>
              </article>

              <article className="vision-result-card">
                <div className="card-head">
                  <div>
                    <strong>Medicines</strong>
                    <p>Detected medicine names or treatment items.</p>
                  </div>
                  <Pill size={18} />
                </div>
                {parsedResult.medicines?.length ? (
                  <div className="vision-chip-row">
                    {parsedResult.medicines.map((medicine) => (
                      <span key={medicine} className="vision-chip">
                        {medicine}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>No medicines identified.</p>
                )}
              </article>

              <article className="vision-result-card warning-card">
                <div className="card-head">
                  <div>
                    <strong>Warnings</strong>
                    <p>Flags returned by the model that need review.</p>
                  </div>
                  <AlertTriangle size={18} />
                </div>
                {parsedResult.warnings?.length ? (
                  <div className="warning-list">
                    {parsedResult.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : (
                  <p>No warnings returned.</p>
                )}
              </article>
            </div>
            </div>
          ) : result ? (
            <pre className="result-box">{result}</pre>
          ) : (
            <div className="empty-state">
              <strong>No scan result yet.</strong>
              <p>Upload an image to extract transcription, summary, medicines, and warning notes.</p>
            </div>
          )}

          {result ? (
            <details className="vision-raw-result">
              <summary>View raw Gemini response</summary>
              <pre className="result-box">{result}</pre>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
};
