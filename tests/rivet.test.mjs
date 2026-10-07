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

test("three is only imported by the scene modules, and only dynamically", () => {
  // one 3D stack: the Rivet scenes share three-kit.ts; the cube lab has its own single module
  const sceneModules = ["components/rivet/scene3d.ts", "components/rivet/envelope3d.ts", "components/rivet/three-kit.ts", "components/cube/three-cube.ts"];
  for (const path of files("components/").concat(files("lib/"), files("app/"))) {
    if (!/\.(ts|tsx)$/.test(path)) continue;
    const text = read(path);
    const importsThree = /from\s+["']three["']|import\(\s*["']three["']\s*\)/.test(text);
    assert.equal(importsThree, sceneModules.includes(path), `${path} imports three`);
  }
  assert.ok(read("components/rivet/useScene.ts").includes('await import("./scene3d")'));
  assert.ok(read("components/rivet/EnvelopeFigure.tsx").includes('await import("./envelope3d")'));
  for (const path of ["components/rivet/scene3d.ts", "components/rivet/envelope3d.ts"]) {
    const scene = read(path);
    assert.doesNotMatch(scene, /shadowMap\.enabled\s*=\s*true|EffectComposer|PMREMGenerator|RGBELoader|GLTFLoader|\.glb|\.hdr/, `${path}: no shadow maps, postprocessing, environment maps or models`);
    assert.ok(scene.includes("createRenderer("), `${path} uses the shared renderer setup`);
    assert.ok(scene.includes("dispose()"));
  }
  assert.ok(read("components/rivet/three-kit.ts").includes("Math.min(window.devicePixelRatio || 1, 1.5)"), "pixel ratio is clamped to 1.5");
});

test("every scene says what it is", () => {
  for (const path of ["components/rivet/RelayStage.tsx", "components/rivet/EnvelopeFigure.tsx", "components/blog/RouteFigure.tsx"]) {
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

test("the envelope's numbers are sums of the documented fields, nothing measured", async () => {
  const { parts } = await import("../components/rivet/envelope-fields.ts");
  const { envelopeModel, meeting, missing } = await import("../components/rivet/envelope-model.ts");
  const model = envelopeModel(parts);
  assert.equal(model.headerBytes, 4 + 16 + 6 + 4 + 2 + 2, "a relay reads the header and only the header");
  assert.equal(model.outerBytes, 32 + 24);
  assert.equal(model.sealedFixedBytes, 128);
  assert.equal(model.fixedBytes, 218);
  assert.equal(model.offerBytes, meeting.offered.length * 16, "offers are envelope ids");
  assert.deepEqual(missing, ["a3f1", "e5b2"]);
});

test("every documented field has a physical piece, and no piece invents a field", async () => {
  const { parts } = await import("../components/rivet/envelope-fields.ts");
  const { fieldPieces, pieceField, PIECES, STRUCTURAL, unmappedFields } = await import("../components/rivet/envelope-parts.ts");
  assert.deepEqual(unmappedFields(parts), [], "a field with no piece");
  const ids = parts.map((part) => part.id);
  assert.deepEqual(Object.keys(fieldPieces).sort(), [...ids].sort(), "the mapping covers exactly the documented fields");
  for (const [field, pieces] of Object.entries(fieldPieces)) for (const piece of pieces) assert.ok(PIECES.includes(piece), `${field} points at ${piece}`);
  for (const piece of PIECES) {
    if (STRUCTURAL.includes(piece)) continue;
    const field = pieceField[piece];
    assert.ok(field && ids.includes(field), `${piece} stands for no documented field`);
  }
});

test("selection stays in step: a field lights its pieces, and each piece selects back to a field that owns it", async () => {
  const { fieldPieces, pieceField } = await import("../components/rivet/envelope-parts.ts");
  for (const [piece, field] of Object.entries(pieceField)) {
    if (piece === "header") continue; // the label itself selects the magic bytes printed on it
    assert.ok(fieldPieces[field].includes(piece), `${piece} selects ${field}, which does not light it`);
  }
  const figure = read("components/rivet/EnvelopeFigure.tsx");
  const explorer = read("components/blog/EnvelopeExplorer.tsx");
  assert.ok(figure.includes("hover: (field) => events.current.onHover(field)"), "hovering a piece reports its field");
  assert.ok(figure.includes("select: (field) => events.current.onSelect(field)"), "clicking a piece selects its field");
  assert.ok(explorer.includes("onMouseEnter={() => setHovered(item.id)}"), "hovering a row lights the piece");
  assert.ok(explorer.includes("data-hover={hovered === item.id"), "the row lights when its piece is hovered");
  assert.ok(explorer.includes("onFocus={() => setHovered(item.id)}"), "the keyboard list drives the 3D state too");
});

test("pack, seal, relay and open each end in a coherent state", async () => {
  const { nextStage, stageEnd, STAGES, ROUTE_STOPS } = await import("../components/rivet/envelope-parts.ts");
  assert.deepEqual([...STAGES], ["pack", "seal", "relay", "open"]);
  assert.deepEqual(STAGES.map(nextStage), ["seal", "relay", "open", "pack"], "play next goes round");
  const pack = stageEnd("pack");
  assert.equal(pack.cipher.message, 0, "packing: readable");
  assert.equal(pack.inside, 0);
  assert.equal(pack.seal, 0);
  const seal = stageEnd("seal");
  assert.deepEqual(seal.cipher, { sender: 1, message: 1, padding: 1 }, "sealed: everything inside is encrypted");
  assert.equal(seal.fold, 1);
  assert.equal(seal.inside, 1);
  assert.equal(seal.flap, 0);
  assert.equal(seal.seal, 1);
  const relay = stageEnd("relay");
  assert.deepEqual(relay.cipher, seal.cipher, "relays never see the letter opened");
  assert.equal(relay.seal, 1);
  assert.equal(relay.hops, ROUTE_STOPS, "sender, relay a, relay b, recipient: three hops");
  assert.ok(relay.hops <= 6);
  const open = stageEnd("open");
  assert.deepEqual(open.cipher, { sender: 0, message: 0, padding: 0 }, "the recipient reads it");
  assert.equal(open.flap, 1);
  assert.equal(open.seal, 0);
  assert.equal(open.apart, 1, "the padding falls away from the message");
});

test("the exploded view moves every field piece on its own, less on a phone", async () => {
  const { explodedPose, PIECES } = await import("../components/rivet/envelope-parts.ts");
  const moves = new Set();
  for (const id of PIECES) {
    const pose = explodedPose(id, false);
    const travel = Math.hypot(pose.x, pose.y, pose.z) + Math.abs(pose.rx) + Math.abs(pose.ry) + Math.abs(pose.rz);
    if (id === "shell") assert.equal(travel, 0, "the shell is the fixed point");
    else {
      assert.ok(travel > 0, `${id} does not move when exploded`);
      moves.add(JSON.stringify(pose));
    }
    const phone = explodedPose(id, true);
    assert.ok(Math.hypot(phone.x, phone.y, phone.z) <= Math.hypot(pose.x, pose.y, pose.z) + 1e-9, `${id} moves further on a phone`);
  }
  assert.equal(moves.size, PIECES.length - 1, "two pieces share one movement");
  const figure = read("components/rivet/EnvelopeFigure.tsx");
  assert.ok(figure.includes("order.forEach((id, i) =>"), "pieces are staggered one by one");
});

test("reduced motion gets a still, exploded envelope and no idle sway", async () => {
  const { initialView } = await import("../components/rivet/envelope-parts.ts");
  assert.deepEqual(initialView(true), { stage: "seal", exploded: true });
  assert.deepEqual(initialView(false), { stage: "seal", exploded: false });
  const figure = read("components/rivet/EnvelopeFigure.tsx");
  const still = figure.indexOf("// reduced motion: the envelope already taken apart");
  const sway = figure.indexOf("const sway = animate(rig, { idle");
  assert.ok(still > 0 && sway > still, "the reduced-motion branch returns before any idle animation exists");
  assert.ok(/if \(reducedMotion\(\)\) \{\s+snap\(rig, target, open\);\s+return;/.test(figure), "stage changes jump instead of animating");
});

test("the envelope scene cleans up after itself, and there is one renderer per scene", () => {
  const scene = read("components/rivet/envelope3d.ts");
  for (const cleanup of ["resizer.disconnect()", "theme.disconnect()", "renderer.forceContextLoss()", "canvas.remove()", "disposables.forEach((item) => item.dispose())", 'canvas.removeEventListener("pointerdown", onDown)']) {
    assert.ok(scene.includes(cleanup), `missing cleanup: ${cleanup}`);
  }
  assert.ok(scene.includes("if (!raf && running && !disposed)"), "renders only on demand, only while running");
  const lazy = read("components/rivet/useScene.ts");
  assert.ok(lazy.includes("scene?.dispose()"));
  assert.ok(/if \(disposed\) \{\s+created\.dispose\(\);/.test(lazy), "a scene that finishes loading after unmount is disposed at once");
  const count = files("components/rivet/").filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => (read(path).match(/new THREE\.WebGLRenderer/g) ?? []).length);
  assert.equal(count.reduce((a, b) => a + b, 0), 1, "the Rivet scenes create their renderer in one place");
});

test("the figure explains packing, padding and sealing, and never claims compression", () => {
  for (const path of ["components/rivet/EnvelopeFigure.tsx", "components/rivet/envelope-parts.ts", "components/rivet/envelope3d.ts", "components/blog/EnvelopeExplorer.tsx"]) {
    assert.doesNotMatch(read(path), /compress/i, `${path} mentions compression`);
  }
  const parts = read("components/rivet/envelope-parts.ts");
  for (const word of ["pack", "padding", "seal", "relay", "open"]) assert.match(parts, new RegExp(word));
  assert.ok(!existsSync(new URL("components/rivet/EnvelopeInstrument.tsx", root)), "the byte dial is gone");
  const post = built("blog/why-i-made-rivet.html");
  if (post) {
    assert.match(post, /class="envx"/);
    assert.doesNotMatch(post, /env-tick|class="env"/, "no dial in the page");
  }
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
