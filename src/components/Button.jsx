import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-xl active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-sm',
    outline: 'border-2 border-border bg-transparent hover:bg-secondary/80 text-foreground shadow-sm',
    ghost: 'bg-transparent hover:bg-foreground/5 text-muted-foreground hover:text-foreground shadow-none active:scale-100',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm',
  };

  const sizes = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3 px-6 text-sm',
    lg: 'py-4 px-8 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
