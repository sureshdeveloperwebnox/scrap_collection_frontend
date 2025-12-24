import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SidebarSkeletonProps {
    isCollapsed?: boolean
}

export function SidebarSkeleton({ isCollapsed = false }: SidebarSkeletonProps) {
    return (
        <div className={cn(
            "fixed left-0 top-0 flex flex-col z-50 h-screen sidebar-wrapper",
            "bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800",
            isCollapsed ? "lg:w-20" : "w-[260px]"
        )}>
            {/* Brand Section Skeleton */}
            <div className={cn(
                "flex items-center px-6 py-8 flex-shrink-0 animate-pulse",
                isCollapsed ? "lg:px-3 lg:justify-center" : "gap-3"
            )}>
                <Skeleton className="w-12 h-12 rounded-2xl bg-white/20" />
                {!isCollapsed && <Skeleton className="h-6 w-24 bg-white/20" />}
            </div>

            {/* Nav Items Skeleton */}
            <nav className="flex-1 px-4 py-4 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-full",
                        isCollapsed && "lg:justify-center lg:px-0"
                    )}>
                        <Skeleton className="w-5 h-5 rounded-md bg-white/20 flex-shrink-0" />
                        {!isCollapsed && <Skeleton className="h-4 w-full bg-white/20 max-w-[120px]" />}
                    </div>
                ))}
            </nav>

            {/* User Section Skeleton */}
            <div className="p-4 mt-auto border-t border-white/10 bg-black/5 animate-pulse">
                <div className={cn(
                    "bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3",
                    isCollapsed && "lg:p-2 lg:flex-col lg:items-center lg:gap-4 lg:bg-transparent lg:border-transparent"
                )}>
                    <Skeleton className="w-10 h-10 rounded-xl bg-white/20 flex-shrink-0" />
                    {!isCollapsed && (
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-20 bg-white/20" />
                            <Skeleton className="h-2 w-12 bg-white/20 opacity-50" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
