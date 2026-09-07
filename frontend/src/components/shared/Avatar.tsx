interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

const Avatar = ({ src, name, size = 'md' }: AvatarProps) => {
  const initials = getInitials(name);
  const sizeClass = sizeStyles[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary flex items-center justify-center ring-2 ring-white dark:ring-gray-800`}
    >
      <span className="text-white font-semibold">{initials}</span>
    </div>
  );
};

export default Avatar;
