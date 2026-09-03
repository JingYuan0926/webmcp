export type Product = {
  id: string;
  name: string;
  price: number;
  tag: string;
  blurb: string;
  initials: string;
  hue: number;
  image: string;
  imageAlt: string;
};

export const catalog: Product[] = [
  {
    id: "wireless-mouse",
    name: "Wireless Mouse",
    price: 29.99,
    tag: "Desk",
    blurb: "Quiet clicks and a steady 2.4 GHz link.",
    initials: "WM",
    hue: 166,
    image: "/products/wireless-mouse.jpg",
    imageAlt: "Black wireless mouse on a dark studio surface",
  },
  {
    id: "usb-hub",
    name: "7-in-1 USB Hub",
    price: 59.99,
    tag: "Connect",
    blurb: "HDMI, card slots, and fast USB-C power delivery.",
    initials: "UH",
    hue: 205,
    image: "/products/usb-hub.jpg",
    imageAlt: "Compact USB-C hub with card and USB ports",
  },
  {
    id: "mech-keyboard",
    name: "Mechanical Keyboard",
    price: 129,
    tag: "Desk",
    blurb: "Tactile switches in a compact 75% layout.",
    initials: "MK",
    hue: 276,
    image: "/products/mech-keyboard.jpg",
    imageAlt: "Compact mechanical keyboard with colorful accent keys",
  },
  {
    id: "laptop-pro",
    name: "Laptop Pro",
    price: 1199,
    tag: "Computers",
    blurb: "A bright display and all-day power for serious work.",
    initials: "LP",
    hue: 226,
    image: "/products/laptop-pro.jpg",
    imageAlt: "Silver laptop open on a wooden desk",
  },
  {
    id: "usb-cable",
    name: "Braided USB-C Cable",
    price: 14.99,
    tag: "Connect",
    blurb: "A durable 1.5 m cable rated for 100 W charging.",
    initials: "UC",
    hue: 28,
    image: "/products/usb-cable.jpg",
    imageAlt: "Close-up of a USB-C charging cable",
  },
  {
    id: "webcam-hd",
    name: "Full HD Webcam",
    price: 79.99,
    tag: "Calls",
    blurb: "Clear 1080p video with a built-in privacy cover.",
    initials: "WC",
    hue: 341,
    image: "/products/webcam-hd.jpg",
    imageAlt: "Full HD webcam mounted on a computer monitor",
  },
  {
    id: "desk-speakers",
    name: "Compact Desk Speakers",
    price: 69.99,
    tag: "Audio",
    blurb: "Warm stereo sound from a small USB-powered pair.",
    initials: "DS",
    hue: 42,
    image: "/products/desk-speakers.jpg",
    imageAlt: "Compact desktop speaker beside a monitor",
  },
  {
    id: "noise-headphones",
    name: "Noise-Cancel Headphones",
    price: 199,
    tag: "Audio",
    blurb: "Focused listening with 40-hour battery life.",
    initials: "NH",
    hue: 187,
    image: "/products/noise-headphones.jpg",
    imageAlt: "Black over-ear headphones on a yellow backdrop",
  },
  {
    id: "portable-ssd",
    name: "Portable SSD",
    price: 109,
    tag: "Storage",
    blurb: "Fast pocket storage in a shock-resistant shell.",
    initials: "PS",
    hue: 151,
    image: "/products/portable-ssd.jpg",
    imageAlt: "Portable solid-state drive connected to a laptop",
  },
  {
    id: "monitor-stand",
    name: "Aluminium Monitor Stand",
    price: 79,
    tag: "Desk",
    blurb: "Raise your screen and keep small gear underneath.",
    initials: "MS",
    hue: 215,
    image: "/products/monitor-stand.jpg",
    imageAlt: "Wooden monitor stand organizing a desktop workspace",
  },
  {
    id: "smart-plug",
    name: "Wi-Fi Smart Plug",
    price: 24.99,
    tag: "Home",
    blurb: "Schedule a device and track power from your phone.",
    initials: "SP",
    hue: 96,
    image: "/products/smart-plug.jpg",
    imageAlt: "Smart plugs displayed in an electronics store",
  },
  {
    id: "laptop-sleeve",
    name: "Recycled Laptop Sleeve",
    price: 34.99,
    tag: "Carry",
    blurb: "Soft protection for laptops up to 14 inches.",
    initials: "LS",
    hue: 12,
    image: "/products/laptop-sleeve.jpg",
    imageAlt: "Gray felt laptop sleeve with a laptop partially inserted",
  },
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUSD(value: number): string {
  return usdFormatter.format(value);
}
