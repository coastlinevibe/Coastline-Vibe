export type PostType = 'poll' | 'announce' | 'event' | 'ask' | 'general';
export type ActivePostType = PostType | null;

interface PostToolbarProps {
  setType: (type: PostType) => void;
  onOpenPollModal: () => void;
  currentType: ActivePostType;
}

export default function PostToolbar({ setType, onOpenPollModal, currentType }: PostToolbarProps) {
  const getButtonClass = (type: PostType) => {
    let baseClass = "rounded px-3 py-1 text-sm transition-colors duration-150 ease-in-out";
    if (currentType === type) {
      baseClass += " bg-sky-500 text-white hover:bg-sky-600";
    } else {
      baseClass += " bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800";
    }
    return baseClass;
  };

  return (
    <div className="flex items-center gap-2 justify-end mb-2">
      <button onClick={() => setType('ask')} className={getButtonClass('ask')}>❓ Ask</button>
      <button onClick={() => setType('announce')} className={getButtonClass('announce')}>📢 Announce</button>
      <button onClick={() => setType('event')} className={getButtonClass('event')}>📅 Event</button>
      <button onClick={onOpenPollModal} className={getButtonClass('poll')}>🗳️ Poll</button>
    </div>
  );
} 