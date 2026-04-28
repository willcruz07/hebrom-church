import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import { useState } from 'react';

const EMOJIS = [
  '💰', '💸', '💳', '🧾', '📊', '📉', '📈',
  '🏠', '🏢', '🛒', '🛍️', '🎁', '🎫',
  '🍔', '🍕', '🍻', '☕', '🍎',
  '🚗', '✈️', '🚌', '⛽', '🔧',
  '💊', '🏥', '🏋️', '⚽', '🎮',
  '🎓', '📚', '💼', '📱', '💻',
  '👶', '🐶', '🐱', '🐾', '💍',
  '⚠️', '🚫', '✅', '❓', '🔔'
];

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 w-10 p-0 text-xl border-slate-800 bg-slate-950 hover:bg-slate-900",
            className
          )}
        >
          {value || <Smile className="h-4 w-4 text-slate-400" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2 bg-slate-950 border-slate-800">
        <div className="grid grid-cols-7 gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-slate-800 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
