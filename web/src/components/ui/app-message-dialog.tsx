'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

export function AppMessageDialog() {
  const { message, onHideMessage } = useMessages();
  const { isVisible, title, description, type, messageType, onConfirm, onCancel, buttonText } =
    message;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onHideMessage();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onHideMessage();
  };

  // Fechar pelo fundo/Esc conta como "Cancelar"
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {type === 'QUESTION' ? (
            <>
              <Button
                onClick={handleConfirm}
                className={cn(
                  'h-11 w-full sm:w-auto rounded-xl px-8 font-black text-white active:scale-95',
                  messageType === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 shadow-lg shadow-amber-500/25 hover:bg-amber-700',
                )}
              >
                {buttonText || 'Sim, confirmar'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="h-11 w-full sm:w-auto rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConfirm}
              className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
            >
              {buttonText || 'OK'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
