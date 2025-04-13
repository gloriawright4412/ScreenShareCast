
import { webRTCManager } from './webrtc';

export interface RemoteControlMessage {
  type: 'mouse' | 'keyboard';
  event: {
    type: string;
    x?: number;
    y?: number;
    button?: number;
    key?: string;
    keyCode?: number;
    modifier?: {
      ctrl: boolean;
      alt: boolean;
      shift: boolean;
    };
  };
}

export class RemoteControl {
  private enabled: boolean = false;
  private controlDataChannel: RTCDataChannel | null = null;

  public enable() {
    this.enabled = true;
    this.setupControlChannel();
  }

  public disable() {
    this.enabled = false;
    if (this.controlDataChannel) {
      this.controlDataChannel.close();
    }
  }

  private setupControlChannel() {
    try {
      this.controlDataChannel = webRTCManager.createControlChannel('remote-control');
      
      if (this.controlDataChannel) {
        this.controlDataChannel.onmessage = this.handleRemoteControlMessage.bind(this);
        this.controlDataChannel.onerror = (error) => {
          console.error('Remote control channel error:', error);
          this.disable();
        };
        this.controlDataChannel.onclose = () => {
          console.log('Remote control channel closed');
          this.disable();
        };
      }
    } catch (error) {
      console.error('Failed to setup remote control channel:', error);
      this.disable();
    }
  }

  public sendControlEvent(message: RemoteControlMessage) {
    if (!this.enabled || !this.controlDataChannel) return;
    
    this.controlDataChannel.send(JSON.stringify(message));
  }

  private handleRemoteControlMessage(event: MessageEvent) {
    if (!this.enabled) return;

    const message: RemoteControlMessage = JSON.parse(event.data);
    
    if (message.type === 'mouse') {
      this.simulateMouseEvent(message.event);
    } else if (message.type === 'keyboard') {
      this.simulateKeyboardEvent(message.event);
    }
  }

  private simulateMouseEvent(event: any) {
    const mouseEvent = new MouseEvent(event.type, {
      clientX: event.x,
      clientY: event.y,
      button: event.button,
      bubbles: true
    });
    document.elementFromPoint(event.x, event.y)?.dispatchEvent(mouseEvent);
  }

  private simulateKeyboardEvent(event: any) {
    const keyEvent = new KeyboardEvent(event.type, {
      key: event.key,
      keyCode: event.keyCode,
      ctrlKey: event.modifier?.ctrl,
      altKey: event.modifier?.alt,
      shiftKey: event.modifier?.shift,
      bubbles: true
    });
    document.activeElement?.dispatchEvent(keyEvent);
  }
}

export const remoteControl = new RemoteControl();
