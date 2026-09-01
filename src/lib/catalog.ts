export type Product = {
  id: string;
  name: string;
  price: number;
  tag: string;
  blurb: string;
  initials: string;
  hue: number;
};

export const catalog: Product[] = [
  {
    id: "wireless-mouse",
    name: "Wireless Mouse",
    price: 49,
    tag: "Desk",
    blurb: "Quiet clicks and a steady 2.4 GHz link.",
    initials: "WM",
    hue: 166,
  },
  {
    id: "usb-hub",
    name: "7-in-1 USB Hub",
    price: 89,
    tag: "Connect",
    blurb: "HDMI, card slots, and fast USB-C power delivery.",
    initials: "UH",
    hue: 205,
  },
  {
    id: "mech-keyboard",
    name: "Mechanical Keyboard",
    price: 189,
    tag: "Desk",
    blurb: "Tactile switches in a compact 75% layout.",
    initials: "MK",
    hue: 276,
  },
  {
    id: "laptop-pro",
    name: "Laptop Pro 14",
    price: 2499,
    tag: "Computers",
    blurb: "A bright display and all-day power for serious work.",
    initials: "LP",
    hue: 226,
  },
  {
    id: "usb-cable",
    name: "Braided USB-C Cable",
    price: 15,
    tag: "Connect",
    blurb: "A durable 1.5 m cable rated for 100 W charging.",
    initials: "UC",
    hue: 28,
  },
  {
    id: "webcam-hd",
    name: "Full HD Webcam",
    price: 129,
    tag: "Calls",
    blurb: "Clear 1080p video with a built-in privacy cover.",
    initials: "WC",
    hue: 341,
  },
  {
    id: "desk-speakers",
    name: "Compact Desk Speakers",
    price: 99,
    tag: "Audio",
    blurb: "Warm stereo sound from a small USB-powered pair.",
    initials: "DS",
    hue: 42,
  },
  {
    id: "noise-headphones",
    name: "Noise-Cancel Headphones",
    price: 399,
    tag: "Audio",
    blurb: "Focused listening with 40-hour battery life.",
    initials: "NH",
    hue: 187,
  },
  {
    id: "portable-ssd",
    name: "Portable SSD 1 TB",
    price: 449,
    tag: "Storage",
    blurb: "Fast pocket storage in a shock-resistant shell.",
    initials: "PS",
    hue: 151,
  },
  {
    id: "monitor-stand",
    name: "Aluminium Monitor Stand",
    price: 119,
    tag: "Desk",
    blurb: "Raise your screen and keep small gear underneath.",
    initials: "MS",
    hue: 215,
  },
  {
    id: "smart-plug",
    name: "Wi-Fi Smart Plug",
    price: 35,
    tag: "Home",
    blurb: "Schedule a device and track power from your phone.",
    initials: "SP",
    hue: 96,
  },
  {
    id: "laptop-sleeve",
    name: "Recycled Laptop Sleeve",
    price: 25,
    tag: "Carry",
    blurb: "Soft protection for laptops up to 14 inches.",
    initials: "LS",
    hue: 12,
  },
];

export function formatRM(value: number): string {
  return `RM ${value.toFixed(2)}`;
}

