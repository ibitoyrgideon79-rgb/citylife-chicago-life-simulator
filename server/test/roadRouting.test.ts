import assert from "node:assert/strict";
import { test } from "node:test";
import { findRoadRoute } from "../src/roadRouting";

test("Uber route between the South Loop flat and Loop office follows OSM roads", () => {
  const start = { x: 950, z: 1250 };
  const destination = { x: -10, z: -60 };
  const route = findRoadRoute(start, destination);

  assert.ok(route, "expected a drivable route through the Greater Chicago road graph");
  assert.ok(route.points.length > 10, "expected the route to follow road junctions");
  assert.ok(route.distance > Math.hypot(destination.x - start.x, destination.z - start.z) + 100);
  assert.ok(Math.hypot(route.points[0].x - start.x, route.points[0].z - start.z) < 75);
  const last = route.points.at(-1)!;
  assert.ok(Math.hypot(last.x - destination.x, last.z - destination.z) < 25);
});
