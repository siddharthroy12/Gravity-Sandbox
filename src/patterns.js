import Body from './Body';
import Vector2 from './Vector2';

// A planet with two moons
export function pattern1(U) {
  U.clear();

  U.addBody(new Body(1000), 0, 0);
  let moon1 = new Body(10);
  moon1.velocity.set(0, 20);
  U.addBody(moon1, 200, 0);
  let moon2 = new Body(10);
  moon2.velocity.set(0, -20);
  U.addBody(moon2, -200, 0);

  return [1, 44];
}

// A grid of planets
export function pattern2(U) {
  U.clear();

  U.addBody(new Body(1000), 0, 400);
  U.addBody(new Body(1000), 0, -400);
  U.addBody(new Body(1000), 400, 0);
  U.addBody(new Body(1000), -400, 0);

  for (let i = -2.5; i <= 2.5; i++) {
    for (let j = -2.5; j <= 2.5; j++) {
      U.addBody(new Body(10), i * 60, j * 60);
    }
  }

  return [0.78, 199];
}

// INFINITY
export function pattern3(U) {
  U.clear();

  for (let i = 0; i < 360; i += 10) {
    const v = new Vector2(-200, 0);
    v.x = v.x * Math.cos(i * (Math.PI/180)) - v.y * Math.sin(i * (Math.PI/180))
    v.y = v.x * Math.sin(i * (Math.PI/180)) + v.y * Math.cos(i * (Math.PI/180))
    U.addBody(new Body(10), v.x, v.y);
  }

  return [1.58, 69];
}

// Circle
export function pattern4(U) {
  U.clear();

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

