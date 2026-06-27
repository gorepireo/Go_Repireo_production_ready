import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

// Simple hash function to consistently assign a color based on a string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // High-contrast, appealing colors for avatars
  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', 
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const fallbackChar = name ? name.charAt(0).toUpperCase() : 'U';
  const bgColor = name ? stringToColor(name) : '#007AFF';

  return (
    <div 
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black text-white shadow-sm border-2 border-white/20 ${className}`}
      style={{ width: size, height: size, backgroundColor: src ? 'transparent' : bgColor }}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.45, lineHeight: 1 }}>{fallbackChar}</span>
      )}
    </div>
  );
}
