import React from 'react';

const Button = ({
  icon: Icon,
  text,
  variant = 'ghost', // 'primary', 'ghost', 'secondary'
  rounded = 'xl', // 'xl', 'full'
  disabled = false,
  className = '',
  onClick,
  title,
  children,
  ...props
}) => {
  const baseStyles = "p-2 transition-colors flex items-center justify-center gap-2";
  const roundedStyle = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const cursorStyle = disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer';

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = "text-primary bg-primary/10 hover:bg-primary/20";
  } else if (variant === 'secondary') {
    variantStyles = "text-text bg-secondary/10 hover:bg-secondary/20";
  } else {
    // ghost
    variantStyles = "text-secondary hover:text-text hover:bg-secondary/10";
  }

  return (
    <button
      className={`${baseStyles} ${roundedStyle} ${cursorStyle} ${variantStyles} ${className}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={title}
      {...props}
    >
      {Icon && <Icon size={24} />}
      {text && <span className="font-medium px-1">{text}</span>}
      {children}
    </button>
  );
};

export default Button;
