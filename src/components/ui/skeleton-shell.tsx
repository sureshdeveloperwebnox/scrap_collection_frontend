import { SidebarSkeleton } from "./skeleton-sidebar"
import { HeaderSkeleton } from "./skeleton-header"
import { DashboardSkeleton } from "./skeleton-dashboard"

export function ShellSkeleton() {
    return (
        <div className="flex h-screen bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800 overflow-hidden">
            <SidebarSkeleton />
            <div className="flex-1 flex flex-col min-w-0 h-full pl-[260px]">
                <div className="flex-1 flex flex-col bg-[#F3F4F7] rounded-tl-[3.5rem] shadow-2xl relative overflow-hidden">
                    <HeaderSkeleton />
                    <main className="flex-1 overflow-y-auto px-6 py-8">
                        <DashboardSkeleton />
                    </main>
                </div>
            </div>
        </div>
    )
}
