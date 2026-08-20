'use client';
import { createContext, useContext, useState } from 'react';

const DentalStateContext = createContext();

export function DentalStateProvider({ children }) {
    const [sharedImage, setSharedImage] = useState(null);
    const [imageSize, setImageSize] = useState({ w: 800, h: 400 });

    const [landmarksState, setLandmarksState] = useState({
        results: [],
        summary: '',
        isValidXray: true,
        aiSource: null
    });

    const [diagnosisState, setDiagnosisState] = useState({
        findings: [],
        summary: '',
        isValidXray: true,
        aiSource: null
    });

    const [forensicsState, setForensicsState] = useState({
        result: null,
        summary: '',
        isValidXray: true,
        aiSource: null
    });

    // Helper to update the active image (resets results for all pages if it changes)
    const updateActiveImage = (newImage, size = null) => {
        setSharedImage(newImage);
        if (size) {
            setImageSize(size);
        }
        
        // Reset analysis results when a new image is loaded
        setLandmarksState({
            results: [],
            summary: '',
            isValidXray: true,
            aiSource: null
        });
        setDiagnosisState({
            findings: [],
            summary: '',
            isValidXray: true,
            aiSource: null
        });
        setForensicsState({
            result: null,
            summary: '',
            isValidXray: true,
            aiSource: null
        });
    };

    return (
        <DentalStateContext.Provider value={{
            sharedImage,
            setSharedImage,
            imageSize,
            setImageSize,
            updateActiveImage,
            
            landmarksState,
            setLandmarksState,
            
            diagnosisState,
            setDiagnosisState,
            
            forensicsState,
            setForensicsState
        }}>
            {children}
        </DentalStateContext.Provider>
    );
}

export function useDentalState() {
    const context = useContext(DentalStateContext);
    if (!context) {
        throw new Error('useDentalState must be used within a DentalStateProvider');
    }
    return context;
}
