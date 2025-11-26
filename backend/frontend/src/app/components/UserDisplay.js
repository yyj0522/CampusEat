"use client";

import { useUserInteraction } from "../context/UserInteractionProvider";

export default function UserDisplay({ userTarget, context, children }) {
    const { openContextMenu } = useUserInteraction();

    if (!userTarget || !userTarget.id) {
        return <>{children}</>;
    }

    return (
        <span onContextMenu={(e) => openContextMenu(e, userTarget, context)}>
            {children}
        </span>
    );
}