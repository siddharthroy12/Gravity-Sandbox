import Vector2 from "./Vector2";
import { getRandomNiceColor } from './niceColors';

const TAIL_SIZE = 50;

export function mass2radius(mass: number) {
  return Math.log(mass) * 3.0;
}

export default class Body {
  mass: number;
  size: number;
  color: string;
  position: Vector2;
  velocity: Vector2;
  previousStates: ({x: number, y:number})[];
  dead: boolean;

  constructor(mass:number, color?: string) {
    this.mass = mass;
    this.size = mass2radius(mass);
    this.color = color != null ? color : getRandomNiceColor();
    this.position = new Vector2(0.0, 0.0);
    this.velocity = new Vector2(0.0, 0.0);
    this.previousStates = [];
    this.dead = false;
  }

  update(dt:number, showTail = true) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    if (this.previousStates.length > TAIL_SIZE && dt) {
      this.previousStates.shift();
    }

    if (showTail) {
      this.previousStates.push({ ...this.position });
    }
  }

  distance(b: Body) {
    return this.position.distance(b.position);
  }

  draw(context:CanvasRenderingContext2D, showTail: boolean, showBoundingBox:boolean) {
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
    context.fillStyle = this.color;
    context.fill();
    context.lineWidth = 2;

    if (this.previousStates.length < 2) {
      return;
    }

    // Draw tail
    if (showTail && this.previousStates.length > 2) {
      context.beginPath();
      for (let i = 1; i < this.previousStates.length; i++) {
        const currState = this.previousStates[i];
        const prevState = this.previousStates[i-1];
        context.moveTo(currState.x, currState.y);
        context.lineTo(prevState.x, prevState.y);
      }
      context.strokeStyle = this.color;
      context.stroke();
    }

    // Draw bounding box
    if (showBoundingBox) {
      context.strokeStyle = "white"
      context.strokeRect(
        this.position.x - this.size,
        this.position.y - this.size,
        this.size * 2,
        this.size * 2
      );
    }
  }
}
