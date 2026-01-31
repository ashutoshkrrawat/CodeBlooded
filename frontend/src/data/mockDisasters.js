export const mockDisasters = [
  {
    _id: "mock-1",
    title: "Severe Flooding in Delhi NCR",
    description:
      "Continuous heavy rainfall has caused severe flooding in low-lying areas. Evacuations underway.",
    location: "Delhi",
    status: "OPEN",
    date: "2026-01-30T06:02:23.418Z",
    coordinates: {
      type: "Point",
      coordinates: [77.1025, 28.7041], // Delhi
    },
    aiAnalysis: {
      severity: {
        overall: 0.85,
      },
      urgency: {
        level: "critical",
        is_urgent: true,
      },
      priority: {
        level: "CRITICAL",
      },
      explanation: {
        content:
          "Major flood impact detected. High population density and infrastructure risk.",
      },
    },
  },

  {
    _id: "mock-2",
    title: "Heatwave Alert in Rajasthan",
    description:
      "Extreme temperatures recorded across multiple districts. Health advisory issued.",
    location: "Rajasthan",
    status: "OPEN",
    date: "2026-01-29T10:15:00.000Z",
    coordinates: {
      type: "Point",
      coordinates: [75.7873, 26.9124], // Jaipur
    },
    aiAnalysis: {
      severity: {
        overall: 0.62,
      },
      urgency: {
        level: "high",
        is_urgent: true,
      },
      priority: {
        level: "HIGH",
      },
      explanation: {
        content:
          "Sustained heatwave poses significant health risks, especially for vulnerable populations.",
      },
    },
  },

  {
    _id: "mock-3",
    title: "Localised Dengue Outbreak in Assam",
    description:
      "Increase in dengue cases reported in urban clusters. Medical teams deployed.",
    location: "Assam",
    status: "OPEN",
    date: "2026-01-28T08:40:00.000Z",
    coordinates: {
      type: "Point",
      coordinates: [91.7362, 26.1445], // Guwahati
    },
    aiAnalysis: {
      severity: {
        overall: 0.38,
      },
      urgency: {
        level: "moderate",
        is_urgent: false,
      },
      priority: {
        level: "MEDIUM",
      },
      explanation: {
        content:
          "Disease spread is currently limited but requires monitoring and early intervention.",
      },
    },
  },
];
