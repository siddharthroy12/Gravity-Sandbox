type Circle =  {
  x: number;
  y: number;
  r: number;
}

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectCircleCollition(circle: Circle, rect: Rect){
    if (rect.w < 0) {
      rect.x = rect.x + rect.w;
      rect.w = Math.abs(rect.w);
    }

    if (rect.h < 0) {
      rect.y = rect.y + rect.h;
      rect.h = Math.abs(rect.h);
    }

    const distX = Math.abs(circle.x - rect.x-rect.w/2);
    const distY = Math.abs(circle.y - rect.y-rect.h/2);

    if (distX > (rect.w/2 + circle.r)) { return false; }
    if (distY > (rect.h/2 + circle.r)) { return false; }

    if (distX <= (rect.w/2)) { return true; }
    if (distY <= (rect.h/2)) { return true; }

    const dx=distX-rect.w/2;
    const dy=distY-rect.h/2;
    return (dx*dx+dy*dy<=(circle.r*circle.r));
}
