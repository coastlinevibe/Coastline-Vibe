import ImageNext from 'next/image';

interface PostImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function PostImage({ src, alt, className }: PostImageProps) {
  return (
    <div 
      className={`relative w-full aspect-[3/2] overflow-hidden rounded-lg bg-slate-50 ${className || ''}`}
    >
        <ImageNext 
          src={src} 
          alt={alt} 
        fill
          style={{ objectFit: "cover" }}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="rounded-md hover:scale-105 transition-transform duration-200"
        />
    </div>
  );
} 