'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiImage, FiX } from 'react-icons/fi';
import styles from './ImageUploader.module.css';

export default function ImageUploader({ onImageSelect, label = 'Upload Dental Radiograph' }) {
    const [preview, setPreview] = useState(null);
    const [fileName, setFileName] = useState('');

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setPreview(reader.result);
            onImageSelect?.(reader.result, file);
        };
        reader.readAsDataURL(file);
    }, [onImageSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp'] },
        maxFiles: 1,
        maxSize: 20 * 1024 * 1024,
    });

    const clearImage = (e) => {
        e.stopPropagation();
        setPreview(null);
        setFileName('');
        onImageSelect?.(null, null);
    };

    return (
        <div className={styles.wrapper}>
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="dropzone"
                        {...getRootProps()}
                        className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.25 }}
                    >
                        <input {...getInputProps()} />
                        <motion.div
                            className={styles.iconWrap}
                            animate={isDragActive ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <FiUploadCloud size={48} />
                        </motion.div>
                        <h3 className={styles.label}>{label}</h3>
                        <p className={styles.hint}>
                            {isDragActive ? 'Drop the radiograph here…' : 'Drag & drop an image or click to browse'}
                        </p>
                        <p className={styles.formats}>Supports PNG, JPG, WebP • Max 20 MB</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        className={styles.previewWrap}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div className={styles.previewHeader}>
                            <div className={styles.fileInfo}>
                                <FiImage size={18} />
                                <span>{fileName}</span>
                            </div>
                            <motion.button
                                className={styles.clearBtn}
                                onClick={clearImage}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <FiX size={18} />
                            </motion.button>
                        </div>
                        <div className={styles.previewImg}>
                            <img src={preview} alt="Uploaded radiograph" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
