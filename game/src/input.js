// Keyboard and mouse input: one module owns every key and click so the game loop
// only ever asks "what happened since the last frame?".
//
// Space / ArrowUp / W — jump (edge-triggered) and confirm on menus.
// ArrowDown / S — slide while held (and drop fast while airborne).
// P — pause. M — mute. Enter — confirm on menus.
// Click / tap — jump while playing, confirm on menus.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

export function createInput(canvas) {
  let jumpQueued = false;
  let slideHeld = false;
  let actions = 0;

  function isJumpKey(code) {
    return code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
  }
  function isSlideKey(code) {
    return code === 'ArrowDown' || code === 'KeyS';
  }

  function onKeyDown(event) {
    if (isJumpKey(event.code)) {
      if (!event.repeat) jumpQueued = true;
      event.preventDefault();
    } else if (isSlideKey(event.code)) {
      slideHeld = true;
      event.preventDefault();
    } else if (event.code === 'KeyP') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    } else if (event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
    }
  }

  function onKeyUp(event) {
    if (isSlideKey(event.code)) slideHeld = false;
  }

  function onPointerDown(event) {
    event.preventDefault();
    jumpQueued = true;
    try {
      canvas.focus();
    } catch {
      // Focus is a nicety; the game plays on without it.
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** True once per jump press, then cleared until the next press. */
    takeJump() {
      const jumped = jumpQueued;
      jumpQueued = false;
      return jumped;
    },
    isSliding() {
      return slideHeld;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
