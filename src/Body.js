import Vector2 from "./Vector2";
import { getRandomNiceColor } from './niceColors';

const TAIL_SIZE = 50;

export function mass2radius(mass) {
  return Math.log(mass) * 3.0;
}

export default class Body {
  constructor(mass, color) {
    this.mass = mass;
    this.size = mass2radius(mass);
    this.color = color != null ? color : getRandomNiceColor();
    this.invMass = 1.0 / mass;
    this.position = new Vector2(0.0, 0.0);
    this.velocity = new Vector2(0.0, 0.0);
    this.forceAccumulator = new Vector2(0.0, 0.0);
    this.previousStates = [];
  }

  integrate(dt) {
    let scaledForce = new Vector2(this.forceAccumulator.x, this.forceAccumulator.y);
    scaledForce.scale(dt * this.invMass);
    this.velocity.add(scaledForce)

    let scaledVelocity = new Vector2(this.velocity.x, this.velocity.y);
    scaledVelocity.scale(dt);
    this.position.add(scaledVelocity);

    this.forceAccumulator.set(0, 0);

    if (this.previousStates.length > TAIL_SIZE) {
      this.previousStates.shift();
    }

    this.previousStates.push({ ...this.position });
  }

  applyForce(f) {
    this.forceAccumulator.add(f);
  }

  distanceSquared(b) {
    return this.position.distanceSquared(b.position);
  }

  distance(b) {
    return Math.sqrt(this.distanceSquared(b));
  }

  draw(context) {
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
    context.fillStyle = this.color;
    context.fill();
    context.lineWidth = 2;

    if (this.previousStates.length < 2) {
      return;
    }

    for (let i = 1; i < this.previousStates.length; i++) {
      const currState = this.previousStates[i];
      const prevState = this.previousStates[i-1];
      context.beginPath();
      context.moveTo(currState.x, currState.y);
      context.lineTo(prevState.x, prevState.y);
      context.strokeStyle = this.color;
      context.stroke();
    }
  }
}


