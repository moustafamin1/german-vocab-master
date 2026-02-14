import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreVertical, Trash2, X, Plus, Clipboard, Link as LinkIcon, Instagram, Play, Image as ImageIcon } from 'lucide-react';
import { mediaService } from '../services/mediaService';

export default function MediaLibrary({ onBack }) {
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isPasting, setIsPasting] = useState(false);
    const fileInputRef = useRef(null);

    // Swipe state
    const touchStart = useRef(null);
    const touchEnd = useRef(null);
    const minSwipeDistance = 50;

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

    const processUrl = async (url) => {
        const regex = /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/;
        const match = url?.trim().match(regex);

        if (!match) return false;

        const shortcode = match[1];
        const normalizedUrl = `https://www.instagram.com/reel/${shortcode}/`;
        const thumbnail = `https://www.instagram.com/p/${shortcode}/media/?size=l`;

        setIsPasting(true);
        try {
            await mediaService.addVideo(normalizedUrl, thumbnail);
            await loadImages();
            return true;
        } catch (err) {
            console.error('Failed to save video link', err);
            alert('Failed to save video link');
            return false;
        } finally {
            setIsPasting(false);
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
                    if (type === 'text/plain') {
                        const blob = await clipboardItem.getType(type);
                        const text = await blob.text();
                        if (await processUrl(text)) return;
                    }
                }
            }
        } catch (err) {
            console.warn('Clipboard read failed, trying readText', err);
            try {
                const text = await navigator.clipboard.readText();
                if (text && await processUrl(text)) return;
            } catch (textErr) {
                console.error('Clipboard fallback failed', textErr);
            }
        }
        alert('No image or valid Instagram link found in clipboard.');
    };

    const handleAddLink = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText && await processUrl(clipboardText)) {
                return;
            }
        } catch (err) {
            console.warn('Quick paste failed', err);
        }

        const url = prompt('Enter Instagram Reel URL:');
        if (!url) return;

        const success = await processUrl(url);
        if (!success) {
            alert('Invalid Instagram URL. Please use a link like https://www.instagram.com/reels/XXXXX/');
        }
    };

    // Navigation and Swipe
    const navigateImage = (direction) => {
        if (!selectedImage) return;
        const currentIndex = images.findIndex(img => img.id === selectedImage.id);
        let nextIndex = currentIndex + direction;

        if (nextIndex < 0) nextIndex = images.length - 1;
        if (nextIndex >= images.length) nextIndex = 0;

        setSelectedImage(images[nextIndex]);
    };

    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        };
    };

    const onTouchMove = (e) => {
        touchEnd.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        };
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;

        const distanceX = touchStart.current.x - touchEnd.current.x;
        const distanceY = touchStart.current.y - touchEnd.current.y;
        const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

        if (isHorizontalSwipe) {
            if (Math.abs(distanceX) > minSwipeDistance) {
                navigateImage(distanceX > 0 ? 1 : -1);
            }
        } else {
            // Check for swipe up (negative distanceY means moving up relative to start)
            if (distanceY > minSwipeDistance) {
                setSelectedImage(null);
            }
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddLink}
                        disabled={isPasting}
                        className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all"
                        title="Paste or Add Instagram Link"
                    >
                        <LinkIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleManualPaste}
                        disabled={isPasting}
                        className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all"
                        title="Paste Image"
                    >
                        <Clipboard className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all"
                        title="Upload Image"
                    >
                        <Plus className="w-5 h-5" />
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
                            {image.mediaType === 'video' ? (
                                <div
                                    className="relative cursor-pointer active:scale-[0.98] transition-all duration-300 aspect-[9/16] bg-zinc-900"
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <img
                                        src={image.thumbnail}
                                        alt="Instagram Reel"
                                        className="w-full h-full object-cover block"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center -z-0">
                                        <Instagram className="w-12 h-12 text-zinc-800" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 left-2 p-1 rounded-md bg-black/50 backdrop-blur-md z-10">
                                        <Instagram className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={image.url}
                                    alt="Media"
                                    className="w-full h-auto cursor-pointer active:scale-[0.98] transition-all duration-300"
                                    onClick={() => setSelectedImage(image)}
                                />
                            )}

                            {/* 3 dots menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(activeMenu === image.id ? null : image.id);
                                    }}
                                    className="p-1.5 rounded-lg bg-black/50 backdrop-blur-md text-white border border-white/10"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeMenu === image.id && (
                                    <div className="absolute right-0 mt-1 w-32 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(image.id);
                                            }}
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-300"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[60]"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {selectedImage.mediaType === 'video' ? (
                            <div className="w-full max-w-[400px] aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl relative">
                                <iframe
                                    src={`${selectedImage.url}embed/`}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    scrolling="no"
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                />
                            </div>
                        ) : (
                            <img
                                src={selectedImage.url}
                                alt="Full Screen"
                                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300 select-none"
                                draggable="false"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Click away for menu */}
            {activeMenu && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setActiveMenu(null)}
                />
            )}
        </div>
    );
}
