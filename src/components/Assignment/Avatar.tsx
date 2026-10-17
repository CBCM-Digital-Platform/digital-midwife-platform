import type { Person } from "@/types/assignment";

interface AvatarProps {
    person: Pick<Person, "name" | "initials" | "avatarUrl">;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function Avatar({ person, size = "md", className = "" }: AvatarProps) {
    const dimension =
        size === "sm"
            ? "size-6 text-[10px]"
            : size === "lg"
            ? "size-14 text-base"
            : "size-9 text-xs";

    if (person.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={person.avatarUrl}
                alt={person.name}
                className={`${dimension} shrink-0 rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <span
            aria-hidden
            className={`${dimension} flex shrink-0 items-center justify-center rounded-full bg-[#194611]/10 font-semibold text-[#194611] ${className}`}
        >
            {person.initials}
        </span>
    );
}