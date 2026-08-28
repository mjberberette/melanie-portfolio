"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);

  CustomEase.create("mb-out", "0.16, 1, 0.3, 1");
  CustomEase.create("mb-in-out", "0.76, 0, 0.24, 1");

  gsap.defaults({ ease: "mb-out", duration: 1 });
}

export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
