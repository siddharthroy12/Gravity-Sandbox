export default class Vector2 {
  x: number;
  y: number;

  constructor(x:number|Vector2, y?:number) {
    if (x instanceof Vector2) {
      this.set(x.x, x.y);
    } else if (typeof x === "number") {
      if (y !== null) {
        this.set(x, y);
      } else {
        this.set(x, x);
      }
    }
  }

  set(x:number, y:number) {
    this.x = x;
    this.y = y;
  }

  add(v:Vector2) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subtract(v:Vector2) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s:number) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  distance(v:Vector2) {
    const dx = v.x - this.x;
    const dy = v.y - this.y;

    return Math.sqrt((dx * dx) + (dy * dy))
  }

  length() {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }

  normalize() {
    const length = this.length();
    this.x /= length;
    this.y /= length;
  }

  rotate(angle:number) {
    const resultX = this.x * Math.cos(angle) - this.y * Math.sin(angle)
    const resultY = this.x * Math.sin(angle) + this.y * Math.cos(angle)
    this.x = resultX;
    this.y = resultY;
  }
}


