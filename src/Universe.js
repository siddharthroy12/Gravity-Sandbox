import Vector2 from "./Vector2";

const GRAVITY_CONSTANT = 100.0;

function gravity(G, m1, m2, dist) {
  return (G * m1 * m2) / ((dist * dist) + 9000);
}

export default class Universe {
  constructor() {
    this.bodies = [];
  }

  addBody(b, x, y) {
    b.position.set(x, y);
    this.bodies.push(b);
  }

  getBodyByPoint(x, y) {
    let result = null;
    this.bodies.forEach(body => {
      const pointVector = new Vector2(x, y);
      pointVector.subtract(body.position);
      const length = pointVector.length();
      if (body.size > length) {
        result =  body;
      }
    })

    return result;
  }

  clear() {
    this.bodies = [];
  }

  update(dt) {
    if (this.bodies.length > 1) {
      // Calculate gravitational forces between all bodies. We need at least
      // two bodies to do this, of course.
      for (let i = 1; i < this.bodies.length; i++) {
        for (let j = i - 1; j >= 0; j--) {
          let b1 = this.bodies[i];
          let b2 = this.bodies[j];
          let forceMagnitude = gravity(GRAVITY_CONSTANT, b1.mass, b2.mass, b1.distance(b2));
          let force = new Vector2(b2.position);
          force.subtract(b1.position);
          force.normalize();
          force.scale(forceMagnitude);
          let revForce = new Vector2(-force.x, -force.y)
          b1.applyForce(force);
          b2.applyForce(revForce);
        }
      }
    }

    // Move universe forward
    this.bodies.forEach(body => {
      body.integrate(dt);
    });
  }

  draw(context) {
    this.bodies.forEach(body => body.draw(context));
  }
}
