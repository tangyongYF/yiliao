import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'normal' | 'large';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'normal', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyle = "flex items-center justify-center font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700",
    secondary: "bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700",
    outline: "border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50"
  };

  const sizes = {
    normal: "py-3 px-6 text-lg",
    large: "py-4 px-8 text-xl w-full" // Mobile-first optimization
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
};