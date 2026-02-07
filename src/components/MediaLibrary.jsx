import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreVertical, Trash2, X, Plus, Clipboard, Image as ImageIcon } from 'lucide-react';
import { mediaService } from '../services/mediaService';

export default function MediaLibrary({ onBack }) {
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isPasting, setIsPasting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const storedImages = await mediaService.getImages();
            setImages(storedImages);
        } catch (err) {
            console.error('Failed to load images', err);
        }
    };

    const handlePaste = async (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                await saveImage(blob);
            }
        }
    };

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            for (const file of files) {
                await saveImage(file);
            }
        }
    };

    const saveImage = async (blob) => {
        setIsPasting(true);
        try {
            await mediaService.addImage(blob);
            await loadImages();
        } catch (err) {
            console.error('Failed to save image', err);
            alert('Failed to save image');
        } finally {
            setIsPasting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            try {
                await mediaService.deleteImage(id);
                await loadImages();
                setActiveMenu(null);
            } catch (err) {
                console.error('Failed to delete image', err);
            }
        }
    };

    const handleManualPaste = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        await saveImage(blob);
                        return;
                    }
                }
            }
            alert('No image found in clipboard. Please copy an image first.');
        } catch (err) {
            console.error('Clipboard access denied or failed', err);
            alert('To paste, please use Cmd+V / Ctrl+V or grant clipboard permissions.');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20" onPaste={handlePaste}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold">Media Library</h2>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Add Section */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={handleManualPaste}
                    disabled={isPasting}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 border-dashed hover:border-zinc-600 transition-all gap-2 group"
                >
                    <div className="p-3 rounded-full bg-zinc-950 border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                        <Clipboard className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Paste Image</span>
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 border-dashed hover:border-zinc-600 transition-all gap-2 group"
                >
                    <div className="p-3 rounded-full bg-zinc-950 border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                        <Plus className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Upload</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                        multiple
                    />
                </button>
            </div>

            {/* Pinterest Grid */}
            {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Your library is empty</p>
                    <p className="text-xs mt-1">Paste or upload images to get started</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative break-inside-avoid rounded-2xl overflow-hidden bg-zinc-900 group">
                            <img
                                src={image.url}
                                alt="Media"
                                className="w-full h-auto cursor-pointer active:scale-[0.98] transition-transform"
                                onClick={() => setSelectedImage(image)}
                            />

                            {/* 3 dots menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setActiveMenu(activeMenu === image.id ? null : image.id)}
                                    className="p-1.5 rounded-lg bg-black/50 backdrop-blur-md text-white border border-white/10"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeMenu === image.id && (
                                    <div className="absolute right-0 mt-1 w-32 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={() => handleDelete(image.id)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Full Screen Overlay */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-300">
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage.url}
                        alt="Full Screen"
                        className="max-w-full max-h-full object-contain p-4 animate-in zoom-in-95 duration-300"
                        onClick={() => setSelectedImage(null)}
                    />
                </div>
            )}

            {/* Click away for menu */}
            {activeMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setActiveMenu(null)}
                />
            )}
        </div>
    );
}
