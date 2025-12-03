
"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useAuth } from "@/components/providers/AuthProvider"
const page = () => {
    const { user } = useAuth()
    if (!user) {
        return null;
    }
    return (
        <div className="main">
            <div className="sidebar">
                <Avatar className="h-32 w-32 -mt-16 border-4 border-background">
                    <AvatarImage src={user.avatar || "https://github.com/shadcn.png"} />
                    <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="nav_menu">

                </div>
            </div>
            <div className="content">

            </div>
        </div>
    );
}

export default page;