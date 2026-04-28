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

interface IMessagesContext {
  message: IMessage;
  onShowMessage: (message: Omit<IMessage, 'isVisible'>) => void;
  onHideMessage: () => void;
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

  return (
    <MessagesContext.Provider value={{ message, onShowMessage, onHideMessage }}>{children}</MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
