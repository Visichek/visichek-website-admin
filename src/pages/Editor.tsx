import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDebounce } from "react-use";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { BlockNoteEditor } from "@/components/BlockNoteEditor";
import { BlogSettingsDialog, BlogType } from "@/components/BlogSettingsDialog";
import { blogApi,CategoryItem } from "@/lib/api";
import "@blocknote/core/style.css";
import "@blocknote/react/style.css";
import { 
    ArrowLeft, Check, Loader2, AlertCircle, Settings, Send, FileText
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ FIX: Import corrected type
import useCategories from "@/hooks/useCategories";
import type { PartialBlock } from "@blocknote/core";
import { MediaUploaderModal } from "@/components/MediaUploaderWithCaptionComponent";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/PageHeader";

type BlockNoteDocument = PartialBlock<any>[];

export default function Editor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === "new";

    // Hook handles the specific API structure now
    const { categories, isLoading: categoriesLoading } = useCategories();

    const [articleId, setArticleId] = useState<string | null>(isNew ? null : id || null);
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [authorAvatar, setAuthorAvatar] = useState("");
    const [authorAffiliation, setAuthorAffiliation] = useState("");
    
    // ✅ FIX: Category state typed to CategoryItem
    const [category, setCategory] = useState<CategoryItem | null>(null);
    
    const [featureImageUrl, setFeatureImageUrl] = useState("");
    const [status, setStatus] = useState<"draft" | "published">("draft");
    const [blogType, setBlogType] = useState<BlogType>("normal");
    const [blogBlocks, setBlogBlocks] = useState<BlockNoteDocument>([]);

    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [hasLoadedContent, setHasLoadedContent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [didLoadArticleData, setDidLoadArticleData] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    // -----------------------------------------------------------------------
    // LOCAL STORAGE LOGIC
    // -----------------------------------------------------------------------
    const getLocalStorageKey = useCallback(
        (aid?: string | null) => `blog_draft_${aid || articleId || (isNew ? "new" : "unknown")}`,
        [articleId, isNew]
    );

    const saveToLocalStorage = useCallback(() => {
        if (isInitialLoad) return;
        try {
            const data = {
                title, authorName, authorAvatar, authorAffiliation, category,
                featureImageUrl, status, blogBlocks, blogType,
                lastSaved: Date.now(),
            };
            localStorage.setItem(getLocalStorageKey(), JSON.stringify(data));
        } catch (err) {
            console.error("LocalStorage Save Error", err);
        }
    }, [isInitialLoad, title, authorName, authorAvatar, authorAffiliation, category, featureImageUrl, status, blogBlocks, blogType, getLocalStorageKey]);

    const loadFromLocalStorage = useCallback((key: string) => {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            const localData = JSON.parse(data);

            setTitle(localData.title || "");
            setAuthorName(localData.authorName || "");
            setAuthorAvatar(localData.authorAvatar || "");
            setAuthorAffiliation(localData.authorAffiliation || "");
            
            // We load the object blindly here, the useEffect below will 
            // reconcile it with the official list using 'slug'
            setCategory(localData.category || null);
            
            setFeatureImageUrl(localData.featureImageUrl || "");
            setStatus(localData.status || "draft");
            setBlogBlocks(localData.blogBlocks || []);
            setBlogType(localData.blogType || "normal");
            
            setHasLoadedContent(true);
            setIsInitialLoad(false);
            toast.info("Restored local draft");
            return true;
        } catch (error) {
            console.error("LocalStorage Load Error", error);
            return false;
        }
    }, []);

    // -----------------------------------------------------------------------
    // DATA LOADING EFFECT (API / LOCAL)
    // -----------------------------------------------------------------------
    useEffect(() => {
        let mounted = true;
        
        const doLoad = async () => {
            if (didLoadArticleData) return;
            
            setIsLoading(true);

            if (!isNew && articleId) {
                try {
                    const response = await blogApi.getById(articleId);
                    const blog = response.data;
                    if (!mounted) return;

                    setTitle(blog.title || "");
                    setAuthorName(blog.author?.name || "");
                    setAuthorAvatar(blog.author?.avatarUrl || "");
                    setAuthorAffiliation(blog.author?.affiliation || "");
                    
                    // ✅ FIX: Set category. We assume blog.category is an object containing at least 'slug'
                    setCategory(blog.category || null);

                    setFeatureImageUrl(blog.featureImage?.url || "");
                    setStatus(blog.state || "draft");
                    setBlogType((blog.blogType as BlogType) || "normal");

                    let blocks = blog.currentPageBody ?? [];
                    if (typeof blocks === "string") {
                        try { blocks = JSON.parse(blocks); } catch (err) { blocks = []; }
                    }
                    setBlogBlocks(blocks);
                    setHasLoadedContent(true);
                    localStorage.removeItem(getLocalStorageKey()); 

                } catch (error: any) {
                    console.error("API Load failed:", error);
                    const restored = loadFromLocalStorage(getLocalStorageKey());
                    if (!restored && mounted) setHasLoadedContent(true);
                }
            } else {
                const restored = loadFromLocalStorage(getLocalStorageKey());
                if (!restored) {
                    setHasLoadedContent(true);
                }
            }

            if (mounted) {
                setIsInitialLoad(false);
                setIsLoading(false);
                setDidLoadArticleData(true);
            }
        };

        doLoad();
        return () => { mounted = false; };
    }, [articleId, isNew, getLocalStorageKey, loadFromLocalStorage, didLoadArticleData]);


    // -----------------------------------------------------------------------
    // ✅ FIX: CATEGORY RECONCILIATION & DEFAULTING
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!didLoadArticleData || categoriesLoading || categories.length === 0) return;

        // Case 1: No category set at all? Set default to first item.
        if (category === null) {
            setCategory(categories[0]);
            return;
        }

        // Case 2: Category exists (from saved data), but we want to ensure 
        // strict object equality with the list from the hook (using slug as ID).
        // This ensures Dropdowns highlighting works correctly.
        const matchingCategory = categories.find(c => c.slug === category.slug);
        
        if (matchingCategory && matchingCategory !== category) {
            setCategory(matchingCategory);
        }
    }, [didLoadArticleData, categoriesLoading, categories, category]);


    // Save on unmount
    useEffect(() => {
        return () => { saveToLocalStorage(); };
    }, [saveToLocalStorage]);


    // -----------------------------------------------------------------------
    // SAVE FUNCTION
    // -----------------------------------------------------------------------
    const resolveCategoryForSave = useCallback((): CategoryItem | null => {
        if (category) {
            return category;
        }

        if (categories.length > 0) {
            return categories[0];
        }

        return null;
    }, [category, categories]);

    const saveArticle = useCallback(async (overrideStatus?: "draft" | "published", overrideBlogType?: BlogType) => {
        if (isInitialLoad) return;
        if (categoriesLoading) return;

        const categoryForSave = resolveCategoryForSave();
        if (!categoryForSave) {
            setSaveStatus("error");
            return;
        }

        if (categoryForSave !== category) {
            setCategory(categoryForSave);
        }

        saveToLocalStorage();
        setSaveStatus("saving");

        const payload = {
            title,
            author: { name: authorName, avatarUrl: authorAvatar, affiliation: authorAffiliation },
            category: categoryForSave,
            featureImage: { url: featureImageUrl, altText: title || "Feature image" },
            state: overrideStatus || status,
            currentPageBody: blogBlocks,
            blogType: overrideBlogType || blogType
        };

        try {
            if (!articleId) {
                const response = await blogApi.create({ ...payload, state: "draft" });
                const savedBlog = response.data;
                // Note: Using savedBlog._id here. This is the BLOG ID, not category ID.
                setArticleId(savedBlog._id);
                
                // Swap local storage keys
                const oldKey = getLocalStorageKey("new");
                const newKey = getLocalStorageKey(savedBlog._id);
                const localDraft = localStorage.getItem(oldKey);
                if (localDraft) {
                    localStorage.setItem(newKey, localDraft);
                    localStorage.removeItem(oldKey);
                }

                navigate(`/admin/editor/${savedBlog._id}`, { replace: true });
                toast.success("Article created");
                localStorage.removeItem(`blog_draft_new`);
            } else {
                await blogApi.update(articleId, payload);
                localStorage.removeItem(getLocalStorageKey());
            }
            setSaveStatus("saved");
        } catch (error: any) {
            console.error("Save failed:", error);
            setSaveStatus("error");
            const msg = error?.response?.data?.detail || "Failed to save";
            toast.error(msg);
        }
    }, [articleId, title, authorName, authorAvatar, authorAffiliation, category, featureImageUrl, status, blogBlocks, blogType, saveToLocalStorage, isInitialLoad, navigate, getLocalStorageKey, categoriesLoading, resolveCategoryForSave]);

    useDebounce(() => {
        if (isInitialLoad || categoriesLoading || !resolveCategoryForSave()) return;
        saveArticle();
    }, 2000, [isInitialLoad, categoriesLoading, resolveCategoryForSave, saveArticle]);

    const handlePublish = () => {
        setStatus("published");
        toast.success("Article published!");
        saveArticle("published");
    };

    const handleUnpublish = () => {
        setStatus("draft");
        toast.success("Article moved to draft");
        saveArticle("draft");
    };

    const StatusIndicator = ({ className }: { className?: string }) => {
        if (saveStatus === "saving") return <Loader2 className={`animate-spin text-muted-foreground ${className || "w-4 h-4"}`} />;
        if (saveStatus === "error") return <AlertCircle className={`text-red-500 ${className || "w-4 h-4"}`} />;
        return <Check className={`text-green-500 ${className || "w-4 h-4"}`} />;
    };

    return (
        <AdminShell
            pageTitle={isNew ? "New article" : "Editor"}
            pageDescription="Write, refine, and publish stories inside the same editorial workspace as the rest of the admin."
            pageActions={
                <>
                    <MediaUploaderModal 
                        onUploadSuccess={() => window.location.reload()} 
                        mediaId={articleId} 
                        label="Add Media"
                        variant="ghost"
                    />
                    <BlogSettingsDialog
                        authorName={authorName}
                        setAuthorName={setAuthorName}
                        authorAvatar={authorAvatar}
                        setAuthorAvatar={setAuthorAvatar}
                        authorAffiliation={authorAffiliation}
                        setAuthorAffiliation={setAuthorAffiliation}
                        category={category ?? (categories[0] ?? null)}
                        setCategory={setCategory}
                        featureImageUrl={featureImageUrl}
                        setFeatureImageUrl={setFeatureImageUrl}
                        blogType={blogType}
                        setBlogType={setBlogType}
                    />
                    {status === "draft" ? (
                        <Button onClick={handlePublish} className="gap-2 rounded-full px-5">
                            Publish <Send className="w-4 h-4" /> 
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={handleUnpublish} className="rounded-full">
                            Unpublish
                        </Button>
                    )}
                </>
            }
            contentClassName="pb-24"
        >
            <div className="mx-auto max-w-5xl space-y-6">
                <PageHeader
                    title={title || (isNew ? "Untitled story" : "Editorial draft")}
                    description="Use the editor below to build the story body, update metadata, and keep publishing status in sync."
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => navigate("/admin")} className="rounded-full">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <Badge variant={status === "published" ? "default" : "secondary"} className="rounded-full px-3 py-1">
                                {status}
                            </Badge>
                            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground md:flex">
                                <StatusIndicator className="h-3 w-3" />
                                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Error'}
                            </div>
                        </div>
                    }
                />

                <div className="surface-panel space-y-6 p-5 sm:p-8">
                    <div className="relative group px-14">
                        <Input
                            placeholder="Article Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight border-none px-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/30 h-auto py-2 w-full"
                        />
                    </div>

                    <div className="flex px-14 items-center gap-3 text-sm text-muted-foreground pb-2">
                        {category && (
                            <button
                                type="button"
                                onClick={() => setIsCategoryDialogOpen(true)}
                                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <Badge variant="secondary" className="cursor-pointer rounded-sm font-normal hover:bg-secondary/80">
                                    {category.name}
                                </Badge>
                            </button>
                        )}
                        {authorName && <span>by {authorName}</span>}
                    </div>

                    <div className="min-h-[50vh] animate-in fade-in duration-500">
                        {hasLoadedContent || isNew ? (
                            <div className="not-prose -mx-4 sm:mx-0"> 
                                <BlockNoteEditor
                                    key={articleId || "new"}
                                    initialContent={blogBlocks}
                                    onChange={setBlogBlocks}
                                />
                            </div>
                        ) : isLoading ? (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                <p className="text-sm">Loading editor...</p>
                            </div>
                        ) : (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <FileText className="h-10 w-10 opacity-20" />
                                <p>Ready to write</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={category?.slug}
                                onValueChange={(slug) => {
                                    const selected = categories.find((item) => item.slug === slug) ?? null;
                                    setCategory(selected);
                                    setIsCategoryDialogOpen(false);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((item) => (
                                        <SelectItem key={item.slug} value={item.slug}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* MOBILE FOOTER */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-t border-border z-50 px-6 flex items-center justify-between safe-area-bottom">
                <MediaUploaderModal 
                    onUploadSuccess={() => window.location.reload()} 
                    mediaId={articleId} 
                    label="" 
                    variant="ghost"
                />
                <div className="text-xs text-muted-foreground font-medium">
                    {saveStatus === "saving" ? "Saving..." : "Synced"}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full">
                            <Settings className="w-6 h-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 mb-4">
                        <div className="p-2">
                             <BlogSettingsDialog
                                authorName={authorName}
                                setAuthorName={setAuthorName}
                                authorAvatar={authorAvatar}
                                setAuthorAvatar={setAuthorAvatar}
                                authorAffiliation={authorAffiliation}
                                setAuthorAffiliation={setAuthorAffiliation}
                                category={category ?? (categories[0] ?? null)}
                                setCategory={setCategory}
                                featureImageUrl={featureImageUrl}
                                setFeatureImageUrl={setFeatureImageUrl}
                                blogType={blogType}
                                setBlogType={setBlogType}
                            />
                        </div>
                        <DropdownMenuSeparator />
                        {status === "published" && (
                            <DropdownMenuItem onClick={handleUnpublish} className="text-destructive p-3 cursor-pointer">
                                Unpublish Article
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </AdminShell>
    );
}
