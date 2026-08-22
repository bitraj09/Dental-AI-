'use client';
import { createContext, useContext, useState } from 'react';

const DentalStateContext = createContext();

export function DentalStateProvider({ children }) {
    // Landmarks Feature State
    const [landmarksImage, setLandmarksImage] = useState(null);
    const [landmarksImageSize, setLandmarksImageSize] = useState({ w: 800, h: 400 });
    const [landmarksState, setLandmarksState] = useState({
        results: [],
        summary: '',
        isValidXray: true,
        aiSource: null
    });

    // Diagnosis Feature State
    const [diagnosisImage, setDiagnosisImage] = useState(null);
    const [diagnosisImageSize, setDiagnosisImageSize] = useState({ w: 800, h: 400 });
    const [diagnosisState, setDiagnosisState] = useState({
        findings: [],
        summary: '',
        isValidXray: true,
        aiSource: null
    });

    // Forensics Feature State
    const [forensicsImage, setForensicsImage] = useState(null);
    const [forensicsImageSize, setForensicsImageSize] = useState({ w: 800, h: 400 });
    const [forensicsState, setForensicsState] = useState({
        result: null,
        summary: '',
        isValidXray: true,
        aiSource: null
    });

    // Helpers to reset state for each feature independently
    const resetLandmarksImage = () => {
        setLandmarksImage(null);
        setLandmarksState({
            results: [],
            summary: '',
            isValidXray: true,
            aiSource: null
        });
    };

    const resetDiagnosisImage = () => {
        setDiagnosisImage(null);
        setDiagnosisState({
            findings: [],
            summary: '',
            isValidXray: true,
            aiSource: null
        });
    };

    const resetForensicsImage = () => {
        setForensicsImage(null);
        setForensicsState({
            result: null,
            summary: '',
            isValidXray: true,
            aiSource: null
        });
    };

    return (
        <DentalStateContext.Provider value={{
            landmarksImage,
            setLandmarksImage,
            landmarksImageSize,
            setLandmarksImageSize,
            resetLandmarksImage,
            landmarksState,
            setLandmarksState,

            diagnosisImage,
            setDiagnosisImage,
            diagnosisImageSize,
            setDiagnosisImageSize,
            resetDiagnosisImage,
            diagnosisState,
            setDiagnosisState,

            forensicsImage,
            setForensicsImage,
            forensicsImageSize,
            setForensicsImageSize,
            resetForensicsImage,
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
