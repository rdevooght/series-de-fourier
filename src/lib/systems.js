export const SYSTEMS_CONFIG = {
    standard: {
        id: "standard",
        label: "Standard (½, sin, cos)",
        families: [
            {
                id: "cos",
                title: "Termes cosinus",
                plotTitle: "aₖ · cos(2kπx/(b-a))",
                coefPrefix: "a",
            },
            {
                id: "sin",
                title: "Termes sinus",
                plotTitle: "bₖ · sin(2kπx/(b-a))",
                coefPrefix: "b",
            },
        ],
    },
    cos: {
        id: "cos",
        label: "Cosinus",
        families: [
            {
                id: "cos",
                title: "Termes cosinus",
                plotTitle: "aₖ · cos(kπ(x-a)/(b-a))",
                coefPrefix: "a",
            },
        ],
    },
    sin: {
        id: "sin",
        label: "Sinus",
        families: [
            {
                id: "sin",
                title: "Termes sinus",
                plotTitle: "bₖ · sin(kπ(x-a)/(b-a))",
                coefPrefix: "b",
            },
        ],
    },
    chebyshev: {
        id: "chebyshev",
        label: "Tchebychev",
        families: [
            {
                id: "T",
                title: "Polynômes de Tchebychev Tₖ",
                plotTitle: "aₖ · Tₖ(x)",
                coefPrefix: "T",
            },
        ],
    },
    legendre: {
        id: "legendre",
        label: "Legendre",
        families: [
            {
                id: "P",
                title: "Polynômes de Legendre Pₖ",
                plotTitle: "aₖ · Pₖ(x)",
                coefPrefix: "P",
            },
        ],
    },
};

export const SYSTEM_ORDER = Object.keys(SYSTEMS_CONFIG);

export const SAMPLE_FUNCTIONS = [
    {
        name: "sin(x)",
        func: (x) => Math.sin(x),
        domain: [-Math.PI, Math.PI],
    },
    {
        name: "x²",
        func: (x) => x ** 2,
        domain: [-2, 2],
    },
    {
        name: "e^x",
        func: (x) => Math.exp(x),
        domain: [-1, 1],
    },
    {
        name: "step",
        func: (x) => (x > 0 ? 1 : -1),
        domain: [-1, 1],
    },
    {
        name: "dents de scie",
        func: (x) => x - Math.floor(x),
        domain: [0, 1],
    },
];
