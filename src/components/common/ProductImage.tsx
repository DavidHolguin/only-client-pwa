import React, { useState } from 'react'
import { Armchair, Sparkles } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt?: string
  className?: string
  containerClassName?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Producto Only Home',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-14 h-14 rounded-2xl shrink-0 overflow-hidden border border-border/60 bg-secondary/40 relative flex items-center justify-center shadow-xs',
  iconSize = 'md'
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const isValidUrl = src && src.trim().length > 0 && !hasError

  if (isValidUrl) {
    return (
      <div className={containerClassName}>
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <Armchair className={`${iconSizes[iconSize]} text-muted-foreground/30`} />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    )
  }

  // Placeholder Estético y Funcional Only Home
  return (
    <div
      className={`${containerClassName} bg-gradient-to-br from-brand-blue/10 via-slate-50 to-amber-500/10 dark:from-slate-800/80 dark:via-slate-900 dark:to-brand-blue/20 border border-brand-blue/20 flex flex-col items-center justify-center text-brand-blue shadow-xs group`}
    >
      <div className="relative flex items-center justify-center">
        <Armchair className={`${iconSizes[iconSize]} text-brand-blue/80 group-hover:scale-110 transition-transform`} />
        <Sparkles className="w-2.5 h-2.5 text-gold absolute -top-1 -right-1 opacity-75" />
      </div>
    </div>
  )
}
