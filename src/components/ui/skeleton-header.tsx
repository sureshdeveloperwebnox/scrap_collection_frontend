import { Skeleton } from "@/components/ui/skeleton"

export function HeaderSkeleton() {
    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 animate-pulse">
            {/* Left side: Toggle + Page Title */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-32 hidden sm:block" />
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md mx-8 hidden lg:block">
                <Skeleton className="h-10 w-full rounded-2xl" />
            </div>

            {/* Right side: Notifications + Profile */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mr-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
                <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block space-y-1">
                        <Skeleton className="h-3 w-20 ml-auto" />
                        <Skeleton className="h-2 w-12 ml-auto" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl ring-2 ring-gray-50" />
                </div>
            </div>
        </header>
    )
}
