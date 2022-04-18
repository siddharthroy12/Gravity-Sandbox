export default class Vector2 {
  constructor(x, y) {
    if (y != null) {
      this.set(x, y);
    } else if (x != null) {
      this.set(x.x, x.y);
    } else {
      this.set(0, 0);
    }
  }

  set(x, y) {
    this.x  = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  distanceSquared(v) {
    let dx = v.x - this.x;
    let dy = v.y - this.y;
    return dx * dx + dy * dy;
  }

  distance(v) {
    return Math.sqrt(this.distanceSquared(v));
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.lengthSquared());
  }

  normalize() {
    let length = this.length();
    this.x /= length;
    this.y /= length;
  }

  rotate(angle) {
    const resultX = this.x * Math.cos(angle) - this.y * Math.sin(angle)
    const resultY = this.x * Math.sin(angle) + this.y * Math.cos(angle)
    this.x = resultX;
    this.y = resultY;
  }

}


