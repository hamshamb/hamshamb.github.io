import type { BlogPost } from "../blog";

/**
 * Every technical claim here is checked against the Rivet repository's own docs
 * (README, docs/PROTOCOL.md, docs/RADIO.md, docs/THREAT_MODEL.md, docs/FIELD_TESTING.md).
 * If Rivet changes, change this post with it.
 */
export const rivetPost: BlogPost = {
  slug: "why-i-made-rivet",
  title: "why i made Rivet.",
  dek: "private messaging that keeps moving even when the internet doesn't.",
  eyebrow: "build log / networking / privacy",
  description:
    "why i started building Rivet, a private messenger where nearby phones carry encrypted messages for each other, and what that one question turned into.",
  publishedOn: "2026-09-12",
  tags: ["privacy", "networking", "bluetooth", "protocols", "build log"],
  project: "rivet",
  blocks: [
    { type: "lede", text: "i did not start Rivet because i thought the world needed another messaging app. it has enough of those." },
    { type: "p", text: "the question that kept bothering me was smaller: what happens to a conversation when the infrastructure disappears?" },
    {
      type: "lines",
      lines: ["no mobile data.", "no Wi-Fi.", "no server to ask where somebody is.", "no account system.", "no convenient cloud sitting in the middle."],
    },
    { type: "p", text: "the two phones are still physically there, a few metres apart. so why should they suddenly have nothing to say to each other?" },
    { type: "p", text: "that question became Rivet." },
    {
      type: "figure",
      figure: "rivet-route",
      caption: "a message leaves the sender, hops through two phones that cannot read it, and reaches the recipient. hover or tab through the phones to see what each one is allowed to do.",
    },

    { type: "h2", index: "01", text: "the annoying question." },
    { type: "p", text: "almost every messenger i use works the same way underneath, and for good reasons. you have an account. a server knows how to find you. your phone talks to the internet, the internet talks to the server, the server talks to the other phone." },
    { type: "p", text: "that design is fine. it is fast, it scales, and most of the time the internet is just there. Rivet is not a protest against it. it is what happens if you take one assumption away and look at what is left." },
    { type: "p", text: "so the starting constraint was: no server and no internet. the only thing you can count on is that phones exist and some of them are near each other. what if the phones are the network?" },

    { type: "h2", index: "02", text: "no account was part of the point." },
    { type: "p", text: "if there is no server, there is nothing to sign up to. no phone number, no email, no username sitting in a database somewhere. that ended up being one of my favourite parts of the design rather than a limitation." },
    { type: "p", text: "the thing i had to untangle was the difference between an identity and an account. an account is something a service gives you and can take away. an identity, in Rivet, is a set of keys your phone generates for itself. nobody issues it, and nobody keeps a list of them." },
    { type: "aside", label: "the difference", text: "an account is a row in someone else's database. an identity here is a key that lives on your phone." },
    { type: "p", text: "which means contacts have to be exchanged on purpose. you show a QR code or paste a code, in person or through a channel you already trust. then you can compare a 60-digit safety number with the other person, so you both know the key you saved really belongs to them and not to someone in the middle." },

    { type: "h2", index: "03", text: "Bluetooth sounded simple." },
    { type: "lines", lines: ["at first Bluetooth felt like the easy part.", "there are two phones.", "they are nearby.", "Bluetooth exists.", "problem solved."] },
    { type: "p", text: "it was not problem solved." },
    { type: "p", text: "Bluetooth Low Energy has two roles. a peripheral advertises that it exists and waits to be found. a central scans and connects. a mesh needs every phone to find others and be found, so every Rivet phone does both at once: it runs a GATT server while it scans for everyone else." },
    { type: "p", text: "then the platforms get involved. Android lets Rivet keep relaying in the background through Relay Mode, a foreground service you start yourself, with a notification that says it is running and a button to stop it. iOS is stricter. in the background, scanning slows down and gets filtered, the advertisement carries less, callbacks arrive late, and the system can end the app when it wants the resources back. there is no real iOS equivalent of Relay Mode." },
    { type: "p", text: "and nothing holds still. people walk in and out of range, connections drop halfway through a transfer, and every message has to be split into frames small enough for the radio and put back together on the other side. a surprising amount of Rivet is just staying calm about things not working." },

    { type: "h2", index: "04", text: "the phones became the network." },
    { type: "p", text: "this is the part that made it interesting. if the recipient is not nearby right now, the message does not fail. it waits, and other phones can help." },
    { type: "p", text: "every phone running Rivet can:" },
    {
      type: "list",
      items: [
        "receive an encrypted envelope it cannot read,",
        "keep it for a while,",
        "offer it to the next phone it meets,",
        "throw it away when it expires,",
        "and, if it happens to be the recipient, open it.",
      ],
    },
    { type: "p", text: "this is store-and-forward (or carry-and-forward, which is more honest, because the message is literally carried around in people's pockets until it gets close enough to where it is going)." },
    { type: "p", text: "nothing stays forever. an envelope lives on any one device for at most six hours, whatever its sender asked for, and it can pass through at most six hops. after that it is gone." },
    {
      type: "figure",
      figure: "relay-playground",
      caption: "a conceptual simulation, not real Bluetooth. move phones in and out of range and watch one envelope wait, spread, and either arrive or expire.",
    },
    {
      type: "figure",
      figure: "courier",
      caption: "a small game about the same idea, also a conceptual simulation and not real Bluetooth behaviour. carry a message to someone out of range before every copy expires.",
    },

    { type: "h2", index: "05", text: "why there is no routing table." },
    { type: "p", text: "the obvious way to make this efficient is routing: keep track of which phones see which other phones, build up a map, and send each message along the best path." },
    { type: "p", text: "i did not want that map to exist. a routing table that is good at delivering messages is also a pretty good record of who is near whom, and how often. that is exactly the kind of information i would rather a messenger never collected." },
    { type: "p", text: "so Rivet uses a bounded epidemic instead. when two phones meet, each offers a shuffled, capped list of the envelope ids it is carrying, the other asks for the ones it does not have, and they hand them over. no phone builds a picture of the network. every unexpired envelope just keeps moving, inside the six-hour and six-hop limits." },
    { type: "p", text: "the cost is real. spreading copies spends more bandwidth and more battery than a clever route would. and it is not invisibility either: a phone you connect to can still see which envelope ids you offered. it is a trade, made on purpose." },

    { type: "h2", index: "06", text: "what actually travels." },
    { type: "p", text: "every envelope starts with a small plaintext header that relays need in order to do their job. everything else is sealed." },
    {
      type: "figure",
      figure: "envelope",
      caption: "the parts of a sealed envelope, as defined in Rivet's protocol notes. select a part to see what it is for.",
    },
    { type: "p", text: "the header holds a random id, a creation time rounded down to the minute, a requested lifetime, a hop count and a hop limit, plus a version and type so it can be parsed at all. the sender's keys and signature are inside the encrypted part, not next to it. payloads are padded up to fixed bucket sizes so a message's length gives less away." },

    { type: "h2", index: "07", text: "encryption was not the end of the threat model." },
    { type: "p", text: "the cryptography is what people ask about first, so: identities are Ed25519 keys, key agreement uses X25519, keys are derived with HKDF-SHA256, and messages are sealed with XChaCha20-Poly1305. none of it is homemade; it comes from established libraries, not from anything i invented." },
    { type: "p", text: "but encryption only protects what is inside the envelope. writing the threat model was mostly a long list of things it does not fix." },
    {
      type: "figure",
      figure: "threat-model",
      caption: "what Rivet is designed to protect, next to what it explicitly does not. select an item for the detail.",
    },
    { type: "p", text: "a phone with Bluetooth on is announcing that a device is physically present, whatever it is sending. Rivet rotates the random tag it advertises every fifteen minutes, but a radio is still a radio. if someone has your phone unlocked, they have your messages. emergency reset deletes data and keys, but it cannot promise a forensic tool will never find a trace." },
    { type: "p", text: "i would rather write that down than let anyone assume otherwise." },

    { type: "h2", index: "08", text: "the feature list got weird." },
    { type: "p", text: "once envelopes could travel through strangers' phones, other things fell out of the same machinery almost by accident." },
    { type: "p", text: "circles came from wanting to message a small group without a server keeping a member list, so a circle is just a list on your phone, and each person gets their own sealed copy. channels came next: a shared passphrase, no owner, no admin, and anyone who knows the words can read and write. nearby broadcast is the deliberately public one, readable by anyone around you, because sometimes that is what you want and the app should say so plainly." },
    { type: "p", text: "the delivery states had to be honest too. Rivet shows waiting, in mesh and delivered. in mesh means another phone told yours it took a copy. it does not mean the recipient has it, and the app never pretends it does." },
    { type: "p", text: "and then the ones i did not see coming: an emergency reset, six languages (English, Hindi, Bengali, Marathi, Telugu and Tamil), and light, dark and system themes. none of them were part of the original idea. all of them seemed obviously necessary the moment i imagined someone actually using it." },

    { type: "h2", index: "09", text: "things Rivet deliberately does not do." },
    { type: "p", text: "version 1 does not do internet messaging, cloud sync, attachments, voice, video or synchronized group chat." },
    { type: "p", text: "every one of those is reasonable to want. every one of them would also pull in a server, a much bigger attack surface, or a protocol problem i am not ready to solve properly. keeping the scope small is the only way i can make honest statements about what is left." },

    { type: "h2", index: "10", text: "where it is right now." },
    {
      type: "list",
      items: [
        "version 1 is pre-release.",
        "the automated suite is green and the protocol is frozen for version 1.",
        "physical-device field testing has not been done. the field-test plan exists; none of its scenarios have been run yet.",
        "there has been no independent security review.",
      ],
    },
    { type: "p", text: "those last two matter. a messenger that has not been tested on real phones in real places, and has not been reviewed by someone whose job is to break it, should not be trusted with anything important yet. it is not released because it is not ready, and i would rather say that clearly than blur it." },
    { type: "figure", figure: "rivet-path", caption: "roughly how the project moved. years only, because the early parts never had release dates." },

    { type: "h2", index: "11", text: "what building it changed." },
    { type: "p", text: "Rivet started as one small question and turned into Bluetooth, cryptography, protocol design, state machines, unreliable transport, threat modelling, native Swift and Kotlin modules, and a long education in how differently two phone platforms behave when asked to do the same thing." },
    { type: "p", text: "it is also the project that taught me to write down what something does not do with the same care as what it does." },
    { type: "p", text: "Rivet still has a lot to prove. that is probably why i am still interested in it." },
    { type: "p", text: "it stopped being \"a messenger without the internet\" a while ago. now it is mostly a long-running answer to the question that started it:" },
    { type: "lede", text: "how much infrastructure does a conversation actually need?" },
    { type: "aside", label: "more", text: "the how-it-works version, with the full feature list and limits, is on the [Rivet case study](/work/rivet)." },
  ],
};
