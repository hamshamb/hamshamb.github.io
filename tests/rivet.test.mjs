import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import {
  COURIER_DEADLINE,
  COURIER_MAX_HOPS,
  earliestDelivery,
  FRIEND,
  handOver,
  inRange,
  newGame,
  options,
  positionOf,
  step,
  YOU,
} from "../lib/courier.ts";
import {
  MAX_HOPS,
  SCENE_GAP,
  SCENE_HALF,
  SCENE_RANGE,
  sceneHandOver,
  sceneInRange,
  sceneLinks,
  sceneMove,
  sceneStart,
} from "../lib/relay-sim.ts";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const built = (path) => (existsSync(new URL(`dist/client/${path}`, root)) ? read(`dist/client/${path}`) : "");

/* ------------------------------------------------------------ the spatial scene --- */

test("the scene starts with one gap, so the lesson is to close it", () => {
  const scene = sceneStart();
  assert.deepEqual(scene.copies, { sender: 0 });
  const links = sceneLinks(scene).map((pair) => pair.join("+"));
  assert.ok(links.includes("sender+relay-a"));
  assert.ok(links.includes("relay-b+recipient"));
  assert.ok(!links.includes("relay-a+relay-b"), "the middle gap is open at the start");
});

test("a relay stores a sealed copy and only the recipient delivers", () => {
  let scene = sceneStart();
  const first = sceneHandOver(scene, "relay-a", "sender");
  assert.equal(first.outcome, "stored");
  scene = first.scene;
  assert.equal(scene.copies["relay-a"], 1);
  assert.equal(scene.copies.sender, 0, "the sender keeps its copy");
  assert.equal(scene.delivered, false);
  assert.match(scene.note, /header, not the message/);
  const tooFar = sceneHandOver(scene, "relay-b", "relay-a");
  assert.equal(tooFar.outcome, "out-of-range");
  assert.equal(tooFar.scene.copies["relay-b"], undefined, "nothing moves without a connection");
  scene = sceneMove(scene, "relay-b", scene.phones.find((p) => p.id === "relay-a").x + SCENE_RANGE - 0.5, 0);
  assert.ok(sceneInRange(scene.phones.find((p) => p.id === "relay-a"), scene.phones.find((p) => p.id === "relay-b")));
  const second = sceneHandOver(scene, "relay-b", "relay-a");
  assert.equal(second.outcome, "stored");
  assert.equal(second.scene.copies["relay-b"], 2);
  scene = sceneMove(second.scene, "recipient", scene.phones.find((p) => p.id === "relay-b").x + 3, 0);
  const done = sceneHandOver(scene, "recipient", "relay-b");
  assert.equal(done.outcome, "delivered");
  assert.equal(done.scene.delivered, true);
  assert.ok(done.scene.copies.recipient <= MAX_HOPS);
});

test("dropping on nothing, or on a phone that already has it, changes no copies", () => {
  const scene = sceneStart();
  const nowhere = sceneHandOver(scene, null, "sender");
  assert.equal(nowhere.outcome, "nowhere");
  assert.deepEqual(nowhere.scene.copies, scene.copies);
  const twice = sceneHandOver(sceneHandOver(scene, "relay-a", "sender").scene, "relay-a");
  assert.equal(twice.outcome, "already");
});

test("without a named source the nearest phone in range hands it over", () => {
  const scene = sceneHandOver(sceneStart(), "relay-a").scene;
  assert.equal(scene.copies["relay-a"], 1);
  assert.equal(sceneHandOver(sceneStart(), "recipient").outcome, "out-of-range");
});

test("phones stay on the table and out of each other", () => {
  let scene = sceneStart();
  scene = sceneMove(scene, "sender", 99, 99);
  const sender = scene.phones.find((p) => p.id === "sender");
  assert.ok(Math.abs(sender.x) <= SCENE_HALF.x && Math.abs(sender.z) <= SCENE_HALF.z);
  const a = scene.phones.find((p) => p.id === "relay-a");
  scene = sceneMove(scene, "sender", a.x, a.z);
  const pushed = scene.phones.find((p) => p.id === "sender");
  assert.ok(Math.hypot(pushed.x - a.x, pushed.z - a.z) >= SCENE_GAP - 0.02, "phones cannot overlap");
});

/* ------------------------------------------------------------ the packet courier --- */

test("the courier is deterministic and every generated game can be won", () => {
  assert.deepEqual(newGame(5), newGame(5));
  for (let seed = 1; seed <= 25; seed += 1) {
    const game = newGame(seed);
    const earliest = earliestDelivery(game);
    assert.ok(earliest >= 7, `seed ${seed}: not an instant win`);
    assert.ok(earliest <= game.deadline - 7, `seed ${seed}: leaves time to react`);
    assert.equal(inRange(game, YOU, FRIEND), false, "the friend starts out of range");
    assert.deepEqual(game.copies, { [YOU]: 0 });
  }
});

