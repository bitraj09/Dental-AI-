/**
 * Sample radiograph data — uses real OPG X-ray images from /public/samples/.
 * These allow users to test modules without uploading their own files.
 */

const sampleRadiographs = [
    {
        id: 'sample-1',
        name: 'Adult OPG — Normal',
        description: 'Adult panoramic radiograph showing full dentition',
        src: '/samples/2b4594c3db1ddd939a3646c9eec656_big_gallery.jpeg',
    },
    {
        id: 'sample-2',
        name: 'Adult OPG — Pathology',
        description: 'Adult panoramic radiograph with visible dental conditions',
        src: '/samples/bd417306aa798e1d7f3a9d01088ec5_big_gallery.jpeg',
    },
    {
        id: 'sample-3',
        name: 'Dental Panoramic',
        description: 'High-resolution dental panoramic X-ray for analysis',
        src: '/samples/ce76f196d49069dba67520e91241663719417d5d7ccfa38e72c87f1ca351558d_big_gallery.png',
    },
];

/**
 * Loads sample images by converting from /public paths to data URLs.
 * This is needed so the same image data flows through the uploader pipeline.
 */
export async function loadSampleImage(src) {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

export default sampleRadiographs;
