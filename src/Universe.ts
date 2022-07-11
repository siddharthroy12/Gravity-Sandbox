import Vector2 from "./Vector2";
import Body from './Body';
import {rectCircleCollition} from './helper';

function gravity(G:number, m1:number, m2:number, dist:number) {
    return (G * m1 * m2) / ((dist * dist) + 9000);
}

type History = {
  type: "add" | "delete",
  bodies: Body[];
}

export default class Universe {
  bodies: Body[] = [];
  previousPlacedCoords = {};
  lastAddedBody = [];
  lastRemovedBody = [];
  undoHistory: History[] = [];
  redoHistory: History[] = [];
  selectedBodies = new WeakMap<Body, boolean>();
  G:number;

  selectBodies(startPos: {x:number, y:number}, endPos: {x:number, y:number}) {
    this.selectedBodies = new WeakMap();

    this.bodies.forEach(body => {
      const rect = {x: startPos.x, y: startPos.y, w: endPos.x - startPos.x, h: endPos.y - startPos.y};
      const circle = {x: body.position.x, y: body.position.y, r: body.size};

      if (rectCircleCollition(circle, rect)) {
        this.selectedBodies.set(body, true);
      }
    })
  }

  deleteSelectedBodies() {
    const bodies = [];

    this.bodies.forEach(body => {
      if (this.selectedBodies.get(body)) {
        bodies.push(body);
      }
    });

    this.undoHistory.push({type: "delete", bodies})

    this.bodies = this.bodies.filter(body => !this.selectedBodies.get(body));
  }

  addBody(b: Body, x:number, y:number) {
    if (!this.previousPlacedCoords[`${x}:${y}`]) {
      b.position.set(x, y);

      this.bodies.push(b);

      this.undoHistory.push({
        type: "add",
        bodies:[b]
      });

      this.previousPlacedCoords[`${x}:${y}`] = true;
    }
  }

  undoLastPlacedBody() {
    if (this.undoHistory.length) {
      const lastAction = this.undoHistory[this.undoHistory.length-1];

      switch (lastAction.type) {
        case "add":
          this.bodies = this.bodies.filter(body => !lastAction.bodies.includes(body));
          break;
        case "delete":
          this.bodies = [...this.bodies, ...lastAction.bodies];
          break;
      }

      this.redoHistory.push(this.undoHistory.pop());
    }
  }

  redoLastPlacedBody() {
    if (this.redoHistory.length) {
      const lastAction = this.redoHistory[this.redoHistory.length-1];

      switch (lastAction.type) {
        case "add":
          this.bodies = [...this.bodies, ...lastAction.bodies];
          break;
        case "delete":
          this.bodies = this.bodies.filter(body => !lastAction.bodies.includes(body));
          break;
      }

      this.undoHistory.push(this.redoHistory.pop());
    }
  }

  getBodyByPoint(x:number, y:number) {
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
    this.previousPlacedCoords = {};
  }

  update(dt:number) {
    this.previousPlacedCoords = {};
    // Calculate gravitational forces between all bodies. We need at least
    // two bodies to do this, of course.
    if (this.bodies.length > 1) {
      for (let i = 0; i < this.bodies.length; i++) {
        for (let j = 0; j < this.bodies.length; j++) {
          let b1 = this.bodies[i];
          let b2 = this.bodies[j];

          if (b1 !== b2) {
            let force = gravity(this.G, b1.mass, b2.mass, b1.distance(b2));
            let acceleration = new Vector2(b1.position);
            acceleration.subtract(b2.position);
            acceleration.normalize();
            acceleration.scale(force/b1.mass);
            b1.velocity.x -= acceleration.x * dt;
            b1.velocity.y -= acceleration.y * dt;
          }
        }
      }
    }

    // Remove dead bodies
    this.bodies = this.bodies.filter(body => !body.dead);

    // Move universe forward
    this.bodies.forEach(body => {
      body.update(dt);
    });
  }

  // Draw
  draw(context:CanvasRenderingContext2D, showTail: boolean) {
    this.bodies.forEach(body => {
      body.draw(context, showTail, this.selectedBodies.get(body))
    });
  }

  getStateJSON() {
    return JSON.stringify({bodies: this.bodies, G: this.G})
  }

  loadStateFromJSON(json: string) {
    const state = JSON.parse(json);
    this.bodies = state.bodies;
    this.G = state.G;
  }
}