test("positions move on every tick and stay on the track", () => {
  const game = newGame(3);
  for (const phone of game.phones) {
    const seen = new Set();
    for (let tick = 0; tick <= COURIER_DEADLINE; tick += 1) {
      const at = positionOf(phone, tick);
      assert.ok(at >= 0 && at <= 100);
      seen.add(at);
    }
    assert.ok(seen.size > 3, `${phone.id} drifts`);
  }
});

test("handing over needs a phone in range, keeps the old copy, and the friend wins it", () => {
  let game = newGame(3);
  assert.equal(handOver(game, FRIEND).copies[FRIEND], undefined, "cannot skip to the friend");
  assert.match(handOver(game, FRIEND).log.at(-1), /out of range/);
  // play the best strategy: take every copy that is on offer, then let a tick pass
  let guard = 0;
  while (game.status === "playing" && guard < 200) {
    guard += 1;
    for (let round = 0; round < 2; round += 1) {
      for (const option of options(game)) game = handOver(game, option.id);
    }
    if (game.status === "playing") game = step(game);
  }
  assert.equal(game.status, "won");
  assert.ok(game.copies[YOU] === 0, "the sender never loses its copy");
  assert.ok(game.copies[FRIEND] <= COURIER_MAX_HOPS);
  assert.ok(game.tick < game.deadline);
  assert.match(game.log.at(-1), /delivered/);
});

test("waiting too long expires every copy", () => {
  let game = newGame(4);
  for (let i = 0; i < COURIER_DEADLINE + 2; i += 1) game = step(game);
  assert.equal(game.status, "lost");
  assert.deepEqual(game.copies, {});
  assert.equal(step(game), game, "a finished game does not move");
  assert.equal(handOver(game, "relay-a"), game);
});

/* ------------------------------------------------------------- source hygiene --- */

function files(dir, found = []) {
  for (const name of readdirSync(new URL(dir, root))) {
    const path = `${dir}${name}`;
    if (statSync(new URL(path, root)).isDirectory()) files(`${path}/`, found);
    else found.push(path);
  }
  return found;
}

const mine = [...files("components/rivet/"), ...files("components/blog/"), "lib/courier.ts", "lib/relay-sim.ts", "app/rivet3d.css", "app/blog.css", "content/posts/why-i-made-rivet.ts"];

