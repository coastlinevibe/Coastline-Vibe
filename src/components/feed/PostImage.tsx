import ImageNext from 'next/image';

interface PostImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function PostImage({ src, alt, className }: PostImageProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-slate-50 ${className || ''}`}>
        <ImageNext 
          src={src} 
          alt={alt} 
        fill
        style={{ objectFit: "contain" }}
        sizes="100vw"
        className="rounded-md"
        />
    </div>
  );
} 