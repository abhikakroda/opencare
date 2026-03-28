import { ScanText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export const VisionPanel = () => {
  const { readOnly } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Gemini Scan</p>
          <h2>Upload a prescription photo to transcribe and summarize it</h2>
        </div>
        <ScanText size={28} />
      </div>

      <div className="upload-row">
        <input
          type="file"
          accept="image/*"
          disabled={readOnly}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setFile(nextFile);
            setFileName(nextFile?.name ?? '');
          }}
        />
        <button type="button" onClick={handleUpload} disabled={readOnly || !file || loading}>
          {loading ? 'Analyzing...' : 'Transcribe Photo'}
        </button>
      </div>

      {fileName ? <p className="helper-text">Selected image: {fileName}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </section>
  );
};