test("no em dashes, eval or raw HTML anywhere in the Rivet work", () => {
  for (const path of mine) {
    const text = read(path);
    assert.ok(!text.includes(String.fromCharCode(0x2014)), `${path} has an em dash`);
    assert.doesNotMatch(text, /\beval\s*\(|new Function\s*\(|innerHTML|outerHTML|insertAdjacentHTML/, `${path} builds markup from strings`);
    assert.doesNotMatch(text, /new Audio|AudioContext|\.play\(\)/, `${path} makes sound`);
  }
});

test("three is only imported by the two scene modules, and only dynamically", () => {
  // one 3D stack: the Rivet scenes and the cube lab each have one module that touches three
  const sceneModules = ["components/rivet/scene3d.ts", "components/cube/three-cube.ts"];
  for (const path of files("components/").concat(files("lib/"), files("app/"))) {
    if (!/\.(ts|tsx)$/.test(path)) continue;
    const text = read(path);
    const importsThree = /from\s+["']three["']|import\(\s*["']three["']\s*\)/.test(text);
    assert.equal(importsThree, sceneModules.includes(path), `${path} imports three`);
  }
  const hook = read("components/rivet/useScene.ts");
  assert.match(hook, /await import\("\.\/scene3d"\)/);
  const scene = read("components/rivet/scene3d.ts");
  assert.doesNotMatch(scene, /shadowMap\.enabled\s*=\s*true|EffectComposer|PMREMGenerator|RGBELoader/, "no shadow maps, postprocessing or environment maps");
  assert.match(scene, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)/, "pixel ratio is clamped to 1.5");
  assert.match(scene, /dispose\(\)/);
});

test("every scene says what it is", () => {
  for (const path of ["components/rivet/RelayStage.tsx", "components/rivet/EnvelopeInstrument.tsx", "components/blog/RouteFigure.tsx"]) {
    assert.match(read(path), /conceptual visualization/, `${path} is labelled`);
  }
  assert.match(read("components/rivet/PacketCourier.tsx"), /conceptual simulation/);
  assert.match(read("components/rivet/RelayStage.tsx"), /not real Bluetooth in the browser/);
  assert.match(read("components/rivet/PacketCourier.tsx"), /not real Bluetooth behaviour/);
  assert.match(read("components/rivet/RelayStage.tsx"), /achieve\("network-engineer"\)/);
  assert.match(read("components/rivet/PacketCourier.tsx"), /discover\("packet-courier"\)/);
  assert.match(read("components/rivet/PacketCourier.tsx"), /unlockToy\("courier"\)/);
});

test("the x-ray only lists fields the protocol notes document", () => {
  const fields = read("components/rivet/envelope-fields.ts");
  for (const name of ["magic + version + type", "envelope id", "created at", "lifetime", "hop count + max hops", "payload length", "ephemeral public key", "nonce", "sender keys + signature", "message body + padding"]) {
    assert.ok(fields.includes(`"${name}"`), name);
  }
  assert.doesNotMatch(fields, /range|latency|throughput|battery|metres|meters/i, "no invented radio numbers");
});

/* --------------------------------------------------------------- built output --- */

test("the post has the courier, the scenes' honesty labels, and no scene code on the home page", () => {
  const post = built("blog/why-i-made-rivet.html");
  const home = built("index.html");
  assert.ok(post && home, "build first: npm run build");
  assert.match(post, /id="courier"/);
  assert.match(post, /conceptual simulation/);
  assert.match(post, /conceptual visualization/);
  assert.match(post, /not real Bluetooth/);
  assert.match(post, /class="rivet-path"/, "the progression is static HTML");
  assert.doesNotMatch(home, /scene3d|PacketCourier|RelayStage|RouteStage|EnvelopeStage/);
  const caseStudy = built("work/rivet.html");
  assert.match(caseStudy, /conceptual visualization/);
  assert.match(caseStudy, /move the phones/);
  assert.doesNotMatch(built("work/nexus.html"), /conceptual visualization/, "the scene is Rivet only");
});

test("the envelope instrument is arithmetic on the documented fields, nothing measured", async () => {
  const { parts } = await import("../components/rivet/envelope-fields.ts");
  const { envelopeModel, bars, stations, MAX_HOPS, meeting, missing } = await import("../components/rivet/envelope-model.ts");
  const model = envelopeModel(parts);
  assert.equal(model.headerBytes, 4 + 16 + 6 + 4 + 2 + 2, "a relay reads the header and only the header");
  assert.equal(model.outerBytes, 32 + 24);
  assert.equal(model.sealedFixedBytes, 128);
  assert.equal(model.fixedBytes, 218);
  assert.equal(model.ticks.length, model.fixedBytes, "one tick per real byte");
  assert.equal(model.offerBytes, meeting.offered.length * 16, "offers are envelope ids");
  assert.deepEqual(missing, ["a3f1", "e5b2"]);
  for (let i = 1; i < model.ticks.length; i += 1) assert.ok(model.ticks[i].angle > model.ticks[i - 1].angle, "ticks run clockwise");
  assert.ok(model.ticks.at(-1).angle < 270, "the ring closes without overlapping");
  assert.equal(stations.length, MAX_HOPS + 1);
  assert.ok(bars.some((bar) => bar.padding) && bars.some((bar) => !bar.padding), "the opened body shows message and padding");
  const source = read("components/rivet/EnvelopeInstrument.tsx");
  assert.doesNotMatch(source, /\bms\b.*latency|kbps|mbps|battery life|throughput/i, "no invented performance numbers");
});

test("the looping Rivet scene waits, travels phone to phone, rests and starts again", async () => {
  const { loopProgress } = await import("../components/rivet/loop.ts");
  assert.equal(loopProgress(0), 0);
  assert.equal(loopProgress(0.28), 1 / 3, "stops at the first relay");
  assert.equal(loopProgress(0.52), 2 / 3, "stops at the second relay");
  assert.equal(loopProgress(0.9), 1, "rests at the recipient");
  assert.equal(loopProgress(1), 0, "and starts over");
  let last = 0;
  for (let t = 0; t < 0.99; t += 0.005) {
    const p = loopProgress(t);
    assert.ok(p >= last - 1e-9, "never travels backwards within a cycle");
    last = p;
  }
});

test("the case study demo plays the real rules and always delivers", async () => {
  const { relayDemo } = await import("../components/rivet/loop.ts");
  const { sceneStart, sceneHandOver, sceneMove } = await import("../lib/relay-sim.ts");
  let scene = sceneStart();
  const outcomes = [];
  for (const step of relayDemo) {
    if (step.kind === "move") scene = sceneMove(scene, step.id, step.x, step.z);
    if (step.kind === "hand") {
      const result = sceneHandOver(scene, step.to);
      outcomes.push(result.outcome);
      scene = result.scene;
    }
    if (step.kind === "reset") break;
  }
  assert.deepEqual(outcomes, ["stored", "stored", "delivered"], "every scripted hand-over is legal under the same rules a visitor plays by");
  assert.equal(scene.delivered, true);
  assert.equal(sceneHandOver(sceneStart(), "relay-b").outcome, "out-of-range", "the demo has to move a phone, which is the point");
  assert.equal(relayDemo.at(-1).kind, "reset", "and it loops");
});
