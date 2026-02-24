// Dental conditions database for diagnosis module
const conditions = [
    {
        id: 'dental_caries',
        name: 'Dental Caries (Cavity)',
        description: 'Destruction of tooth structure caused by bacterial acid production. Appears as a radiolucent area on the tooth surface.',
        severityLevels: ['mild', 'moderate', 'severe'],
        recommendations: [
            'Mild: Fluoride treatment and monitoring',
            'Moderate: Dental restoration (filling)',
            'Severe: Root canal therapy or extraction if non-restorable',
        ],
        color: '#ef4444',
    },
    {
        id: 'periapical_lesion',
        name: 'Periapical Lesion',
        description: 'Radiolucent area at the apex of a tooth root, typically indicating chronic infection or granuloma.',
        severityLevels: ['mild', 'moderate', 'severe'],
        recommendations: [
            'Root canal treatment',
            'Apicoectomy if conventional treatment fails',
            'Extraction for non-restorable teeth',
        ],
        color: '#f97316',
    },
    {
        id: 'impacted_tooth',
        name: 'Impacted Tooth',
        description: 'A tooth that has failed to erupt into its expected position, often third molars (wisdom teeth).',
        severityLevels: ['mild', 'moderate', 'severe'],
        recommendations: [
            'Monitoring if asymptomatic',
            'Surgical extraction if causing pain or pathology',
            'Orthodontic traction for strategic teeth',
        ],
        color: '#8b5cf6',
    },
    {
        id: 'bone_loss',
        name: 'Alveolar Bone Loss',
        description: 'Loss of supporting alveolar bone around teeth, indicative of periodontal disease.',
        severityLevels: ['mild', 'moderate', 'severe'],
        recommendations: [
            'Mild: Scaling and root planing',
            'Moderate: Periodontal surgery, bone grafting',
            'Severe: Extraction may be required for hopeless prognosis teeth',
        ],
        color: '#f59e0b',
    },
    {
        id: 'root_fracture',
        name: 'Root Fracture',
        description: 'Fracture line visible in the root of a tooth, may be horizontal or vertical.',
        severityLevels: ['moderate', 'severe'],
        recommendations: [
            'Horizontal: Splinting and monitoring',
            'Vertical: Usually requires extraction',
        ],
        color: '#ef4444',
    },
    {
        id: 'calculus',
        name: 'Calculus (Tartar)',
        description: 'Calcified deposits on tooth surfaces, appearing as pointed radiopaque projections.',
        severityLevels: ['mild', 'moderate'],
        recommendations: [
            'Professional dental cleaning (prophylaxis)',
            'Scaling and root planing for subgingival calculus',
        ],
        color: '#a855f7',
    },
    {
        id: 'dentigerous_cyst',
        name: 'Dentigerous Cyst',
        description: 'Cyst associated with the crown of an unerupted tooth, appearing as a well-defined radiolucency.',
        severityLevels: ['moderate', 'severe'],
        recommendations: [
            'Surgical enucleation with removal of associated tooth',
            'Marsupialization for large cysts',
        ],
        color: '#a855f7',
    },
    {
        id: 'root_resorption',
        name: 'Root Resorption',
        description: 'Loss of root structure, either external (surface) or internal (within the root canal).',
        severityLevels: ['mild', 'moderate', 'severe'],
        recommendations: [
            'Identify and remove cause (e.g., orthodontic force)',
            'Root canal treatment if internal',
            'Extraction if extensive',
        ],
        color: '#06b6d4',
    },
    {
        id: 'supernumerary_tooth',
        name: 'Supernumerary Tooth',
        description: 'An additional tooth beyond the normal dental formula, may be erupted or unerupted.',
        severityLevels: ['mild', 'moderate'],
        recommendations: [
            'Extraction if causing crowding or pathology',
            'Monitor if asymptomatic and not affecting adjacent teeth',
        ],
        color: '#22c55e',
    },
    {
        id: 'widened_pdl',
        name: 'Widened PDL Space',
        description: 'Thickening of the periodontal ligament space around a tooth, possibly indicating occlusal trauma or infection.',
        severityLevels: ['mild', 'moderate'],
        recommendations: [
            'Occlusal adjustment',
            'Evaluate for pulp vitality',
            'Splinting if mobility is present',
        ],
        color: '#64748b',
    },
];

export default conditions;
