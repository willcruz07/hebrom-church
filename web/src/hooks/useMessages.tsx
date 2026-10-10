'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface IMessage {
  isVisible: boolean;
  title: string;
  description: string;
  buttonText: string;
  type: 'MESSAGE' | 'QUESTION';
  messageType: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  /** Ação destrutiva (excluir): botão de confirmar em vermelho. */
  destructive?: boolean;
}

interface IMessagesContext {
  message: IMessage;
  onShowMessage: (message: Omit<IMessage, 'isVisible'>) => void;
  onHideMessage: () => void;
  /** Substitui o `confirm()` do navegador pelo diálogo do app. Resolve `true` se confirmado. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const MessagesContext = createContext<IMessagesContext>({} as IMessagesContext);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<IMessage>({
    isVisible: false,
    title: '',
    description: '',
    buttonText: '',
    type: 'MESSAGE',
    messageType: 'info',
  });

  const onShowMessage = (newMessage: Omit<IMessage, 'isVisible'>) => {
    setMessage({
      ...newMessage,
      isVisible: true,
    });
  };

  const onHideMessage = () => {
    setMessage((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  const confirm = ({ title, description, confirmText, destructive }: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      onShowMessage({
        type: 'QUESTION',
        messageType: destructive ? 'error' : 'warning',
        title,
        description,
        buttonText: confirmText ?? 'Confirmar',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  return (
    <MessagesContext.Provider value={{ message, onShowMessage, onHideMessage, confirm }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
