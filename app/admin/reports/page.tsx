import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flag } from "lucide-react"

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Báo cáo</h2>
                <p className="text-muted-foreground">Quản lý các báo cáo vi phạm từ người dùng.</p>
            </div>
            
            <div className="flex items-center justify-center p-12 border rounded-lg border-dashed">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Flag className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Chưa có báo cáo nào</h3>
                    <p className="text-sm text-muted-foreground">Hệ thống chưa ghi nhận báo cáo vi phạm nào.</p>
                </div>
            </div>
        </div>
    )
}
