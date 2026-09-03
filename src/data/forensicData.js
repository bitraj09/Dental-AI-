// Forensic odontology data — age estimation parameters
export const ageParameters = [
    {
        id: 'erupted_teeth',
        name: 'Erupted Teeth Count',
        description: 'Number and type of teeth that have fully erupted into the oral cavity.',
        ageRanges: [
            { range: '0-6 months', expected: 'No teeth or lower central incisors beginning' },
            { range: '6-12 months', expected: '4-8 deciduous teeth' },
            { range: '1-2 years', expected: '8-16 deciduous teeth' },
            { range: '2-6 years', expected: 'Full deciduous dentition (20 teeth)' },
            { range: '6-12 years', expected: 'Mixed dentition, permanent first molars and incisors erupting' },
            { range: '12-18 years', expected: 'Full permanent dentition minus third molars' },
            { range: '18-25 years', expected: 'Third molar eruption (variable)' },
            { range: '25+ years', expected: 'Complete permanent dentition (28-32 teeth)' },
        ],
        weight: 0.25,
    },
    {
        id: 'tooth_buds',
        name: 'Tooth Bud Presence',
        description: 'Developing tooth germs visible in radiograph indicating unerupted teeth forming in the jaw.',
        ageRanges: [
            { range: 'Birth', expected: 'Crypts for deciduous teeth visible' },
            { range: '3-4 years', expected: 'Permanent first molar and incisor buds developing' },
            { range: '5-7 years', expected: 'Premolar crypts and canine buds visible' },
            { range: '8-10 years', expected: 'Second premolar and second molar buds' },
            { range: '10-14 years', expected: 'Third molar buds forming (variable)' },
        ],
        weight: 0.2,
    },
    {
        id: 'root_apex_closure',
        name: 'Root Apex Closure',
        description: 'Degree of completion of root formation. Open apices indicate developing teeth; closed apices indicate maturity.',
        ageRanges: [
            { range: '6-9 years', expected: 'Open apices on permanent incisors and first molars' },
            { range: '9-12 years', expected: 'Apices closing on incisors, open on premolars' },
            { range: '12-16 years', expected: 'Most apices closed except second and third molars' },
            { range: '16-20 years', expected: 'Second molar apices closed, third molar apices still open' },
            { range: '20-25 years', expected: 'All apices closed including third molars' },
        ],
        weight: 0.25,
    },
    {
        id: 'pulp_chamber',
        name: 'Pulp Chamber Narrowing',
        description: 'Secondary dentin deposition narrows the pulp chamber over time. Significant narrowing indicates older age.',
        ageRanges: [
            { range: '<20 years', expected: 'Large, well-defined pulp chambers' },
            { range: '20-35 years', expected: 'Slight reduction in pulp chamber size' },
            { range: '35-50 years', expected: 'Moderate narrowing, secondary dentin visible' },
            { range: '50-65 years', expected: 'Significant narrowing, pulp horns receding' },
            { range: '65+ years', expected: 'Near-obliteration of pulp chamber in some teeth' },
        ],
        weight: 0.2,
    },
    {
        id: 'cementum_deposition',
        name: 'Cementum Deposition',
        description: 'Acellular cementum layers deposited annually on root surface. Thickening correlates with age.',
        ageRanges: [
            { range: '<20 years', expected: 'Thin cementum layer, smooth root surface' },
            { range: '20-40 years', expected: 'Moderate cementum, slight root surface texture' },
            { range: '40-60 years', expected: 'Thick cementum, especially at apex (hypercementosis may occur)' },
            { range: '60+ years', expected: 'Extensive cementum deposition, possible hypercementosis' },
        ],
        weight: 0.1,
    },
];

// Demirjian staging system for tooth development
export const demirjianStages = [
    { stage: 'A', description: 'Initial calcification at the top of the crypt (cusp tips)' },
    { stage: 'B', description: 'Fusion of calcification points; still separate from root' },
    { stage: 'C', description: 'Enamel formation complete at occlusal; dentin deposition begins' },
    { stage: 'D', description: 'Crown formation complete to the cemento-enamel junction' },
    { stage: 'E', description: 'Root length shorter than crown height; bifurcation begins in molars' },
    { stage: 'F', description: 'Root length equal to or greater than crown height; open apex' },
    { stage: 'G', description: 'Root walls parallel; partial apex closure' },
    { stage: 'H', description: 'Complete root development; apex fully closed' },
];

export default ageParameters;
