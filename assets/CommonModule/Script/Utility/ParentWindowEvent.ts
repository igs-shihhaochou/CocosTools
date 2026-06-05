const addTouchListener = (canvasID = 'GameCanvas') => {
  window.addEventListener('message', event => {
    touchHandler(document.getElementById(canvasID), event);
  });
};

const touchHandler = (gameCanvas: HTMLElement, event: MessageEvent) => {
  if (event.data?.source === 'dom') {
    dispatchEvent(event);
    return;
  }
  if (!event.data?.type) {
    return;
  }
  try {
    if (event.data?.type.includes('touch')) {
      gameCanvas.dispatchEvent(getTouchEvent(gameCanvas, event));
    }
    if (event.data?.type.includes('mouse')) {
      gameCanvas.dispatchEvent(getMouseEvent(event));
    }
  } catch (e) {
    console.error(e);
  }
};

const dispatchEvent = (event: MessageEvent) => {
  if (event.data?.source !== 'dom') {
    return;
  }
  const canvas = document.getElementById('GameCanvas') as HTMLElement;
  if (!canvas) {
    return;
  }
  const type = event.data?.type;
  const device = event.data?.device;
  try {
    if (device === 'touch' || (type && type.includes('touch'))) {
      canvas.dispatchEvent(getTouchEvent2(canvas, event));
    } else if (
      device === 'wheel' ||
      type === 'wheel' ||
      type === 'mousewheel'
    ) {
      canvas.dispatchEvent(getWheelEvent(event));
    } else if (device === 'mouse' || (type && type.includes('mouse'))) {
      canvas.dispatchEvent(getMouseEvent(event));
    }
  } catch (e) {
    console.error(e);
  }
};

const getMouseEvent = (event: MessageEvent) => {
  return new MouseEvent(event.data.type, {
    bubbles: true,
    clientX: event.data.position.x,
    clientY: event.data.position.y,
    button: 0,
  });
};

const getWheelEvent = (event: MessageEvent) => {
  return new WheelEvent(event.data.type, {
    bubbles: true,
    deltaX: event.data?.scroll?.x ?? 0,
    deltaY: event.data?.scroll?.y ?? 0,
    clientX: event.data?.position?.x ?? 0,
    clientY: event.data?.position?.y ?? 0,
  });
};

const getTouchEvent = (gameCanvas: HTMLElement, event: MessageEvent) => {
  const changedTouches = [];
  const touch = event.data.touch;
  const touchPoint = new Touch({
    identifier: touch.id,
    target: gameCanvas,
    clientX: touch.x,
    clientY: Number(gameCanvas.clientHeight) - touch.y,
  });
  changedTouches.push(touchPoint);
  return new TouchEvent(event.data.type, {
    cancelable: true,
    bubbles: true,
    touches: changedTouches,
    targetTouches: changedTouches,
    changedTouches: changedTouches,
    shiftKey: false,
  });
};

const getTouchEvent2 = (gameCanvas: HTMLElement, event: MessageEvent) => {
  const changedTouches = [];
  const touch = event.data.touch;
  const touchPoint = new Touch({
    identifier: touch.id,
    target: gameCanvas,
    clientX: touch.x,
    clientY: touch.y,
  });
  changedTouches.push(touchPoint);
  return new TouchEvent(event.data.type, {
    cancelable: true,
    bubbles: true,
    touches: changedTouches,
    targetTouches: changedTouches,
    changedTouches: changedTouches,
    shiftKey: false,
  });
};

export {addTouchListener};
