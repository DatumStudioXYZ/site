export const processSteps = [
  {
    number: "01", title: "Understand",
    summary: "We begin with people: how you live, where friction appears, and what a better day should feel like.",
    description: "Every project starts with a conversation. Not about materials or budgets, but about life. How does your morning begin? Where does the day break down? What frustrates you that you've stopped noticing? What would make everyday routines feel easier?",
    whatHappens: ["We walk through your space together and observe how it's actually used", "We ask about routines, frustrations, aspirations, and the moments that matter", "We identify the friction — the small daily irritations that accumulate into stress", "We look for the patterns that connect separate problems into a single system"],
    clientExperience: "This phase feels like being heard. You'll describe things you've accepted as normal that are actually design problems. That's the point.",
  },
  {
    number: "02", title: "Establish",
    summary: "We find the reference point — the priorities and constraints against which every decision is measured.",
    description: "Before designing anything, we need a reference point. What matters most? What can be adapted later? What is permanent and what is replaceable? This is the datum — the line from which every subsequent decision is measured.",
    whatHappens: ["We define priorities and constraints together — what must stay, what can change, what is flexible", "We establish the hierarchy: what matters most, what is secondary, what is optional", "We create a shared reference point that keeps every future decision aligned", "We set expectations for scope, timeline, and collaboration"],
    clientExperience: "This phase brings clarity. The vague feeling that something isn't working becomes a clear picture of what needs to change and why.",
  },
  {
    number: "03", title: "Integrate",
    summary: "Space, objects, materials, and technology are developed as one system rather than separate products.",
    description: "This is where the design takes shape. Not as isolated components — a room here, a shelf there, a smart home system somewhere else — but as a single integrated system where every element supports the others.",
    whatHappens: ["We design the room, the storage, the lighting, and the technology as one coherent whole", "Every material, object, and system is chosen for how it works with everything else", "We develop detailed plans, specifications, and documentation", "We coordinate across disciplines — architecture, craft, technology — so nothing conflicts"],
    clientExperience: "This phase feels like pieces of a puzzle clicking into place. You'll start to see how everything connects, and the whole becomes greater than the sum of its parts.",
  },
  {
    number: "04", title: "Refine",
    summary: "We build, test, document, and simplify until the result feels natural, durable, and easy to maintain.",
    description: "Good design isn't finished when it's built. It's finished when it works effortlessly. We test, adjust, simplify, and document until every detail serves a purpose and nothing feels accidental.",
    whatHappens: ["We build and install with attention to craft and material honesty", "We test every system — does it work as designed? Does it feel natural?", "We simplify until nothing can be removed without losing function", "We document what we've built so it can be maintained, repaired, and evolved over time"],
    clientExperience: "This phase feels like settling in. The space starts working without effort. You stop thinking about the design and start enjoying it.",
  },
] as const;
