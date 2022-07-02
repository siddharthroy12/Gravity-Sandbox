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
    this.position = new Vector2(0.0, 0.0);
    this.velocity = new Vector2(0.0, 0.0);
    this.previousStates = [];
    this.dead = false;
  }

  update(dt, showTail = true) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    if (this.previousStates.length > TAIL_SIZE) {
      this.previousStates.shift();
    }

    if (showTail) {
      this.previousStates.push({ ...this.position });
    }
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
