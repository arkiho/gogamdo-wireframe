import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface SortablePortfolioCardProps {
  id: number;
  isEditing: boolean;
  children: ReactNode;
}

export function SortablePortfolioCard({ id, isEditing, children }: SortablePortfolioCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative ${isEditing ? "ring-2 ring-gold" : ""} ${isDragging ? "shadow-lg" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted/50 rounded-l-lg transition-colors"
        title="드래그하여 순서 변경"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <div className="ml-8">
        {children}
      </div>
    </Card>
  );
}
