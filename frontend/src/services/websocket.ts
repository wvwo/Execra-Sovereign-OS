import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token?: string) {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.socket?.disconnect();
      }
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeExecution(executionId: string) {
    this.socket?.emit('subscribe_execution', executionId);
  }

  unsubscribeExecution(executionId: string) {
    this.socket?.emit('unsubscribe_execution', executionId);
  }

  resolveCaptcha(executionId: string, sessionId: string) {
    this.socket?.emit('captcha_resolved', { executionId, sessionId });
  }

  onStepUpdate(callback: (data: any) => void) {
    this.socket?.on('step_update', callback);
    return () => this.socket?.off('step_update', callback);
  }

  onCaptchaDetected(callback: (data: any) => void) {
    this.socket?.on('captcha_detected', callback);
    return () => this.socket?.off('captcha_detected', callback);
  }

  onExecutionComplete(callback: (data: any) => void) {
    this.socket?.on('execution_complete', callback);
    return () => this.socket?.off('execution_complete', callback);
  }
}

export const wsService = new WebSocketService();

export function useExecutionSocket(executionId: string) {
  const [status, setStatus] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [captchaDetected, setCaptchaDetected] = useState(false);

  useEffect(() => {
    // In real app, extract token from cookie or context if needed
    const token = "dummy-token-for-now";
    wsService.connect(token);
    wsService.subscribeExecution(executionId);

    const unsubStep = wsService.onStepUpdate((data) => {
      setCurrentStep(data.step_id);
      setStatus(data.status);
    });

    const unsubCaptcha = wsService.onCaptchaDetected(() => {
      setCaptchaDetected(true);
    });

    const unsubComplete = wsService.onExecutionComplete((data) => {
      setStatus(data.status);
      setCaptchaDetected(false);
    });

    return () => {
      unsubStep();
      unsubCaptcha();
      unsubComplete();
      wsService.unsubscribeExecution(executionId);
    };
  }, [executionId]);

  const resolveCaptcha = useCallback(() => {
    wsService.resolveCaptcha(executionId, ''); 
    setCaptchaDetected(false);
  }, [executionId]);

  return { status, currentStep, captchaDetected, resolveCaptcha };
}
