import { cn } from '../lib/utils'

interface CursorProps extends React.HTMLAttributes<HTMLDivElement> {
  color: string
  name: string
}

export const Cursor = ({ color, name, className, style, ...props }: CursorProps) => {
  return (
    <div className={cn('pointer-events-none', className)} style={style} {...props}>
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.4561L0.161938 0.839066L11.7973 6.33088L5.65376 12.4561Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <div
        className="absolute left-4 top-4 rounded px-2 py-1 text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}
