import { getInitials, randomAvatarColor, cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-5 h-5 text-[8.5px]",
  sm: "w-7 h-7 text-[10.5px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-10 h-10 text-[13px]",
};

export default function Avatar({ name, size = "md", className }: AvatarProps) {
  const bgColor = randomAvatarColor(name);
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white shrink-0",
        bgColor, SIZE_MAP[size], className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - max;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((name) => (
        <Avatar key={name} name={name} size="sm" className="ring-2 ring-white" />
      ))}
      {rest > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
          +{rest}
        </div>
      )}
    </div>
  );
}
