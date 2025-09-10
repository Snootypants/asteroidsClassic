import assert from 'node:assert/strict';

const target = new EventTarget();

let handled = false;
const handleWheel = (e) => {
  e.preventDefault();
  handled = true;
};

target.addEventListener('wheel', handleWheel, { passive: false });

const event = new Event('wheel', { cancelable: true });
target.dispatchEvent(event);

target.removeEventListener('wheel', handleWheel);

assert.equal(handled, true, 'wheel handler not executed');
assert.equal(event.defaultPrevented, true, 'wheel default was not prevented');

console.log('Wheel event handled and default prevented');
