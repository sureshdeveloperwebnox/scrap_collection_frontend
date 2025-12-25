import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden border-none shadow-lg bg-white/50 backdrop-blur-sm rounded-[40px]">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-10 w-10 rounded-xl" />
                            </div>
                            <Skeleton className="h-3 w-32 mt-4" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 shadow-lg border-none bg-white rounded-[32px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-none bg-white rounded-[32px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-36" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-none bg-white rounded-[32px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-none bg-white rounded-[32px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
