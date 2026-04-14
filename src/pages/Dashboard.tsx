import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { blogApi, fetchCategories, type Category } from "@/lib/api";
import {
    AlertTriangle,
    ArrowDownUp,
    Edit3,
    FileEdit,
    Filter,
    MoreHorizontal,
    PenLine,
    Search,
    Trash2,
    UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

// --- Types ---
interface Blog {
    _id: string;
    title: string;
    state: "draft" | "published";
    author: { name: string };
    category: { name: string; slug: string };
    dateCreated: number;
    lastUpdated: number;
    excerpt: string;
    blogType: "normal" | "editors pick" | "hero section" | "featured story";
    totalItems: number;
    itemIndex: number;
}

type TabKey = "all" | "draft" | "published";
type SortKey = "updated_desc" | "updated_asc" | "created_desc" | "created_asc";

const sortLabels: Record<SortKey, string> = {
    updated_desc: "Last updated — newest",
    updated_asc: "Last updated — oldest",
    created_desc: "Date created — newest",
    created_asc: "Date created — oldest",
};

export default function Dashboard() {
    const navigate = useNavigate();

    // Data
    const [categories, setCategories] = useState<Category | null>(null);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [sortCriteria, setSortCriteria] = useState<SortKey>("updated_desc");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Confirm dialog
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
        confirmText: "Continue",
    });

    const allCategoryItems = categories?.listOfCategories ?? [];

    // Load data
    useEffect(() => {
        loadBlogs();
    }, []);

    useEffect(() => {
        let mounted = true;
        fetchCategories()
            .then((data) => {
                if (!mounted) return;
                setCategories(data ?? null);
            })
            .catch((err) => {
                console.error("Failed to fetch categories", err);
                toast.error("Failed to load categories");
            });
        return () => {
            mounted = false;
        };
    }, []);

    const loadBlogs = async () => {
        try {
            const response = await blogApi.list({ start: 0, stop: 1000 });
            setBlogs(response.data || []);
        } catch {
            toast.error("Failed to load blogs");
        } finally {
            setIsLoading(false);
        }
    };

    // Counts
    const counts = useMemo(() => ({
        all: blogs.length,
        drafts: blogs.filter((b) => b.state === "draft").length,
        published: blogs.filter((b) => b.state === "published").length,
    }), [blogs]);

    // Filtering + sorting
    const sortedAndFilteredBlogs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = blogs.filter((blog) => {
            const matchesSearch =
                !q ||
                blog.title.toLowerCase().includes(q) ||
                (blog.excerpt || "").toLowerCase().includes(q);
            const matchesCategory =
                selectedCategory === "all" || blog.category?.slug === selectedCategory;
            const matchesType =
                selectedType === "all" || (blog.blogType || "normal") === selectedType;
            const matchesTab = activeTab === "all" || blog.state === activeTab;
            return matchesSearch && matchesCategory && matchesTab && matchesType;
        });

        return filtered.sort((a, b) => {
            const [field, direction] = sortCriteria.split("_");
            const aValue = field === "updated" ? a.lastUpdated : a.dateCreated;
            const bValue = field === "updated" ? b.lastUpdated : b.dateCreated;
            if (aValue === bValue) return 0;
            return direction === "asc" ? (aValue < bValue ? -1 : 1) : aValue > bValue ? -1 : 1;
        });
    }, [blogs, searchQuery, selectedCategory, selectedType, activeTab, sortCriteria]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedType, activeTab, sortCriteria, itemsPerPage]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredBlogs.length / itemsPerPage));
    const paginatedBlogs = sortedAndFilteredBlogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Confirm helper
    const triggerConfirm = (
        title: string,
        description: React.ReactNode,
        action: () => Promise<void> | void,
        variant: "default" | "destructive" = "default",
        confirmText = "Continue",
    ) => {
        setConfirmConfig({ title, description, action, variant, confirmText });
        setConfirmOpen(true);
    };

    // Actions
    const handleDelete = (id: string, title: string) => {
        triggerConfirm(
            "Delete story?",
            <span>
                This permanently removes <strong>&ldquo;{title}&rdquo;</strong>. You can&apos;t undo this.
            </span>,
            async () => {
                try {
                    await blogApi.delete(id);
                    toast.success("Story deleted");
                    loadBlogs();
                    setSelectedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                } catch {
                    toast.error("Failed to delete story");
                }
            },
            "destructive",
            "Delete",
        );
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAllOnPage = () => {
        const allOnPageSelected =
            paginatedBlogs.length > 0 && paginatedBlogs.every((b) => selectedIds.has(b._id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) {
                paginatedBlogs.forEach((b) => next.delete(b._id));
            } else {
                paginatedBlogs.forEach((b) => next.add(b._id));
            }
            return next;
        });
    };

    const performMassAction = (action: "delete" | "publish" | "draft") => {
        if (selectedIds.size === 0) return;
        const actionText =
            action === "delete" ? "delete" : action === "publish" ? "publish" : "revert to draft";
        const variant = action === "delete" ? "destructive" : "default";

        triggerConfirm(
            `Confirm ${action === "delete" ? "deletion" : "update"}`,
            <span>
                Are you sure you want to <strong>{actionText} {selectedIds.size}</strong> item
                {selectedIds.size === 1 ? "" : "s"}?
            </span>,
            async () => {
                const toastId = toast.loading(`Processing ${selectedIds.size} items…`);
                try {
                    const ids = Array.from(selectedIds);
                    await Promise.all(
                        ids.map((id) => {
                            if (action === "delete") return blogApi.delete(id);
                            if (action === "publish")
                                return blogApi.update(id, { state: "published" });
                            if (action === "draft")
                                return blogApi.update(id, { state: "draft" });
                            return Promise.resolve();
                        }),
                    );
                    toast.dismiss(toastId);
                    toast.success(
                        `${action === "delete" ? "Deleted" : "Updated"} ${ids.length} item${
                            ids.length === 1 ? "" : "s"
                        }`,
                    );
                    setSelectedIds(new Set());
                    loadBlogs();
                } catch {
                    toast.dismiss(toastId);
                    toast.error("Some operations failed. Please try again.");
                }
            },
            variant,
            action === "delete" ? "Delete all" : "Confirm",
        );
    };

    // Helpers
    const formatDate = (timestamp: number) =>
        new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const typeLabels: Record<string, string> = {
        "hero section": "Hero",
        "featured story": "Featured",
        "editors pick": "Editor's pick",
    };

    const hasActiveFilter =
        selectedCategory !== "all" || selectedType !== "all" || itemsPerPage !== 10;
    const activeFilterCount =
        (selectedCategory !== "all" ? 1 : 0) +
        (selectedType !== "all" ? 1 : 0) +
        (itemsPerPage !== 10 ? 1 : 0);

    const tabs: { id: TabKey; label: string; count: number }[] = [
        { id: "all", label: "All stories", count: counts.all },
        { id: "draft", label: "Drafts", count: counts.drafts },
        { id: "published", label: "Published", count: counts.published },
    ];

    const allOnPageSelected =
        paginatedBlogs.length > 0 && paginatedBlogs.every((b) => selectedIds.has(b._id));

    return (
        <AdminShell pageTitle="Articles">
            <div className="mx-auto max-w-5xl px-6 pb-28 pt-10 md:px-8 md:pt-14">
                {/* Header */}
                <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                            Your stories
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage drafts, published stories, and editorial placements.
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate("/admin/editor/new")}
                        className="gap-2 self-start rounded-full px-5 md:self-auto"
                    >
                        <Edit3 className="h-4 w-4" />
                        Write a story
                    </Button>
                </header>

                {/* Tabs */}
                <div className="mb-6 flex gap-8 border-b border-border">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "-mb-px border-b-2 pb-4 text-sm font-medium transition-colors",
                                    active
                                        ? "border-foreground text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {tab.label}
                                <span
                                    className={cn(
                                        "ml-2 rounded-full px-2 py-0.5 text-xs",
                                        active
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground/70",
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search + Filter/Sort */}
                <div className="mb-4 flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center">
                    <div className="group relative w-full sm:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                        <Input
                            type="text"
                            placeholder="Search stories…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 rounded-full border-transparent bg-muted/60 pl-10 pr-4 text-sm transition-colors hover:bg-muted focus-visible:border-border focus-visible:bg-background focus-visible:ring-0"
                        />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {selectedIds.size > 0 && (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                                {selectedIds.size} selected
                            </span>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                                    <Filter className="h-4 w-4" /> Filter
                                    {activeFilterCount > 0 && (
                                        <span className="ml-1 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Category
                                    </Label>
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={setSelectedCategory}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All categories</SelectItem>
                                            {allCategoryItems.map((cat) => (
                                                <SelectItem key={cat.slug} value={cat.slug}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Type
                                    </Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All types</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="featured story">Featured</SelectItem>
                                            <SelectItem value="hero section">Hero</SelectItem>
                                            <SelectItem value="editors pick">
                                                Editor&apos;s pick
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Rows per page
                                    </Label>
                                    <Select
                                        value={String(itemsPerPage)}
                                        onValueChange={(v) => setItemsPerPage(Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {hasActiveFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedCategory("all");
                                            setSelectedType("all");
                                            setItemsPerPage(10);
                                        }}
                                    >
                                        Reset filters
                                    </Button>
                                )}
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                                    <ArrowDownUp className="h-4 w-4" /> Sort
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-60 p-1">
                                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setSortCriteria(key)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                                            sortCriteria === key
                                                ? "bg-muted font-medium text-foreground"
                                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                        )}
                                    >
                                        {sortLabels[key]}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
                        <p className="text-sm">Loading stories…</p>
                    </div>
                ) : paginatedBlogs.length === 0 ? (
                    <div className="py-20 text-center text-sm text-muted-foreground">
                        {blogs.length === 0
                            ? "No stories yet. Start writing one."
                            : "No stories match your filters."}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="mb-2 flex items-center gap-4 border-b border-border py-3">
                            <Checkbox
                                checked={allOnPageSelected}
                                onCheckedChange={toggleSelectAllOnPage}
                                aria-label="Select all on this page"
                            />
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Select all
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                                {(currentPage - 1) * itemsPerPage + 1}–
                                {Math.min(currentPage * itemsPerPage, sortedAndFilteredBlogs.length)}{" "}
                                of {sortedAndFilteredBlogs.length}
                            </span>
                        </div>

                        {paginatedBlogs.map((blog) => {
                            const isSelected = selectedIds.has(blog._id);
                            const typeLabel =
                                blog.blogType && blog.blogType !== "normal"
                                    ? typeLabels[blog.blogType] ?? blog.blogType
                                    : null;

                            return (
                                <div
                                    key={blog._id}
                                    className="group -mx-4 flex items-start gap-4 rounded-xl border-b border-border px-4 py-6 transition-colors hover:bg-muted/40"
                                >
                                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(blog._id)}
                                            aria-label={`Select ${blog.title}`}
                                            className={cn(
                                                "transition-opacity sm:opacity-100",
                                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                            )}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/admin/editor/${blog._id}`)}
                                        className="min-w-0 flex-1 text-left"
                                    >
                                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                            {blog.state === "draft" && (
                                                <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                                                    Draft
                                                </span>
                                            )}
                                            {blog.state === "published" && (
                                                <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                                                    Published
                                                </span>
                                            )}
                                            {typeLabel && (
                                                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {typeLabel}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                Last edited {formatDate(blog.lastUpdated)}
                                            </span>
                                        </div>

                                        <h2 className="mb-1 font-display text-xl font-semibold tracking-tight text-foreground decoration-muted-foreground/40 underline-offset-4 group-hover:underline sm:text-2xl">
                                            {blog.title || "Untitled story"}
                                        </h2>

                                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                            {blog.excerpt || "No excerpt yet."}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            {blog.author?.name && (
                                                <span>{blog.author.name}</span>
                                            )}
                                            {blog.author?.name && blog.category?.name && <span>·</span>}
                                            {blog.category?.name && (
                                                <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground/80">
                                                    {blog.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    <div className="pt-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                                                    aria-label="Actions"
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/admin/editor/${blog._id}`)}
                                                    className="gap-2"
                                                >
                                                    <PenLine className="h-4 w-4" />
                                                    Edit story
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(blog._id, blog.title)}
                                                    className="gap-2 text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && sortedAndFilteredBlogs.length > 0 && (
                    <div className="flex items-center justify-center gap-6 py-12 text-sm text-muted-foreground">
                        <button
                            className="transition-colors hover:text-foreground disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className="tabular-nums">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="transition-colors hover:text-foreground disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Mass actions floating bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 z-40 w-[95%] max-w-2xl -translate-x-1/2 animate-in fade-in slide-in-from-bottom-10">
                    <div className="flex items-center justify-between gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium">{selectedIds.size} selected</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds(new Set())}
                                className="h-8 px-2 text-muted-foreground"
                            >
                                Clear
                            </Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => performMassAction("draft")}
                                className="gap-1.5 rounded-full"
                            >
                                <FileEdit className="h-4 w-4" />
                                <span className="hidden sm:inline">To draft</span>
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => performMassAction("publish")}
                                className="gap-1.5 rounded-full"
                            >
                                <UploadCloud className="h-4 w-4" />
                                <span className="hidden sm:inline">Publish</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => performMassAction("delete")}
                                className="gap-1.5 rounded-full"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {confirmConfig.variant === "destructive" && (
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            )}
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
                                Promise.resolve(confirmConfig.action()).then(() =>
                                    setConfirmOpen(false),
                                );
                            }}
                            className={
                                confirmConfig.variant === "destructive"
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : ""
                            }
                        >
                            {confirmConfig.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminShell>
    );
}
