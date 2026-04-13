import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ContentManagementMediaApi, fetchCategories, CategoryItem } from "@/lib/api";
import {
    Trash2,
    Search,
    Film,
    CheckSquare,
    Square,
    UploadCloud,
    LayoutGrid,
    List as ListIcon,
    Copy,
    Loader2,
    Filter,
    FileText,
    AlertTriangle,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import AnimatedContent from "@/components/AnimatedContent";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";

// --- Types ---
interface MediaItem {
    id: string;
    url: string;
    name: string;
    mediaType: "video" | "image";
    category: CategoryItem | string;
    date: number;
}

export default function MediaDashboard() {
    // --- Core State ---
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- Pagination State (Server Side) ---
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [hasMoreServerData, setHasMoreServerData] = useState(true);

    // --- Filter State (Client Side) ---
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    // --- Selection State ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // --- Upload State ---
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState("general");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Dialog State ---
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: React.ReactNode;
        action: () => Promise<void> | void;
        variant: "default" | "destructive";
        confirmText: string;
    }>({
        title: "",
        description: "",
        action: () => {},
        variant: "default",
        confirmText: "Continue"
    });

    const navigate = useNavigate();

    // --- 1. Data Loading ---

    useEffect(() => {
        fetchCategories()
            .then((data) => {
                // @ts-ignore 
                const list = Array.isArray(data) ? data : (data?.listOfCategories || []);
                setCategories(list);
            })
            .catch((err) => console.error("Cat load fail", err));
    }, []);

    const loadMediaChunk = useCallback(async () => {
        setIsLoading(true);
        try {
            const start = (page - 1) * itemsPerPage;
            const stop = page * itemsPerPage;
            
            const response = await ContentManagementMediaApi.list({ start, stop });
            // @ts-ignore
            const newData = Array.isArray(response) ? response : (response?.data || []);
            
            setMedia(prev => {
                if (page === 1) return newData;
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newData.filter((item: MediaItem) => !existingIds.has(item.id));
                return [...prev, ...uniqueNew];
            });

            setHasMoreServerData(newData.length === itemsPerPage);

        } catch (error) {
            console.error(error);
            toast.error("Could not load media library");
        } finally {
            setIsLoading(false);
        }
    }, [page, itemsPerPage]);

    useEffect(() => {
        loadMediaChunk();
    }, [loadMediaChunk]);

    // --- 2. Derived State (Filtering) ---

    const filteredMedia = useMemo(() => {
        return media.filter(item => {
            // 1. Search
            const query = searchQuery.toLowerCase();
            const nameMatch = item.name?.toLowerCase().includes(query) || false;
            const urlMatch = item.url?.toLowerCase().includes(query) || false;
            if (query && !nameMatch && !urlMatch) return false;

            // 2. Type
            if (filterType !== "all" && item.mediaType !== filterType) return false;

            // 3. Category
            // ✅ FIX: Map Name to Slug if needed
            if (filterCategory !== "all") {
                let itemSlug = "uncategorized";

                if (typeof item.category === 'object' && item.category !== null) {
                    // Case A: It's an object, use the slug directly
                    itemSlug = item.category.slug;
                } else if (typeof item.category === 'string') {
                    // Case B: It's a string (Name). We must find the corresponding slug.
                    // We look through the 'categories' array to find the slug for this name.
                    const foundCat = categories.find(c => c.name === item.category);
                    itemSlug = foundCat ? foundCat.slug : item.category; 
                    // Fallback: if lookup fails, assume the string might have been a slug
                }
                
                if (itemSlug !== filterCategory) return false;
            }

            return true;
        });
    }, [media, searchQuery, filterType, filterCategory, categories]); // ✅ Added categories to dependency array

    // --- 3. Selection Logic ---

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        const visibleIds = filteredMedia.map(m => m.id);
        const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach(id => next.delete(id));
            } else {
                visibleIds.forEach(id => next.add(id));
            }
            return next;
        });
    }, [filteredMedia, selectedIds]);

    const isAllVisibleSelected = filteredMedia.length > 0 && filteredMedia.every(m => selectedIds.has(m.id));
    const imageCount = media.filter((item) => item.mediaType === "image").length;
    const videoCount = media.filter((item) => item.mediaType === "video").length;

    // --- 4. Actions ---

    const triggerConfirm = (
        title: string, 
        description: React.ReactNode, 
        action: () => Promise<void> | void, 
        variant: "default" | "destructive" = "default",
        confirmText: string = "Continue"
    ) => {
        setConfirmConfig({ title, description, action, variant, confirmText });
        setConfirmOpen(true);
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        try {
            await ContentManagementMediaApi.upload(uploadFile, uploadCategory);
            toast.success("Uploaded successfully");
            setIsUploadOpen(false);
            setUploadFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setPage(1);
        } catch (e) {
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (idsToDelete: string[]) => {
        triggerConfirm(
            "Confirm Deletion",
            <span>Are you sure you want to <strong> delete {idsToDelete.length}</strong> file(s)? This action cannot be undone.</span>,
            async () => {
                const toastId = toast.loading("Deleting...");
                try {
                    await Promise.all(idsToDelete.map(id => ContentManagementMediaApi.delete(id)));
                    
                    setMedia(prev => prev.filter(item => !idsToDelete.includes(item.id)));
                    setSelectedIds(prev => {
                        const next = new Set(prev);
                        idsToDelete.forEach(id => next.delete(id));
                        return next;
                    });
                    toast.success("Deleted successfully");
                } catch (error) {
                    toast.error("Failed to delete some files");
                } finally {
                    toast.dismiss(toastId);
                }
            },
            "destructive",
            "Delete"
        );
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("URL Copied");
    };

    const getCategoryName = (cat: CategoryItem | string) => {
        if (typeof cat === 'object' && cat !== null) return cat.name;
        return cat || "Uncategorized";
    };

    return (
        <AdminShell
            pageTitle="Media"
            pageDescription="Organize image and video assets for stories, hero placements, and editorial updates."
            pageActions={
                <Button onClick={() => setIsUploadOpen(true)} className="rounded-full">
                    <UploadCloud className="h-4 w-4" />
                    Upload media
                </Button>
            }
        >
            <div className="space-y-6 pb-28">
                <PageHeader
                    title="Media library"
                    description="Search, filter, upload, and clean up reusable editorial assets without leaving the content workspace."
                    actions={
                        <Button onClick={() => setIsUploadOpen(true)} className="rounded-full md:hidden">
                            <UploadCloud className="h-4 w-4" />
                            Upload
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard label="Total assets" value={media.length} icon={<Film className="h-5 w-5" />} note="Loaded in the current workspace" />
                    <StatCard label="Images" value={imageCount} icon={<FileText className="h-5 w-5" />} note="Still visuals and feature images" />
                    <StatCard label="Videos" value={videoCount} icon={<LayoutGrid className="h-5 w-5" />} note="Motion assets and media embeds" />
                </div>

                {/* --- Toolbar --- */}
                <div className="surface-toolbar flex flex-col gap-4 p-3 sm:p-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search files..." 
                            className="pl-9 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/35 p-2">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            <Filter className="h-4 w-4 text-muted-foreground mr-1 hidden sm:block" />
                            
                            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                <SelectTrigger className="h-8 w-[110px] text-xs">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="image">Images</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="h-8 w-[130px] text-xs">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex overflow-hidden rounded-xl border border-border bg-card">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-secondary text-foreground' : 'bg-background text-muted-foreground'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <div className="w-[1px] bg-border" />
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-secondary text-foreground' : 'bg-background text-muted-foreground'}`}
                            >
                                <ListIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Select All Bar --- */}
                {filteredMedia.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 hover:text-foreground font-medium transition-colors"
                        >
                            {isAllVisibleSelected 
                                ? <CheckSquare className="h-5 w-5 text-primary" /> 
                                : <Square className="h-5 w-5" />
                            }
                            {isAllVisibleSelected ? 'Deselect' : 'Select'} All ({filteredMedia.length})
                        </button>
                    </div>
                )}

                {/* --- Content --- */}
                {filteredMedia.length === 0 && !isLoading ? (
                    <div className="surface-panel py-20 text-center border-2 border-dashed">
                        <p className="text-muted-foreground">No files found.</p>
                        <Button variant="link" onClick={() => {setSearchQuery(''); setFilterCategory('all'); setFilterType('all')}}>Clear Filters</Button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                                {filteredMedia.map((item) => (
                                    <MediaGridItem 
                                        key={item.id} 
                                        item={item} 
                                        isSelected={selectedIds.has(item.id)} 
                                        onToggle={() => toggleSelection(item.id)}
                                        onCopy={() => copyUrl(item.url)}
                                        categoryName={getCategoryName(item.category)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredMedia.map((item) => (
                                    <MediaListItem 
                                        key={item.id} 
                                        item={item} 
                                        isSelected={selectedIds.has(item.id)} 
                                        onToggle={() => toggleSelection(item.id)}
                                        onCopy={() => copyUrl(item.url)}
                                        categoryName={getCategoryName(item.category)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- Load More --- */}
                <div className="flex justify-center pt-4">
                {hasMoreServerData ? (
                            <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={isLoading}>
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Load More
                            </Button>
                        ) : (
                            <p className="text-xs text-muted-foreground">All items loaded</p>
                        )}
                </div>

            </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                    <DialogDescription>Select an image or video (max 300MB).</DialogDescription>
                </DialogHeader>
                
                {/* Upload UI */}
                <div 
                    className="mt-4 border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                    {uploadFile ? (
                        <div className="text-center">
                            <CheckSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-sm font-medium">{uploadFile.name}</p>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <UploadCloud className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Tap to select</p>
                        </div>
                    )}
                </div>
                
                <div className="space-y-2 mt-4">
                    <Label>Category</Label>
                    <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        
                        {categories.map(c => <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>

                <DialogFooter className="mt-4">
                    <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                        {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

            {/* --- Floating Action Bar (For Selection) --- */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 inset-x-0 px-4 flex justify-center z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <div className="flex w-full max-w-md items-center justify-between rounded-[1.35rem] border border-border bg-card p-3 text-card-foreground shadow-[0_16px_38px_rgba(15,23,42,0.12)]">
                            <div className="flex items-center gap-3">
                                <Badge variant="default" className="h-7 px-3">{selectedIds.size}</Badge>
                                <span className="text-sm font-medium hidden sm:inline">selected</span>
                                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedIds(new Set())}>
                                    Cancel
                                </Button>
                            </div>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleDelete(Array.from(selectedIds))}
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </div>
                </div>
            )}

            {/* SHADCN ALERT DIALOG */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {confirmConfig.variant === 'destructive' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                            {confirmConfig.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                Promise.resolve(confirmConfig.action()).then(() => setConfirmOpen(false));
                            }}
                            className={confirmConfig.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            {confirmConfig.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminShell>
    );
}

// --- Sub-Components ---

function MediaGridItem({ item, isSelected, onToggle, onCopy, categoryName }: any) {
    return (
        <AnimatedContent>
            <Card 
                className={`group relative aspect-square overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                onClick={onToggle}
            >
                {/* Image/Video Render */}
                <div className="w-full h-full bg-secondary/30">
                    {item.mediaType === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/5">
                            <Film className="h-8 w-8 text-muted-foreground" />
                            <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-50" muted loop playsInline />
                        </div>
                    ) : (
                        <img 
                            src={item.url} 
                            loading="lazy" 
                            alt={item.name} 
                            className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-90' : 'group-hover:scale-105'}`} 
                        />
                    )}
                </div>

                {/* Selection Checkbox */}
                <div className={`absolute top-2 left-2 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className={`rounded border border-white/70 bg-background/90 text-primary ${isSelected ? 'block' : ''}`}>
                        {isSelected ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6 text-muted-foreground" />}
                    </div>
                </div>

                {/* Hover Actions Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-200 ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                     <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="p-0"
                    >
                        <Button size="icon" variant="secondary" className="rounded-full h-9 w-9">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </a>
                    <Button size="icon" variant="secondary" className="rounded-full h-9 w-9" onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                    <p className="text-white text-xs font-medium truncate">{item.name || "Untitled"}</p>
                    <p className="text-white/70 text-[10px] truncate">{categoryName}</p>
                </div>
            </Card>
        </AnimatedContent>
    );
}

function MediaListItem({ item, isSelected, onToggle, onCopy, categoryName }: any) {
    return (
        <AnimatedContent>
            <Card 
                className={`flex items-center p-2 gap-3 cursor-pointer transition-colors group ${isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-secondary/20'}`}
                onClick={onToggle}
            >
                <div className="pl-2" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 -m-1" onClick={onToggle}>
                        {isSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                    </button>
                </div>
                
                <div className="h-12 w-12 rounded bg-secondary overflow-hidden shrink-0">
                    {item.mediaType === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center"><Film className="h-5 w-5 text-muted-foreground"/></div>
                    ) : (
                        <img src={item.url} className="w-full h-full object-cover" loading="lazy" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{categoryName}</Badge>
                        <span className="text-sm text-muted-foreground uppercase">{item.mediaType}</span>
                    </div>
                </div>

                 <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </a>

                <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); onCopy()}}>
                    <Copy className="h-4 w-4" />
                </Button>
            </Card>
        </AnimatedContent>
    );
}
