import Body from './Body';
import Vector2 from './Vector2';

export function orbit(U) {
  U.addBody(new Body(1000), 0, 0);
  let moon1 = new Body(10);
  moon1.velocity.set(0, 20);
  U.addBody(moon1, 200, 0);
  let moon2 = new Body(10);
  moon2.velocity.set(0, -20);
  U.addBody(moon2, -200, 0);
  let moon3 = new Body(10);
  moon3.velocity.set(0, 14);
  U.addBody(moon3, -500, 0);
  let moon4 = new Body(10);
  moon4.velocity.set(0, -14);
  U.addBody(moon4, 500, 0);

  return [1, 44];
}

export function grid(U) {
  for (let i = -5.5; i <= 5.5; i++) {
    for (let j = -5.5; j <= 5.5; j++) {
      U.addBody(new Body(10), i * 60, j * 60);
    }
  }

  return [0.78, 102];
}

export function infinity(U) {
  for (let i = 0; i < 360; i += 10) {
    const v = new Vector2(-200, 0);
    v.x = v.x * Math.cos(i * (Math.PI/180)) - v.y * Math.sin(i * (Math.PI/180))
    v.y = v.x * Math.sin(i * (Math.PI/180)) + v.y * Math.cos(i * (Math.PI/180))
    U.addBody(new Body(10), v.x, v.y);
  }

  return [1.58, 69];
}

export function circle(U) {
  U.addBody(new Body(50), 0, 0);

  for (let i = 0; i < 360; i += 10) {
    const p = new Vector2(-200, 0);
    const v = new Vector2(0, 5);
    p.rotate(i * Math.PI/180);
    v.rotate(i * Math.PI/180);
    const b = new Body(10);
    b.velocity.set(v.x, v.y);
    U.addBody(b, p.x, p.y);
  }

  return [1.47, 44];
}

export function square(U) {
  // Top
  for (let i = -10; i <= 10; i++) {
    let body = new Body(10);
    U.addBody(body, i*20, -(10*20));
  }
  // Bottom
  for (let i = -10; i <= 10; i++) {
    let body = new Body(10);
    U.addBody(body, i*20, (10*20));
  }

  // Left
  for (let i = -9; i <= 9; i++) {
    let body = new Body(10);
    U.addBody(body, -(10*20), i*20);
  }
  // Right
  for (let i = -9; i <= 9; i++) {
    let body = new Body(10);
    U.addBody(body, (10*20), i*20);
  }

  return [1, 44];
}

export function sinewave(U) {
  for (let i = -20; i <= 20; i++) {
    U.addBody(new Body(10), i*20, Math.sin(i)*50);
  }
  return [1, 44];
}
