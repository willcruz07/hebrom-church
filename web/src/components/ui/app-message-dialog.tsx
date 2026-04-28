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

export function AppMessageDialog() {
  const { message, onHideMessage } = useMessages();
  const { isVisible, title, description, type, onConfirm, onCancel, buttonText } = message;

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onHideMessage();
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
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm}>Sim, confirmar</Button>
            </>
          ) : (
            <Button onClick={handleConfirm}>{buttonText || 'OK'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
