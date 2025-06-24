import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
    return (
        <nav className="bg-white shadow px-6 py-4 flex justify-between">
            <span className="font-bold text-lg">
                SkillBridge
            </span>
            <UserButton afterSignOutUrl="">
            </UserButton>
        </nav>
    )
}