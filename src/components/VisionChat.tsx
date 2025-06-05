import React, { useState } from 'react';

const VisionChat = () => {
  const [image, setImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !prompt) return;
    setLoading(true);
    setReply('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', image);
      // We'll send prompt as a query param for simplicity
      const res = await fetch(`/api/vision-chat?prompt=${encodeURIComponent(prompt)}`, {
        method: 'POST',
        body: image,
      });
      const data = await res.json();
      if (data.reply) setReply(data.reply);
      else setError(data.error || 'No reply');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cyan-50 rounded-lg p-4 mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="font-medium">Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <label className="font-medium">Prompt</label>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Describe this item..."
        />
        <button type="submit" className="bg-teal-500 text-white rounded px-4 py-1 mt-2" disabled={loading || !image || !prompt}>
          {loading ? 'Analyzing...' : 'Ask Vision AI'}
        </button>
      </form>
      {reply && <div className="mt-3 p-2 bg-white border rounded text-sm">{reply}</div>}
      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
    </div>
  );
};

export default VisionChat; 