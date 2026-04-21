import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
        <Icon size={20} className="text-gray-300" strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-[14px] font-medium text-gray-700">{title}</div>
        {description && (
          <div className="text-[13px] mt-1 text-gray-400">{description}</div>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
