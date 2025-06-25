import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
    return (
        <SignIn redirectUrl="/dashboard" />
    )
};